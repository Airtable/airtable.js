'use strict';

var isPlainObject = require('lodash/isPlainObject');
var isFunction = require('lodash/isFunction');
var isString = require('lodash/isString');
var isNumber = require('lodash/isNumber');
var includes = require('lodash/includes');
var clone = require('lodash/clone');
var forEach = require('lodash/forEach');
var map = require('lodash/map');
var keys = require('lodash/keys');

var check = require('./typecheck');
var Record = require('./record');
var callbackToPromise = require('./callback_to_promise');
var has = require('./has');

/**
 * Builds a query object. Won't fetch until `firstPage` or
 * or `eachPage` is called.
 */
function Query(table, params) {
    if (!isPlainObject(params)) {
        throw new Error('Expected query options to be an object');
    }

    forEach(keys(params), function(key) {
        var value = params[key];
        if (!Query.paramValidators[key] || !Query.paramValidators[key](value).pass) {
            throw new Error('Invalid parameter for Query: ' + key);
        }
    });

    this._table = table;
    this._params = params;

    this.firstPage = callbackToPromise(firstPage, this);
    this.eachPage = callbackToPromise(eachPage, this, 1);
    this.all = callbackToPromise(all, this);
}

/**
 * Fetches the first page of results for the query asynchronously,
 * then calls `done(error, records)`.
 */
function firstPage(done) {
    if (!isFunction(done)) {
        throw new Error('The first parameter to `firstPage` must be a function');
    }

    this.eachPage(
        function(records) {
            done(null, records);
        },
        function(error) {
            done(error, null);
        }
    );
}

/**
 * Fetches each page of results for the query asynchronously.
 *
 * Calls `pageCallback(records, fetchNextPage)` for each
 * page. You must call `fetchNextPage()` to fetch the next page of
 * results.
 *
 * After fetching all pages, or if there's an error, calls
 * `done(error)`.
 */
function eachPage(pageCallback, done) {
    if (!isFunction(pageCallback)) {
        throw new Error('The first parameter to `eachPage` must be a function');
    }

    if (!isFunction(done) && done !== void 0) {
        throw new Error('The second parameter to `eachPage` must be a function or undefined');
    }

    var that = this;
    var path = '/' + this._table._urlEncodedNameOrId();
    var params = clone(this._params);

    var inner = function() {
        that._table._base.runAction('get', path, params, null, function(err, response, result) {
            if (err) {
                done(err, null);
            } else {
                var next;
                if (result.offset) {
                    params.offset = result.offset;
                    next = inner;
                } else {
                    next = function() {
                        if (done) {
                            done(null);
                        }
                    };
                }

                var records = map(result.records, function(recordJson) {
                    return new Record(that._table, null, recordJson);
                });

                pageCallback(records, next);
            }
        });
    };

    inner();
}

/**
 * Fetches all pages of results asynchronously. May take a long time.
 */
function all(done) {
    if (!isFunction(done)) {
        throw new Error('The first parameter to `all` must be a function');
    }

    var allRecords = [];
    this.eachPage(
        function(pageRecords, fetchNextPage) {
            allRecords.push.apply(allRecords, pageRecords);
            fetchNextPage();
        },
        function(err) {
            if (err) {
                done(err, null);
            } else {
                done(null, allRecords);
            }
        }
    );
}

Query.paramValidators = {
    fields: check(
        check.isArrayOf(isString),
        'the value for `fields` should be an array of strings'
    ),

    filterByFormula: check(isString, 'the value for `filterByFormula` should be a string'),

    maxRecords: check(isNumber, 'the value for `maxRecords` should be a number'),

    pageSize: check(isNumber, 'the value for `pageSize` should be a number'),

    sort: check(
        check.isArrayOf(function(obj) {
            return (
                isPlainObject(obj) &&
                isString(obj.field) &&
                (obj.direction === void 0 || includes(['asc', 'desc'], obj.direction))
            );
        }),
        'the value for `sort` should be an array of sort objects. ' +
            'Each sort object must have a string `field` value, and an optional ' +
            '`direction` value that is "asc" or "desc".'
    ),

    view: check(isString, 'the value for `view` should be a string'),

    cellFormat: check(function(cellFormat) {
        return isString(cellFormat) && includes(['json', 'string'], cellFormat);
    }, 'the value for `cellFormat` should be "json" or "string"'),

    timeZone: check(isString, 'the value for `timeZone` should be a string'),

    userLocale: check(isString, 'the value for `userLocale` should be a string'),
};

/**
 * Validates the parameters for passing to the Query constructor.
 *
 * @return an object with two keys:
 *  validParams: the object that should be passed to the constructor.
 *  ignoredKeys: a list of keys that will be ignored.
 *  errors: a list of error messages.
 */
Query.validateParams = function validateParams(params) {
    if (!isPlainObject(params)) {
        throw new Error('Expected query params to be an object');
    }

    var validParams = {};
    var ignoredKeys = [];
    var errors = [];

    forEach(keys(params), function(key) {
        var value = params[key];
        if (has(Query.paramValidators, key)) {
            var validator = Query.paramValidators[key];
            var validationResult = validator(value);
            if (validationResult.pass) {
                validParams[key] = value;
            } else {
                errors.push(validationResult.error);
            }
        } else {
            ignoredKeys.push(key);
        }
    });

    return {
        validParams: validParams,
        ignoredKeys: ignoredKeys,
        errors: errors,
    };
};

module.exports = Query;
