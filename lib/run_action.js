'use strict';

var internalConfig = require('./internal_config.json');
var objectToQueryParamString = require('./object_to_query_param_string');

// This will become require('xhr') in the browser.
var request = require('request');

function runAction(base, method, path, queryParams, bodyData, callback) {
    var url = base._airtable._endpointUrl + '/v' + base._airtable._apiVersionMajor + '/' + base._id + path + '?' + objectToQueryParamString(queryParams);

    var headers = {
        'authorization': 'Bearer ' + base._airtable._apiKey,
        'x-api-version': base._airtable._apiVersion,
        'x-airtable-application-id': base.getId(),
    };

    var userAgent = 'Airtable.js/' + process.env.npm_package_version;
    var isBrowser = typeof window !== 'undefined';
    // Some browsers do not allow overriding the user agent.
    // https://github.com/Airtable/airtable.js/issues/52
    if (isBrowser) {
        headers['x-airtable-user-agent'] = userAgent;
    } else {
        headers['User-Agent'] = userAgent;
    }


    var options = {
        method: method.toUpperCase(),
        url: url,
        json: true,
        timeout: base._airtable.requestTimeout,
        headers: headers,
        // agentOptions are ignored when running in the browser.
        agentOptions: {
            rejectUnauthorized: base._airtable._allowUnauthorizedSsl
        },
    };

    if (bodyData !== null) {
        options.body = bodyData;
    }

    request(options, function(error, resp, body) {
        if (error) {
            callback(error, resp, body);
            return;
        }

        if (resp.statusCode === 429 && !base._airtable._noRetryIfRateLimited) {
            setTimeout(function() {
                runAction(base, method, path, queryParams, bodyData, callback);
            }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
            return;
        }

        error = base._checkStatusForError(resp.statusCode, body);
        callback(error, resp, body);
    });
}

module.exports = runAction;
