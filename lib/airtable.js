'use strict';

var assert = require('assert');

var Class = require('./class');
var Application = require('./application');
var Table = require('./table');
var Record = require('./record');

var Airtable = Class.extend({
    init: function(opts) {
        opts = opts || {};

        this._apiKey = opts.apiKey || Airtable.apiKey || Airtable.default_config.apiKey;
        this._endpointUrl = opts.endpointUrl || Airtable.endpointUrl || Airtable.default_config.endpointUrl;
        this._apiVersion = opts.apiVersion || Airtable.apiVersion || Airtable.default_config.apiVersion;
        this._apiVersionMajor = this._apiVersion.split('.')[0];
        assert(this._apiKey, 'API key is required to connect to Airtable');
    },

    app: function(applicationId) {
        return Application.createFunctor(this, applicationId);
    }
});

Airtable.default_config = {
    endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || 'https://api.airtable.com',
    apiVersion: '0.1.0',
    apiKey: process.env.AIRTABLE_API_KEY
};

Airtable.configure = function(opts) {
    Airtable.apiKey = opts.apiKey;
    Airtable.endpointUrl = opts.endpointUrl;
    Airtable.apiVersion = opts.apiVersion;
};

Airtable.app = function(appId) {
    return new Airtable().app(appId);
};

Airtable.Application = Application;
Airtable.Record = Record;
Airtable.Table = Table;

module.exports = Airtable;
