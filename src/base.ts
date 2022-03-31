import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import keys from 'lodash/keys';
import fetch from './fetch';
import AbortController from './abort-controller';
import objectToQueryParamString from './object_to_query_param_string';
import AirtableError from './airtable_error';
import Table from './table';
import HttpHeaders from './http_headers';
import runAction from './run_action';
import packageVersion from './package_version';
import exponentialBackoffWithJitter from './exponential_backoff_with_jitter';
import Airtable from './airtable';
import {AirtableBase} from './airtable_base';
import {FieldSet} from './field_set';

const userAgent = `Airtable.js/${packageVersion}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
type BaseBody = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface BaseRequestOptions {
    method?: string;
    path?: string;
    qs?: Record<string, BaseBody>;
    headers?: Record<string, string>;
    body?: BaseBody;
    _numAttempts?: number;
}

interface BaseResponse {
    statusCode: Response['status'];
    headers: Response['headers'];
    body: BaseBody;
}

class Base {
    readonly _airtable: Airtable;
    readonly _id: string;

    constructor(airtable: Airtable, baseId: string) {
        this._airtable = airtable;
        this._id = baseId;
    }

    table<TFields extends FieldSet>(tableName: string): Table<TFields> {
        return new Table<TFields>(this, null, tableName);
    }

    makeRequest(options: BaseRequestOptions = {}): Promise<BaseResponse> {
        const method = get(options, 'method', 'GET').toUpperCase();

        const url = `${this._airtable._endpointUrl}/v${this._airtable._apiVersionMajor}/${
            this._id
        }${get(options, 'path', '/')}?${objectToQueryParamString(get(options, 'qs', {}))}`;

        const controller = new AbortController();
        const headers = this._getRequestHeaders(
            Object.assign({}, this._airtable._customHeaders, options.headers ?? {})
        );

        const requestOptions: RequestInit = {
            method,
            headers,
            signal: controller.signal,
        };

        if ('body' in options && _canRequestMethodIncludeBody(method)) {
            requestOptions.body = JSON.stringify(options.body);
        }

        const timeout = setTimeout(() => {
            controller.abort();
        }, this._airtable._requestTimeout);

        return new Promise((resolve, reject) => {
            fetch(url, requestOptions)
                .then((resp: Response) => {
                    clearTimeout(timeout);
                    if (resp.status === 429 && !this._airtable._noRetryIfRateLimited) {
                        const numAttempts = get(options, '_numAttempts', 0);
                        const backoffDelayMs = exponentialBackoffWithJitter(numAttempts);
                        setTimeout(() => {
                            const newOptions = {
                                ...options,
                                _numAttempts: numAttempts + 1,
                            };
                            this.makeRequest(newOptions)
                                .then(resolve)
                                .catch(reject);
                        }, backoffDelayMs);
                    } else {
                        resp.json()
                            .then(body => {
                                const err =
                                    this._checkStatusForError(resp.status, body) ||
                                    _getErrorForNonObjectBody(resp.status, body);

                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({
                                        statusCode: resp.status,
                                        headers: resp.headers,
                                        body,
                                    });
                                }
                            })
                            .catch(() => {
                                const err = _getErrorForNonObjectBody(resp.status);
                                reject(err);
                            });
                    }
                })
                .catch(err => {
                    clearTimeout(timeout);
                    err = new AirtableError('CONNECTION_ERROR', err.message, null);
                    reject(err);
                });
        });
    }

    /**
     * @deprecated This method is deprecated.
     */
    runAction(
        method: string,
        path: string,
        queryParams: runAction.Params,
        bodyData: runAction.Body,
        callback: runAction.Callback
    ): void {
        runAction(this, method, path, queryParams, bodyData, callback, 0);
    }

    _getRequestHeaders(headers: {[key: string]: string}): {[key: string]: string} {
        const result = new HttpHeaders();

        result.set('Authorization', `Bearer ${this._airtable._apiKey}`);
        result.set('User-Agent', userAgent);
        result.set('Content-Type', 'application/json');
        for (const headerKey of keys(headers)) {
            result.set(headerKey, headers[headerKey]);
        }

        return result.toJSON();
    }

    _checkStatusForError(statusCode: number, body?: BaseBody): null | AirtableError {
        const {error = {}} = body ?? {error: {}};

        const {type, message} = error;

        if (statusCode === 401) {
            return new AirtableError(
                'AUTHENTICATION_REQUIRED',
                'You should provide valid api key to perform this operation',
                statusCode
            );
        } else if (statusCode === 403) {
            return new AirtableError(
                'NOT_AUTHORIZED',
                'You are not authorized to perform this operation',
                statusCode
            );
        } else if (statusCode === 404) {
            return new AirtableError(
                'NOT_FOUND',
                message ?? 'Could not find what you are looking for',
                statusCode
            );
        } else if (statusCode === 413) {
            return new AirtableError('REQUEST_TOO_LARGE', 'Request body is too large', statusCode);
        } else if (statusCode === 422) {
            return new AirtableError(
                type ?? 'UNPROCESSABLE_ENTITY',
                message ?? 'The operation cannot be processed',
                statusCode
            );
        } else if (statusCode === 429) {
            return new AirtableError(
                'TOO_MANY_REQUESTS',
                'You have made too many requests in a short period of time. Please retry your request later',
                statusCode
            );
        } else if (statusCode === 500) {
            return new AirtableError(
                'SERVER_ERROR',
                'Try again. If the problem persists, contact support.',
                statusCode
            );
        } else if (statusCode === 503) {
            return new AirtableError(
                'SERVICE_UNAVAILABLE',
                'The service is temporarily unavailable. Please retry shortly.',
                statusCode
            );
        } else if (statusCode >= 400) {
            return new AirtableError(
                type ?? 'UNEXPECTED_ERROR',
                message ?? 'An unexpected error occurred',
                statusCode
            );
        } else {
            return null;
        }
    }

    doCall<TFields extends FieldSet>(tableName: string): Table<TFields> {
        return this.table<TFields>(tableName);
    }

    getId(): string {
        return this._id;
    }

    static createFunctor(airtable: Airtable, baseId: string): AirtableBase {
        const base = new Base(airtable, baseId);
        const baseFn = <TFields extends FieldSet>(tableName) => {
            return base.doCall<TFields>(tableName);
        };
        baseFn._base = base;
        baseFn.table = base.table.bind(base);
        baseFn.makeRequest = base.makeRequest.bind(base);
        baseFn.runAction = base.runAction.bind(base);
        baseFn.getId = base.getId.bind(base);
        return baseFn as AirtableBase;
    }
}

function _canRequestMethodIncludeBody(method: string) {
    return method !== 'GET' && method !== 'DELETE';
}

function _getErrorForNonObjectBody(statusCode: number, body?) {
    if (isPlainObject(body)) {
        return null;
    } else {
        return new AirtableError(
            'UNEXPECTED_ERROR',
            'The response from Airtable was invalid JSON. Please try again soon.',
            statusCode
        );
    }
}

export = Base;
