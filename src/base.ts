import forEach from 'lodash/forEach';
import get from 'lodash/get';
import assign from 'lodash/assign';
import isPlainObject from 'lodash/isPlainObject';
import fetch from './fetch';
import AbortController from './abort-controller';
import objectToQueryParamString from './object_to_query_param_string';
import AirtableError from './airtable_error';
import Table from './table';
import HttpHeaders from './http_headers';
import runAction from './run_action';
import packageVersion from './package_version';
import exponentialBackoffWithJitter from './exponential_backoff_with_jitter';
import type Airtable from './airtable';

const userAgent = `Airtable.js/${packageVersion}`;

type BaseRequestOptions = {
    method?: string;
    path?: string;
    qs?: Record<string, any>;
    headers?: Record<string, any>;
    body?: Record<string, any>;
    _numAttempts?: number;
};

type BaseResponse = Response & {statusCode: Response['status']};

type AirtableBase = {
    (tableName: string): Table;
    _base: Base;
    getId(): string;
    makeRequest(options: BaseRequestOptions): Promise<BaseResponse>;
    table(tableName: string): Table;
};

class Base {
    readonly _airtable: Airtable;
    readonly _id: string;

    constructor(airtable: Airtable, baseId: string) {
        this._airtable = airtable;
        this._id = baseId;
    }

    table(tableName: string) {
        return new Table(this, null, tableName);
    }

    makeRequest(options: BaseRequestOptions = {}) {
        const method = get(options, 'method', 'GET').toUpperCase();

        const url = `${this._airtable._endpointUrl}/v${this._airtable._apiVersionMajor}/${
            this._id
        }${get(options, 'path', '/')}?${objectToQueryParamString(get(options, 'qs', {}))}`;

        const controller = new AbortController();

        const requestOptions: RequestInit = {
            method,
            headers: this._getRequestHeaders(get(options, 'headers', {})),
            signal: controller.signal,
        };

        if ('body' in options && _canRequestMethodIncludeBody(method)) {
            requestOptions.body = JSON.stringify(options.body);
        }

        const timeout = setTimeout(() => {
            controller.abort();
        }, this._airtable.requestTimeout);

        return new Promise((resolve, reject) => {
            fetch(url, requestOptions)
                .then((resp: BaseResponse) => {
                    clearTimeout(timeout);
                    resp.statusCode = resp.status;
                    if (resp.status === 429 && !this._airtable._noRetryIfRateLimited) {
                        const numAttempts = get(options, '_numAttempts', 0);
                        const backoffDelayMs = exponentialBackoffWithJitter(numAttempts);
                        setTimeout(() => {
                            const newOptions = assign({}, options, {
                                _numAttempts: numAttempts + 1,
                            });
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
    runAction(method, path, queryParams, bodyData, callback) {
        runAction(this, method, path, queryParams, bodyData, callback, 0);
    }

    _getRequestHeaders(headers) {
        const result = new HttpHeaders();

        result.set('Authorization', `Bearer ${this._airtable._apiKey}`);
        result.set('User-Agent', userAgent);
        result.set('Content-Type', 'application/json');
        forEach(headers, (headerValue, headerKey) => {
            result.set(headerKey, headerValue);
        });

        return result.toJSON();
    }

    _checkStatusForError(statusCode, body) {

        const {
            error = {}
        } = body ?? {error: {}};

        const {
            type,
            message
        } = error;

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
            return new AirtableError(
                'REQUEST_TOO_LARGE',
                'Request body is too large',
                statusCode
            );
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

    doCall(tableName) {
        return this.table(tableName);
    }

    getId() {
        return this._id;
    }

    static createFunctor(airtable: Airtable, baseId: string): AirtableBase {
        const base = new Base(airtable, baseId);
        const baseFn = tableName => {
            return base.doCall(tableName);
        };
        forEach(['table', 'makeRequest', 'runAction', 'getId'], baseMethod => {
            baseFn[baseMethod] = base[baseMethod].bind(base);
        });
        baseFn._base = base;
        return baseFn as AirtableBase;
    }
}

function _canRequestMethodIncludeBody(method) {
    return method !== 'GET' && method !== 'DELETE';
}

function _getErrorForNonObjectBody(statusCode, body?) {
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
