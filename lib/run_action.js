'use strict';

var internalConfig = require('./internal_config');
var request = require('request');

function runAction(base, method, path, queryParams, bodyData, callback) {
    var url = base._airtable._endpointUrl+'/v' + base._airtable._apiVersionMajor + '/' + base._id + path;

    request[method]({
        url: url,
        qs: queryParams,
        body: bodyData,

        json: true,
        timeout: internalConfig.REQUEST_TIMEOUT,
        auth: {
            bearer: base._airtable._apiKey
        },
        agentOptions: {
            rejectUnauthorized: base._airtable._allowUnauthorizedSsl
        },
        headers: {
            'X-API-VERSION': base._airtable._apiVersion
        }
    }, function(error, resp, body) {
        if (error) {
            callback(error, resp, body);
            return;
        }

        if(resp.statusCode===429 && !base._airtable._noRetryIfRateLimited){
            setTimeout(function(){
                runAction(base, method, path, queryParams, bodyData, callback);
            }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
            return;
        }

        error = base._checkStatusForError(resp.statusCode, body);

        if (error) {
            callback(error, resp, body);
            return;
        }

        callback(error, resp, body);
    });
}

module.exports = runAction;
