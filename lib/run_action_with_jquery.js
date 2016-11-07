/*globals jQuery */
'use strict';

var internalConfig = require('./internal_config');
var AirtableError = require('./airtable_error');

function runActionWithJQuery(base, method, path, queryParams, bodyData, callback) {
    queryParams.forceInsecureCrossDomain = 'ALLOW_ANY_DOMAIN';

    var url = base._airtable._endpointUrl+'/v' + base._airtable._apiVersionMajor + '/' + base._id + path + '?' + jQuery.param(queryParams);

    jQuery.ajax(url, {
        contentType: 'application/json',
        type: method,

        data: JSON.stringify(bodyData),
        processData: false,
        dataType: 'json',
        timeout: internalConfig.REQUEST_TIMEOUT,

        headers: {
            'Authorization': 'Bearer ' + base._airtable._apiKey,
            'x-api-version': base._airtable._apiVersion,
            'x-airtable-application-id': base.getId(),
        },
        success: function(data, textStatus, jqXHR) {
            callback(null, null, data);
        },
        error: function(jqXHR, textStatus) {
            var error;
            if (jqXHR.status === 429 && !base._airtable._noRetryIfRateLimited) {
                setTimeout(function() {
                    runActionWithJQuery(base, method, path, queryParams, bodyData, callback);
                }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
                return;
            }
            error = base._checkStatusForError(jqXHR.status, jqXHR.responseJSON);
            if (!error) {
                // _checkStatusForError is not exhaustive, e.g. if the server
                // is completely unreachable there won't be a status code.
                // But since we're in the `error` callback, we want to
                // make sure we call the callback with an error object.
                error = new AirtableError('UNKNOWN_ERROR', 'An unknown error occurred.', jqXHR.status);
            }
            callback(error);
        }
    });
}

module.exports = runActionWithJQuery;
