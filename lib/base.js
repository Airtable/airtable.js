'use strict';

var forEach = require('lodash/forEach');

var internalConfig = require('./internal_config.json');
var Class = require('./class');
var AirtableError = require('./airtable_error');
var Table = require('./table');
var runAction = require('./run_action');

var Base = Class.extend({
    init: function(airtable, baseId) {
        this._airtable = airtable;
        this._id = baseId;
    },

    table: function(tableName) {
        return new Table(this, null, tableName);
    },

    runAction: function(method, path, queryParams, bodyData, callback) {
        runAction(this, method, path, queryParams, bodyData, callback);
    },

    _checkStatusForError: function(statusCode, body) {
      const ERROR_WITH_META = [404, 422, 400];
      const ERROR_TYPES = {
        400: ["UNEXPECTED_ERROR", "An unexpected error occurred"],
        401: ["AUTHENTICATION_REQUIRED", "You should provide valid api key to perform this operation"],
        403: ["NOT_AUTHORIZED", "You are not authorized to perform this operation"],
        404: ["NOT_FOUND", "Could not find what you are looking for"],
        413: ["REQUEST_TOO_LARGE", "Request body is too large"],
        422: ["UNPROCESSABLE_ENTITY", "The operation cannot be processed"],
        429: ["TOO_MANY_REQUESTS", "You have made too many requests in a short period of time. Please retry your request later"],
        500: ["SERVER_ERROR", "Try again. If the problem persists, contact support"],
        503: ["SERVICE_UNAVAILABLE", "The service is temporarily unavailable. Please retry shortly."]
      };

      let errCode = ERROR_TYPES[statusCode][0];
      let errMsg = ERROR_TYPES[statusCode][1];

      if (ERROR_WITH_META.includes(statusCode)) {
        return (function(){
          let type = (body && body.error && body.error.type) ? body.error.type : errCode;
          let msg = (body && body.error && body.error.message) ? body.error.message : errMsg;
          return new AirtableError(`${type}`, `${msg}` , statusCode);
        })();
      } else {
        return new AirtableError(`${errCode}`, `${errMsg}` , statusCode);
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
    forEach(['table', 'runAction', 'getId'], function(baseMethod) {
        baseFn[baseMethod] = base[baseMethod].bind(base);
    });
    baseFn._base = base;
    baseFn.tables = base.tables;
    return baseFn;
};

module.exports = Base;
