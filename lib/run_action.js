'use strict';

var exponentialBackoffWithJitter = require('./exponential_backoff_with_jitter');
var objectToQueryParamString = require('./object_to_query_param_string');
var packageVersion = require('./package_version');
var fetch = require('./fetch');
var AbortController = require('./abort-controller');

var userAgent = 'Airtable.js/' + packageVersion;

function runAction(base, method, path, queryParams, bodyData, callback, numAttempts) {
    var url =
        base._airtable._endpointUrl +
        '/v' +
        base._airtable._apiVersionMajor +
        '/' +
        base._id +
        path +
        '?' +
        objectToQueryParamString(queryParams);

    var headers = {
        authorization: 'Bearer ' + base._airtable._apiKey,
        'x-api-version': base._airtable._apiVersion,
        'x-airtable-application-id': base.getId(),
        'content-type': 'application/json',
    };
    var isBrowser = typeof window !== 'undefined';
    // Some browsers do not allow overriding the user agent.
    // https://github.com/Airtable/airtable.js/issues/52
    if (isBrowser) {
        headers['x-airtable-user-agent'] = userAgent;
    } else {
        headers['User-Agent'] = userAgent;
    }

    var controller = new AbortController();
    var normalizedMethod = method.toUpperCase();
    var options = {
        method: normalizedMethod,
        headers: headers,
        signal: controller.signal,
    };

    if (bodyData !== null) {
        if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') {
            console.warn('body argument to runAction are ignored with GET or HEAD requests');
        } else {
            options.body = JSON.stringify(bodyData);
        }
    }

    var timeout = setTimeout(function() {
        controller.abort();
    }, base._airtable.requestTimeout);

    fetch(url, options)
        .then(function(resp) {
            clearTimeout(timeout);
            if (resp.status === 429 && !base._airtable._noRetryIfRateLimited) {
                var backoffDelayMs = exponentialBackoffWithJitter(numAttempts);
                setTimeout(function() {
                    runAction(base, method, path, queryParams, bodyData, callback, numAttempts + 1);
                }, backoffDelayMs);
            } else {
                resp.json()
                    .then(function(body) {
                        var error = base._checkStatusForError(resp.status, body);
                        // Ensure Response interface matches interface from
                        // `request` Response object
                        var r = {};
                        Object.keys(resp).forEach(function(property) {
                            r[property] = resp[property];
                        });
                        r.body = body;
                        r.statusCode = resp.status;
                        callback(error, r, body);
                    })
                    .catch(function() {
                        callback(base._checkStatusForError(resp.status));
                    });
            }
        })
        .catch(function(error) {
            clearTimeout(timeout);
            callback(error);
        });
}

module.exports = runAction;
