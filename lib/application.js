'use strict';

var _ = require('lodash');

var Class = require('./class');
var AirtableError = require('./airtable_error');
var Table = require('./table');

var jQuery;

var Application = Class.extend({
    init: function(airtable, applicationId) {
        this._airtable = airtable;
        this._id = applicationId;
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
            timeout: 30000,
            auth: {
                bearer: this._airtable._apiKey
            },
            headers: {
                'X-API-VERSION': this._airtable._apiVersion
            }
        }, function(error, resp, body) {
            if (error) {
                callback(error, resp, body);
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
            timeout: 30000,

            headers: {
                'Authorization': 'Bearer ' + this._airtable._apiKey,
                'X-API-VERSION': this._airtable._apiVersion
            },
            success: function(data, textStatus, jqXHR) {
                callback(null, null, data);
            },
            error: function(jqXHR, textStatus) {
                var error;
                if (textStatus === "timeout") {
                    error = that._checkStatusForError(503);
                } else if (textStatus === "abort") {
                    error = that._checkStatusForError(500);
                } else if (textStatus === "parsererror") {
                    error = that._checkStatusForError(500);
                } else if (textStatus === "error") {
                    error = that._checkStatusForError(500);
                    //error = that._checkStatusForError(jqXHR.statusCode(), jqXHR.);
                } else {
                    error = "Unknown error";
                }

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
            return new AirtableError('NOT_FOUND', body.error.message || 'Could not find what you are looking for', statusCode);
        } else if (statusCode === 413) {
            return new AirtableError('REQUEST_TOO_LARGE', 'Request body is too large', statusCode);
        } else if (statusCode === 422) {
            return new AirtableError(body.error.type, body.error.message, statusCode);
        } else if (statusCode === 500) {
            return new AirtableError('SERVER_ERROR', 'Try again. If the problem persists, contact support.', statusCode);
        } else if (statusCode === 503) {
            return new AirtableError('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please retry shortly.', statusCode);
        }
    },

    doCall: function(tableName) {
        console.log('tableName', tableName, this);
        return this.table(tableName);
    },

    getId: function() {
        return this._id;
    }
});

Application.createFunctor = function(airtable, applicationId) {
    var application = new Application(airtable, applicationId);
    var appFn = function() {
        return application.doCall.apply(application, arguments);
    };
    _.each(['table', 'runAction', 'getId'], function(appMethod) {
        appFn[appMethod] = application[appMethod].bind(application);
    });
    appFn._application = application;
    appFn.tables = application.tables;
    return appFn;
};

module.exports = Application;
