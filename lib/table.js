'use strict';

var _ = require('lodash');

var assert = require('assert');
var async = require('async');

var Class = require('./class');
var Record = require('./record');
var AirtableError = require('./airtable_error');

var Table = Class.extend({
    init: function(application, tableId, tableName) {
        this._application = application;
        assert(tableId || tableName, 'Table name or table ID is require');
        this.id = tableId;
        this.name = tableName;

        // Public API
        this.find = this._record.bind(this);
        this.create = this._createRecord.bind(this);
        this.list = this._listRecords.bind(this);
        this.forEach = this._forEachRecord.bind(this);
        this.update = this._updateRecord.bind(this);
        this.destroy = this._destroyRecord.bind(this);
        this.replace = this._replaceRecord.bind(this);
    },
    _record: function(recordId, done) {
        var record = new Record(this, recordId);
        record.fetch(done);
    },
    _urlEncodedNameOrId: function(){
        return this.id || encodeURIComponent(this.name);
    },
    _createRecord: function(recordData, done) {
        var that = this;
        this._application.runAction('post', '/' + that._urlEncodedNameOrId() + '/', {}, {
            fields: recordData
        }, function(err, resp, body) {
            if (err) { done(err); return; }

            var record = new Record(that, body.id, body);
            done(null, record);
        });
    },
    _updateRecord: function(recordId, recordData, done) {
        var record = new Record(this, recordId);
        record.patchUpdate(recordData, done);
    },
    _replaceRecord: function(recordId, recordData, done) {
        var record = new Record(this, recordId);
        record.putUpdate(recordData, done);
    },
    _destroyRecord: function(recordId, done) {
        var record = new Record(this, recordId);
        record.destroy(done);
    },
    _listRecords: function(limit, offset, done) {
        var that = this;

        async.waterfall([
            function(next) {
                that._application.runAction('get', '/' + that._urlEncodedNameOrId() + '/', {limit: limit, offset: offset}, {}, next);
            },
            function(response, results, next) {
                var records = _.map(results.records, function(recordJson) {
                    return new Record(that, null, recordJson);
                });
                next(null, records, results.offset);
            }
        ], done);
    },
    _forEachRecord: function(callback, done) {
        var that = this;
        var limit = Table.__recordsPerPageForIteration || 100;
        var offset = null;

        var nextPage = function() {
            that.list(limit, offset, function(err, page, newOffset) {
                if (err) { done(err); return; }

                _.each(page, callback);

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
