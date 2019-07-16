'use strict';

var assign = require('lodash/assign');

var callbackToPromise = require('./callback_to_promise');

function Record(table, recordId, recordJson) {
    this._table = table;
    this.id = recordId || recordJson.id;
    this.setRawJson(recordJson);

    this.save = callbackToPromise(save, this);
    this.patchUpdate = callbackToPromise(patchUpdate, this);
    this.putUpdate = callbackToPromise(putUpdate, this);
    this.destroy = callbackToPromise(destroy, this);
    this.fetch = callbackToPromise(fetch, this);

    this.updateFields = this.patchUpdate;
    this.replaceFields = this.putUpdate;
}

Record.prototype.getId = function() {
    return this.id;
};

Record.prototype.get = function(columnName) {
    return this.fields[columnName];
};

Record.prototype.set = function(columnName, columnValue) {
    this.fields[columnName] = columnValue;
};

function save(done) {
    this.putUpdate(this.fields, done);
}

function patchUpdate(cellValuesByName, opts, done) {
    var that = this;
    if (!done) {
        done = opts;
        opts = {};
    }
    var updateBody = assign({
        fields: cellValuesByName
    }, opts);

    this._table._base.runAction('patch', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, updateBody, function(err, response, results) {
        if (err) { done(err); return; }

        that.setRawJson(results);
        done(null, that);
    });
}

function putUpdate(cellValuesByName, opts, done) {
    var that = this;
    if (!done) {
        done = opts;
        opts = {};
    }
    var updateBody = assign({
        fields: cellValuesByName
    }, opts);
    this._table._base.runAction('put', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, updateBody, function(err, response, results) {
        if (err) { done(err); return; }

        that.setRawJson(results);
        done(null, that);
    });
}

function destroy(done) {
    var that = this;
    this._table._base.runAction('delete', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, null, function(err) {
        if (err) { done(err); return; }

        done(null, that);
    });
}

function fetch(done) {
    var that = this;
    this._table._base.runAction('get', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, null, function(err, response, results) {
        if (err) { done(err); return; }

        that.setRawJson(results);
        done(null, that);
    });
}

Record.prototype.setRawJson = function(rawJson) {
    this._rawJson = rawJson;
    this.fields = (this._rawJson && this._rawJson.fields) || {};
};

module.exports = Record;
