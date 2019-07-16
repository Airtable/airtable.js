'use strict';

var isArray = require('lodash/isArray');
var isPlainObject = require('lodash/isPlainObject');
var assign = require('lodash/assign');
var forEach = require('lodash/forEach');
var map = require('lodash/map');

var deprecate = require('./deprecate');
var Query = require('./query');
var Record = require('./record');
var callbackToPromise = require('./callback_to_promise');

function Table(base, tableId, tableName) {
    if (!tableId && !tableName) {
        throw new Error('Table name or table ID is required');
    }

    this._base = base;
    this.id = tableId;
    this.name = tableName;

    // Public API
    this.find = callbackToPromise(this._findRecordById, this);
    this.select = this._selectRecords.bind(this);
    this.create = callbackToPromise(this._createRecords, this);
    this.update = callbackToPromise(this._updateRecords.bind(this, false), this);
    this.replace = callbackToPromise(this._updateRecords.bind(this, true), this);
    this.destroy = callbackToPromise(this._destroyRecord, this);

    // Deprecated API
    this.list = deprecate(this._listRecords.bind(this),
        'table.list',
        'Airtable: `list()` is deprecated. Use `select()` instead.');
    this.forEach = deprecate(this._forEachRecord.bind(this),
        'table.forEach',
        'Airtable: `forEach()` is deprecated. Use `select()` instead.');
}

Table.prototype._findRecordById = function(recordId, done) {
    var record = new Record(this, recordId);
    record.fetch(done);
};

Table.prototype._selectRecords = function(params) {
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

            throw new Error('Airtable: invalid parameters for `select`:\n' +
                    formattedErrors.join('\n'));
        }

        if (validationResults.ignoredKeys.length) {
            console.warn('Airtable: the following parameters to `select` will be ignored: ' +
                    validationResults.ignoredKeys.join(', '));
        }

        return new Query(this, validationResults.validParams);
    } else {
        throw new Error('Airtable: the parameter for `select` should be a plain object or undefined.');
    }
};

Table.prototype._urlEncodedNameOrId = function() {
    return this.id || encodeURIComponent(this.name);
};

Table.prototype._createRecords = function(recordsData, optionalParameters, done) {
    var that = this;
    var isCreatingMultipleRecords = isArray(recordsData);

    if (!done) {
        done = optionalParameters;
        optionalParameters = {};
    }
    var requestData;
    if (isCreatingMultipleRecords) {
        requestData = {records: recordsData};
    } else {
        requestData = {fields: recordsData};
    }
    assign(requestData, optionalParameters);
    this._base.runAction('post', '/' + that._urlEncodedNameOrId() + '/', {}, requestData, function(err, resp, body) {
        if (err) { done(err); return; }

        var result;
        if (isCreatingMultipleRecords) {
            result = body.records.map(function(record) {
                return new Record(that, record.id, record);
            });
        } else {
            result = new Record(that, body.id, body);
        }
        done(null, result);
    });
};

Table.prototype._updateRecords = function(isDestructiveUpdate, recordsDataOrRecordId, recordDataOrOptsOrDone, optsOrDone, done) {
    var opts;

    if (isArray(recordsDataOrRecordId)) {
        var that = this;
        var recordsData = recordsDataOrRecordId;
        opts = isPlainObject(recordDataOrOptsOrDone) ? recordDataOrOptsOrDone : {};
        done = optsOrDone || recordDataOrOptsOrDone;

        var method = isDestructiveUpdate ? 'put' : 'patch';
        var requestData = assign({records: recordsData}, opts);
        this._base.runAction(method, '/' + this._urlEncodedNameOrId() + '/', {}, requestData, function(err, resp, body) {
            if (err) { done(err); return; }

            var result = body.records.map(function(record) {
                return new Record(that, record.id, record);
            });
            done(null, result);
        });
    } else {
        var recordId = recordsDataOrRecordId;
        var recordData = recordDataOrOptsOrDone;
        opts = isPlainObject(optsOrDone) ? optsOrDone : {};
        done = done || optsOrDone;

        var record = new Record(this, recordId);
        if (isDestructiveUpdate) {
            record.putUpdate(recordData, opts, done);
        } else {
            record.patchUpdate(recordData, opts, done);
        }
    }
};

Table.prototype._destroyRecord = function(recordIdsOrId, done) {
    if (isArray(recordIdsOrId)) {
        var that = this;
        var queryParams = {records: recordIdsOrId};
        this._base.runAction('delete', '/' + this._urlEncodedNameOrId(), queryParams, null, function(err, response, results) {
            if (err) {
                done(err);
                return;
            }

            var records = map(results.records, function(recordJson) {
                return new Record(that, recordJson.id, null);
            });
            done(null, records);
        });
    } else {
        var record = new Record(this, recordIdsOrId);
        record.destroy(done);
    }
};

Table.prototype._listRecords = function(limit, offset, opts, done) {
    var that = this;

    if (!done) {
        done = opts;
        opts = {};
    }
    var listRecordsParameters = assign({
        limit: limit, offset: offset
    }, opts);

    this._base.runAction('get', '/' + this._urlEncodedNameOrId() + '/', listRecordsParameters, null, function(err, response, results) {
        if (err) {
            done(err);
            return;
        }

        var records = map(results.records, function(recordJson) {
            return new Record(that, null, recordJson);
        });
        done(null, records, results.offset);
    });
};

Table.prototype._forEachRecord = function(opts, callback, done) {
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
};

module.exports = Table;
