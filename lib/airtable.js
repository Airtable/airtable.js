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

        var defaultConfig = Airtable.default_config();

        var apiVersion = opts.apiVersion || Airtable.apiVersion || defaultConfig.apiVersion;

        Object.defineProperties(this, {
            _apiKey: {
                value: opts.apiKey || Airtable.apiKey || defaultConfig.apiKey,
            },
            _endpointUrl: {
                value: opts.endpointUrl || Airtable.endpointUrl || defaultConfig.endpointUrl,
            },
            _apiVersion: {
                value: apiVersion,
            },
            _apiVersionMajor: {
                value: apiVersion.split('.')[0],
            },
            _allowUnauthorizedSsl: {
                value: opts.allowUnauthorizedSsl || Airtable.allowUnauthorizedSsl || defaultConfig.allowUnauthorizedSsl,
            },
            _noRetryIfRateLimited: {
                value: opts.noRetryIfRateLimited || Airtable.noRetryIfRateLimited || defaultConfig.noRetryIfRateLimited,
            },
        });

        this.requestTimeout = opts.requestTimeout || defaultConfig.requestTimeout;

        assert(this._apiKey, 'API key is required to connect to Airtable');
    },

    base: function(baseId) {
        return Base.createFunctor(this, baseId);
    }
});

Airtable.default_config = function () {
    return {
        endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || 'https://api.airtable.com',
        apiVersion: '0.1.0',
        apiKey: process.env.AIRTABLE_API_KEY,
        allowUnauthorizedSsl: false,
        noRetryIfRateLimited: false,
        requestTimeout: 300 * 1000, // 5 minutes
    };
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
