var forEach = require('lodash/forEach');

var isBrowser = typeof window !== 'undefined';

function HttpHeaders() {
    this._headersByLowercasedKey = {};
}

HttpHeaders.prototype.set = function(headerKey, headerValue) {
    var lowercasedKey = headerKey.toLowerCase();

    if (lowercasedKey === 'x-airtable-user-agent') {
        lowercasedKey = 'user-agent';
        headerKey = 'User-Agent';
    }

    this._headersByLowercasedKey[lowercasedKey] = {
        headerKey: headerKey,
        headerValue: headerValue,
    };
};

HttpHeaders.prototype.toJSON = function() {
    var result = {};
    forEach(this._headersByLowercasedKey, function(headerDefinition, lowercasedKey) {
        var headerKey;
        if (isBrowser && lowercasedKey === 'user-agent') {
            // Some browsers do not allow overriding the user agent.
            // https://github.com/Airtable/airtable.js/issues/52
            headerKey = 'X-Airtable-User-Agent';
        } else {
            headerKey = headerDefinition.headerKey;
        }

        result[headerKey] = headerDefinition.headerValue;
    });
    return result;
};

module.exports = HttpHeaders;
