'use strict';

var _ = require('lodash');

var Class = require('./class');

var Record = Class.extend({
    init: function(table, recordId, recordJson) {
        this._table = table;
        this.id = recordId || recordJson.id;
        this.setRawJson(recordJson);
        this.updateFields = this.patchUpdate;
        this.replaceFields = this.putUpdate;
    },
    getId: function() {
        return this.id;
    },
    get: function(columnName) {
        return this.fields[columnName];
    },
    set: function(columnName, columnValue) {
        this.fields[columnName] = columnValue;
    },
    save: function(done) {
        this.putUpdate(this.fields, done);
    },
    patchUpdate: function(cellValuesByName, opts, done) {
        var that = this;
        if (!done) {
            done = opts;
            opts = {};
        }
        var updateBody = _.extend({
            fields: cellValuesByName
        }, opts);

        this._table._base.runAction('patch', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, updateBody, function(err, response, results) {
            if (err) { done(err); return; }

            that.setRawJson(results);
            done(null, that);
        });
    },
    putUpdate: function(cellValuesByName, opts, done) {
        var that = this;
        if (!done) {
            done = opts;
            opts = {};
        }
        var updateBody = _.extend({
            fields: cellValuesByName
        }, opts);
        this._table._base.runAction('put', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, updateBody, function(err, response, results) {
            if (err) { done(err); return; }

            that.setRawJson(results);
            done(null, that);
        });
    },
    destroy: function(done) {
        var that = this;
        this._table._base.runAction('delete', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, {}, function(err, response, results) {
            if (err) { done(err); return; }

            done(null, that);
        });
    },

    fetch: function(done) {
        var that = this;
        this._table._base.runAction('get', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, {}, function(err, response, results) {
            if (err) { done(err); return; }

            that.setRawJson(results);
            done(null, that);
        });
    },
    setRawJson: function(rawJson) {
        this._rawJson = rawJson;
        this.fields = (this._rawJson && this._rawJson.fields) || {};
    }
});

module.exports = Record;
