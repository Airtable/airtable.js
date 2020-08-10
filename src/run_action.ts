import exponentialBackoffWithJitter from './exponential_backoff_with_jitter';
import objectToQueryParamString from './object_to_query_param_string';
import packageVersion from './package_version';
import fetch from './fetch';
import AbortController from './abort-controller';

const userAgent = `Airtable.js/${packageVersion}`;

function runAction(base, method, path, queryParams, bodyData, callback, numAttempts) {
    const url = `${base._airtable._endpointUrl}/v${base._airtable._apiVersionMajor}/${
        base._id
    }${path}?${objectToQueryParamString(queryParams)}`;

    const headers = {
        authorization: `Bearer ${base._airtable._apiKey}`,
        'x-api-version': base._airtable._apiVersion,
        'x-airtable-application-id': base.getId(),
        'content-type': 'application/json',
    };
    const isBrowser = typeof window !== 'undefined';
    // Some browsers do not allow overriding the user agent.
    // https://github.com/Airtable/airtable.js/issues/52
    if (isBrowser) {
        headers['x-airtable-user-agent'] = userAgent;
    } else {
        headers['User-Agent'] = userAgent;
    }

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
    }, base._airtable.requestTimeout);

    fetch(url, options)
        .then((resp: Response & {statusCode: Response['status']}) => {
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
                        const r = {} as any;
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

export = runAction;
