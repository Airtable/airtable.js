'use strict';

var isPlainObject = require('lodash/isPlainObject');
var assign = require('lodash/assign');
var forEach = require('lodash/forEach');
var map = require('lodash/map');

var assert = require('assert');

var AirtableError = require('./airtable_error');
var Class = require('./class');
var deprecate = require('./deprecate');
var Query = require('./query');
var Record = require('./record');
var callbackToPromise = require('./callback_to_promise');

var Table = Class.extend({
    init: function(base, tableId, tableName) {
        this._base = base;
        assert(tableId || tableName, 'Table name or table ID is required');
        this.id = tableId;
        this.name = tableName;

        // Public API
        this.find = callbackToPromise(this._findRecordById, this);
        this.select = this._selectRecords.bind(this);
        this.create = callbackToPromise(this._createRecord, this);
        this.update = callbackToPromise(this._updateRecord, this);
        this.destroy = callbackToPromise(this._destroyRecord, this);
        this.replace = callbackToPromise(this._replaceRecord, this);

        // Deprecated API
        this.list = deprecate(this._listRecords.bind(this),
            'table.list',
            'Airtable: `list()` is deprecated. Use `select()` instead.');
        this.forEach = deprecate(this._forEachRecord.bind(this),
            'table.forEach',
            'Airtable: `forEach()` is deprecated. Use `select()` instead.');
    },
    _findRecordById: function(recordId, done) {
        var record = new Record(this, recordId);
        record.fetch(done);
    },
    _selectRecords: function(params) {
        if (params === void 0) {
            params = {};
        }

        if (arguments.length > 1) {
            console.warn('Airtable: `select` takes only one parameter, but it was given ' +
                arguments.length + ' parameters. ' +
                'Use `eachPage` or `firstPage` to fetch records.');
        }

        if (isPlainObject(params)) {
            var validationResults = Query.validateParams(params);

            if (validationResults.errors.length) {
                var formattedErrors = map(validationResults.errors, function(error) {
                    return '  * ' + error;
                });

                assert(false, 'Airtable: invalid parameters for `select`:\n' +
                    formattedErrors.join('\n'));
            }

            if (validationResults.ignoredKeys.length) {
                console.warn('Airtable: the following parameters to `select` will be ignored: ' +
                    validationResults.ignoredKeys.join(', '));
            }

            return new Query(this, validationResults.validParams);
        } else {
            assert(false, 'Airtable: the parameter for `select` should be a plain object or undefined.');
        }
    },
    _urlEncodedNameOrId: function(){
        return this.id || encodeURIComponent(this.name);
    },
    _createRecord: function(recordData, optionalParameters, done) {
        var that = this;
        if (!done) {
            done = optionalParameters;
            optionalParameters = {};
        }
        var requestData = assign({fields: recordData}, optionalParameters);
        this._base.runAction('post', '/' + that._urlEncodedNameOrId() + '/', {}, requestData, function(err, resp, body) {
            if (err) { done(err); return; }

            var record = new Record(that, body.id, body);
            done(null, record);
        });
    },
    _updateRecord: function(recordId, recordData, opts, done) {
        var record = new Record(this, recordId);
        if (!done) {
            done = opts;
            record.patchUpdate(recordData, done);
        } else {
            record.patchUpdate(recordData, opts, done);
        }
    },
    _replaceRecord: function(recordId, recordData, opts, done) {
        var record = new Record(this, recordId);
        if (!done) {
            done = opts;
            record.putUpdate(recordData, done);
        } else {
            record.putUpdate(recordData, opts, done);
        }
    },
    _destroyRecord: function(recordId, done) {
        var record = new Record(this, recordId);
        record.destroy(done);
    },
    _listRecords: function(limit, offset, opts, done) {
        var that = this;

        if (!done) {
            done = opts;
            opts = {};
        }
        var listRecordsParameters = assign({
            limit: limit, offset: offset
        }, opts);

        this._base.runAction('get', '/' + this._urlEncodedNameOrId() + '/', listRecordsParameters, null, function (err, response, results) {
            if (err) {
                done(err);
                return;
            }

            var records = map(results.records, function(recordJson) {
                return new Record(that, null, recordJson);
            });
            done(null, records, results.offset);
        });
    },
    _forEachRecord: function(opts, callback, done) {
        if (arguments.length === 2) {
            done = callback;
            callback = opts;
            opts = {};
        }
        var that = this;
        var limit = Table.__recordsPerPageForIteration || 100;
        var offset = null;

        var nextPage = function() {
            that._listRecords(limit, offset, opts, function(err, page, newOffset) {
                if (err) { done(err); return; }

                forEach(page, callback);

                if (newOffset) {
                    offset = newOffset;
                    nextPage();
                } else {
                    done();
                }
            });
        };
        nextPage();
    }
});

module.exports = Table;
