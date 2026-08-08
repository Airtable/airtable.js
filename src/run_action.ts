import exponentialBackoffWithJitter from './exponential_backoff_with_jitter';
import objectToQueryParamString from './object_to_query_param_string';
import fetch from './fetch';
import AbortController from './abort-controller';
import Base from './base';

/* eslint-disable @typescript-eslint/no-explicit-any */
type ActionBody = any;
type ActionError = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type ActionParams = {[key: string]: ActionBody};
type ActionResponse = {-readonly [key in keyof Response]: Response[key]} & {statusCode: number};
type ActionCallback = (error: ActionError, response?: ActionResponse, body?: ActionBody) => void;

function runAction(
    base: Base,
    method: string,
    path: string,
    queryParams: ActionParams,
    bodyData: ActionBody,
    callback: ActionCallback,
    numAttempts: number
): void {
    const url = `${base._airtable._endpointUrl}/v${base._airtable._apiVersionMajor}/${
        base._id
    }${path}?${objectToQueryParamString(queryParams)}`;

    // Use the same header construction as makeRequest so customHeaders work
    const headers = base._getRequestHeaders({
        'x-api-version': base._airtable._apiVersion,
        'x-airtable-application-id': base.getId(),
        ...base._airtable._customHeaders,
    });

    const controller = new AbortController();
    const normalizedMethod = method.toUpperCase();
    const options: RequestInit = {
        method: normalizedMethod,
        headers,
        signal: controller.signal,
    };

    if (bodyData !== null) {
        if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') {
            console.warn('body argument to runAction are ignored with GET or HEAD requests');
        } else {
            options.body = JSON.stringify(bodyData);
        }
    }

    const timeout = setTimeout(() => {
        controller.abort();
    }, base._airtable._requestTimeout);

    fetch(url, options)
        .then(resp => {
            clearTimeout(timeout);
            if (resp.status === 429 && !base._airtable._noRetryIfRateLimited) {
                const backoffDelayMs = exponentialBackoffWithJitter(numAttempts);
                setTimeout(() => {
                    runAction(base, method, path, queryParams, bodyData, callback, numAttempts + 1);
                }, backoffDelayMs);
            } else {
                resp.json()
                    .then(body => {
                        const error = base._checkStatusForError(resp.status, body);
                        // Ensure Response interface matches interface from
                        // `request` Response object
                        const r = {} as ActionResponse;
                        Object.keys(resp).forEach(property => {
                            r[property] = resp[property];
                        });
                        r.body = body;
                        r.statusCode = resp.status;
                        callback(error, r, body);
                    })
                    .catch(function() {
                        callback(base._checkStatusForError(resp.status));
                    });
            }
        })
        .catch(error => {
            clearTimeout(timeout);
            callback(error);
        });
}

/* eslint-disable no-redeclare, @typescript-eslint/no-namespace */
namespace runAction {
    /* eslint-enable no-redeclare, @typescript-eslint/no-namespace */
    export type Body = ActionBody;
    export type Params = ActionParams;
    export type Callback = ActionCallback;
}

export = runAction;
