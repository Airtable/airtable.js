'use strict';

var forEach = require('lodash/forEach');
var get = require('lodash/get');
var assign = require('lodash/assign');
var isPlainObject = require('lodash/isPlainObject');

// This will become require('xhr') in the browser.
var request = require('request');

var AirtableError = require('./airtable_error');
var Table = require('./table');
var HttpHeaders = require('./http_headers');
var runAction = require('./run_action');
var packageVersion = require('./package_version');
var exponentialBackoffWithJitter = require('./exponential_backoff_with_jitter');
var Promise = require('./promise');

var userAgent = 'Airtable.js/' + packageVersion;

function Base(airtable, baseId) {
    this._airtable = airtable;
    this._id = baseId;
}

Base.prototype.table = function(tableName) {
    return new Table(this, null, tableName);
};

Base.prototype.makeRequest = function(options) {
    var that = this;

    options = options || {};

    var method = get(options, 'method', 'GET').toUpperCase();

    var requestOptions = {
        method: method,
        url:
            this._airtable._endpointUrl +
            '/v' +
            this._airtable._apiVersionMajor +
            '/' +
            this._id +
            get(options, 'path', '/'),
        qs: get(options, 'qs', {}),
        headers: this._getRequestHeaders(get(options, 'headers', {})),
        json: true,
        timeout: this._airtable.requestTimeout,
    };
    if ('body' in options && _canRequestMethodIncludeBody(method)) {
        requestOptions.body = options.body;
    }

    return new Promise(function(resolve, reject) {
        request(requestOptions, function(err, response, body) {
            if (!err && response.statusCode === 429 && !that._airtable._noRetryIfRateLimited) {
                var numAttempts = get(options, '_numAttempts', 0);
                var backoffDelayMs = exponentialBackoffWithJitter(numAttempts);
                setTimeout(function() {
                    var newOptions = assign({}, options, {
                        _numAttempts: numAttempts + 1,
                    });
                    that.makeRequest(newOptions)
                        .then(resolve)
                        .catch(reject);
                }, backoffDelayMs);
                return;
            }

            if (err) {
                err = new AirtableError('CONNECTION_ERROR', err.message, null);
            } else {
                err =
                    that._checkStatusForError(response.statusCode, body) ||
                    _getErrorForNonObjectBody(response.statusCode, body);
            }

            if (err) {
                reject(err);
                return;
            }

            resolve({
                statusCode: response.statusCode,
                headers: response.headers,
                body: body,
            });
        });
    });
};

// This method is deprecated.
Base.prototype.runAction = function(method, path, queryParams, bodyData, callback) {
    runAction(this, method, path, queryParams, bodyData, callback, 0);
};

Base.prototype._getRequestHeaders = function(headers) {
    var result = new HttpHeaders();

    result.set('Authorization', 'Bearer ' + this._airtable._apiKey);
    result.set('User-Agent', userAgent);
    forEach(headers, function(headerValue, headerKey) {
        result.set(headerKey, headerValue);
    });

    return result.toJSON();
};

Base.prototype._checkStatusForError = function(statusCode, body) {
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
        return (function() {
            var message =
                body && body.error && body.error.message
                    ? body.error.message
                    : 'Could not find what you are looking for';
            return new AirtableError('NOT_FOUND', message, statusCode);
        })();
    } else if (statusCode === 413) {
        return new AirtableError('REQUEST_TOO_LARGE', 'Request body is too large', statusCode);
    } else if (statusCode === 422) {
        return (function() {
            var type =
                body && body.error && body.error.type ? body.error.type : 'UNPROCESSABLE_ENTITY';
            var message =
                body && body.error && body.error.message
                    ? body.error.message
                    : 'The operation cannot be processed';
            return new AirtableError(type, message, statusCode);
        })();
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
        return (function() {
            var type = body && body.error && body.error.type ? body.error.type : 'UNEXPECTED_ERROR';
            var message =
                body && body.error && body.error.message
                    ? body.error.message
                    : 'An unexpected error occurred';
            return new AirtableError(type, message, statusCode);
        })();
    } else {
        return null;
    }
};

Base.prototype.doCall = function(tableName) {
    return this.table(tableName);
};

Base.prototype.getId = function() {
    return this._id;
};

Base.createFunctor = function(airtable, baseId) {
    var base = new Base(airtable, baseId);
    var baseFn = function() {
        return base.doCall.apply(base, arguments);
    };
    forEach(['table', 'makeRequest', 'runAction', 'getId'], function(baseMethod) {
        baseFn[baseMethod] = base[baseMethod].bind(base);
    });
    baseFn._base = base;
    baseFn.tables = base.tables;
    return baseFn;
};

function _canRequestMethodIncludeBody(method) {
    return method !== 'GET' && method !== 'DELETE';
}

function _getErrorForNonObjectBody(statusCode, body) {
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

module.exports = Base;
