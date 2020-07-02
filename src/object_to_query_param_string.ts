'use strict';

var isArray = require('lodash/isArray');
var forEach = require('lodash/forEach');
var isNil = require('lodash/isNil');

// Adapted from jQuery.param:
// https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
function buildParams(prefix, obj, addFn) {
    if (isArray(obj)) {
        // Serialize array item.
        forEach(obj, function(value, index) {
            if (/\[\]$/.test(prefix)) {
                // Treat each array item as a scalar.
                addFn(prefix, value);
            } else {
                // Item is non-scalar (array or object), encode its numeric index.
                buildParams(
                    prefix + '[' + (typeof value === 'object' && value !== null ? index : '') + ']',
                    value,
                    addFn
                );
            }
        });
    } else if (typeof obj === 'object') {
        // Serialize object item.
        forEach(obj, function(value, key) {
            buildParams(prefix + '[' + key + ']', value, addFn);
        });
    } else {
        // Serialize scalar item.
        addFn(prefix, obj);
    }
}

function objectToQueryParamString(obj) {
    var parts = [];
    var addFn = function(key, value) {
        value = isNil(value) ? '' : value;
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    };

    forEach(obj, function(value, key) {
        buildParams(key, value, addFn);
    });

    return parts.join('&').replace(/%20/g, '+');
}

module.exports = objectToQueryParamString;
