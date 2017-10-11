'use strict';

var assert = require('assert');

var Class = require('./class');
var Base = require('./base');
var Record = require('./record');
var Table = require('./table');
var AirtableError = require('./airtable_error');

var Airtable = Class.extend({
    init: function(opts) {
        opts = opts || {};

        this._apiKey = opts.apiKey || Airtable.apiKey || Airtable.default_config.apiKey;
        this._endpointUrl = opts.endpointUrl || Airtable.endpointUrl || Airtable.default_config.endpointUrl;
        this._apiVersion = opts.apiVersion || Airtable.apiVersion || Airtable.default_config.apiVersion;
        this._apiVersionMajor = this._apiVersion.split('.')[0];
        this._allowUnauthorizedSsl = opts.allowUnauthorizedSsl || Airtable.allowUnauthorizedSsl || Airtable.default_config.allowUnauthorizedSsl;
        this._noRetryIfRateLimited = opts.noRetryIfRateLimited || Airtable.noRetryIfRateLimited || Airtable.default_config.noRetryIfRateLimited;
        this.requestTimeout = opts.requestTimeout || Airtable.default_config.requestTimeout;

        assert(this._apiKey, 'API key is required to connect to Airtable');
    },

    base: function(baseId) {
        return Base.createFunctor(this, baseId);
    }
});

Airtable.default_config = {
    endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || 'https://api.airtable.com',
    apiVersion: '0.1.0',
    apiKey: process.env.AIRTABLE_API_KEY,
    allowUnauthorizedSsl: false,
    noRetryIfRateLimited: false,
    requestTimeout: 300 * 1000, // 5 minutes
};

Airtable.configure = function(opts) {
    Airtable.apiKey = opts.apiKey;
    Airtable.endpointUrl = opts.endpointUrl;
    Airtable.apiVersion = opts.apiVersion;
    Airtable.allowUnauthorizedSsl = opts.allowUnauthorizedSsl;
    Airtable.noRetryIfRateLimited = opts.noRetryIfRateLimited;
};

Airtable.base = function(baseId) {
    return new Airtable().base(baseId);
};

Airtable.Base = Base;
Airtable.Record = Record;
Airtable.Table = Table;
Airtable.Error = AirtableError;

module.exports = Airtable;
