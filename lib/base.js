'use strict';

var _ = require('lodash');
var internalConfig = require('./internal_config');
var Class = require('./class');
var AirtableError = require('./airtable_error');
var Table = require('./table');

var jQuery;

var Base = Class.extend({
    init: function(airtable, baseId) {
        this._airtable = airtable;
        this._id = baseId;
    },

    table: function(tableName) {
        return new Table(this, null, tableName);
    },

    runAction: function(method, path, queryParams, bodyData, callback) {
        if (_.isUndefined(jQuery)) {
            this.runActionInNode(method, path, queryParams, bodyData, callback);
        } else {
            this.runActionWithJQuery(method, path, queryParams, bodyData, callback);
        }
    },
    runActionInNode: function(method, path, queryParams, bodyData, callback) {
        var that = this;
        var request = require('request');
        var url = this._airtable._endpointUrl+'/v' + this._airtable._apiVersionMajor + '/' + this._id + path;

        request[method]({
            url: url,
            qs: queryParams,
            body: bodyData,

            json: true,
            timeout: internalConfig.REQUEST_TIMEOUT,
            auth: {
                bearer: this._airtable._apiKey
            },
            agentOptions: {
                rejectUnauthorized: this._airtable._allowUnauthorizedSsl
            },
            headers: {
                'X-API-VERSION': this._airtable._apiVersion
            }
        }, function(error, resp, body) {
            if (error) {
                callback(error, resp, body);
                return;
            }

            if(resp.statusCode===429 && !that._airtable._noRetryIfRateLimited){
                setTimeout(function(){
                    that.runActionInNode(method, path, queryParams, bodyData, callback);
                }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
                return;
            }

            error = that._checkStatusForError(resp.statusCode, body);

            if (error) {
                callback(error, resp, body);
                return;
            }

            callback(error, resp, body);
        });
    },
    runActionWithJQuery: function(method, path, queryParams, bodyData, callback) {
        var that = this;

        var url = this._airtable._endpointUrl+'/v' + this._airtable._apiVersionMajor + '/' + this._id + path + '?' + jQuery.param(queryParams);

        jQuery.ajax(url, {
            contentType: 'application/json',
            type: method,

            data: bodyData,
            dataType: 'json',
            timeout: internalConfig.REQUEST_TIMEOUT,

            headers: {
                'Authorization': 'Bearer ' + this._airtable._apiKey,
                'X-API-VERSION': this._airtable._apiVersion
            },
            success: function(data, textStatus, jqXHR) {
                callback(null, null, data);
            },
            error: function(jqXHR, textStatus) {
                var error;
                if(jqXHR.statusCode()===429 && !that._airtable._noRetryIfRateLimited){
                    setTimeout(function(){
                        that.runActionWithJQuery(method, path, queryParams, bodyData, callback);
                    }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
                    return;
                }
                error = that._checkStatusForError(jqXHR.statusCode(), jqXHR.respnoseText);
                callback(error);
            }
        });
    },
    _checkStatusForError: function(statusCode, body) {
        if (statusCode === 401) {
            return new AirtableError('AUTHENTICATION_REQUIRED', 'You should provide valid api key to perform this operation', statusCode);
        } else if (statusCode === 403) {
            return new AirtableError('NOT_AUTHORIZED', 'You are not authorized to perform this operation', statusCode);
        } else if (statusCode === 404) {
            return (function(){
                var message = (body && body.error && body.error.message) ? body.error.message : 'Could not find what you are looking for';
                return new AirtableError('NOT_FOUND', message, statusCode);
            })();
        } else if (statusCode === 413) {
            return new AirtableError('REQUEST_TOO_LARGE', 'Request body is too large', statusCode);
        } else if (statusCode === 422) {
            return new AirtableError(body.error.type, body.error.message, statusCode);
        } else if (statusCode === 429) {
            return new AirtableError('TOO_MANY_REQUESTS', 'You have made too many requests in a short period of time. Please retry your request later', statusCode);
        }else if (statusCode === 500) {
            return new AirtableError('SERVER_ERROR', 'Try again. If the problem persists, contact support.', statusCode);
        } else if (statusCode === 503) {
            return new AirtableError('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please retry shortly.', statusCode);
        }
    },

    doCall: function(tableName) {
        return this.table(tableName);
    },

    getId: function() {
        return this._id;
    }
});

Base.createFunctor = function(airtable, baseId) {
    var base = new Base(airtable, baseId);
    var baseFn = function() {
        return base.doCall.apply(base, arguments);
    };
    _.each(['table', 'runAction', 'getId'], function(baseMethod) {
        baseFn[baseMethod] = base[baseMethod].bind(base);
    });
    baseFn._base = base;
    baseFn.tables = base.tables;
    return baseFn;
};

module.exports = Base;
