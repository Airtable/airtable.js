/*globals jQuery */
'use strict';

var internalConfig = require('./internal_config');

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
            // TODO: uncomment when the server is fixed to allow this header:
            //'X-API-VERSION': base._airtable._apiVersion
        },
        success: function(data, textStatus, jqXHR) {
            callback(null, null, data);
        },
        error: function(jqXHR, textStatus) {
            var error;
            if(jqXHR.statusCode()===429 && !base._airtable._noRetryIfRateLimited){
                setTimeout(function(){
                    runActionWithJQuery(base, method, path, queryParams, bodyData, callback);
                }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
                return;
            }
            error = base._checkStatusForError(jqXHR.statusCode(), jqXHR.respnoseText);
            callback(error);
        }
    });
}

module.exports = runActionWithJQuery;
