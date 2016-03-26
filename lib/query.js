'use strict';

var assert = require('assert');
var _ = require('lodash');

var check = require('./typecheck');
var Class = require('./class');
var Record = require('./record');

var Query = Class.extend({
    /**
     * Builds a query object. Won't fetch until `firstPage` or
     * or `eachPage` is called.
     */
    init: function(table, params) {
        assert(_.isPlainObject(params));
        _.each(params, function(value, key) {
            assert(Query.paramValidators[key] && Query.paramValidators[key](value).pass, 'Invalid parameter for Query: ' + key);
        });

        this._table = table;
        this._params = params;
    },

    /**
     * Fetches the first page of results for the query asynchronously,
     * then calls `done(error, records)`.
     */
    firstPage: function(done) {
        assert(_.isFunction(done),
            'The first parameter to `firstPage` must be a function');

        this.eachPage(function(records, fetchNextPage) {
            done(null, records);
        }, function(error) {
            done(error, null);
        });
    },

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
    eachPage: function(pageCallback, done) {
        assert(_.isFunction(pageCallback),
            'The first parameter to `eachPage` must be a function');

        assert(_.isFunction(done) || _.isUndefined(done),
            'The second parameter to `eachPage` must be a function or undefined');

        var that = this;
        var path = '/' + this._table._urlEncodedNameOrId();
        var params = _.clone(this._params);

        var inner = function() {
            that._table._base.runAction('get', path, params, {}, function(err, response, result) {
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

                    var records = _.map(result.records, function(recordJson) {
                        return new Record(that._table, null, recordJson);
                    });

                    pageCallback(records, next);
                }
            });
        };

        inner();
    },
});

Query.paramValidators = {
    fields:
        check(check.isArrayOf(_.isString), 'the value for `fields` should be an array of strings'),

    filterByFormula:
        check(_.isString, 'the value for `filterByFormula` should be a string'),

    maxRecords:
        check(_.isNumber, 'the value for `maxRecords` should be a number'),

    pageSize:
        check(_.isNumber, 'the value for `pageSize` should be a number'),

    sort:
        check(check.isArrayOf(function(obj) {
            return (
                _.isPlainObject(obj) &&
                _.isString(obj.field) &&
                (_.isUndefined(obj.direction) || _.contains(['asc', 'desc'], obj.direction))
            );
        }), 'the value for `sort` should be an array of sort objects. ' +
            'Each sort object must have a string `field` value, and an optional ' +
            '`direction` value that is "asc" or "desc".'
        ),

    view:
        check(_.isString, 'the value for `view` should be a string'),
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
    assert(_.isPlainObject(params));

    var validParams = {};
    var ignoredKeys = [];
    var errors = [];
    _.each(params, function(value, key) {
        if (Query.paramValidators.hasOwnProperty(key)) {
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
