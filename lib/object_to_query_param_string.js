'use strict';

var _ = require('lodash');

// Adapted from jQuery.param:
// https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
function buildParams(prefix, obj, addFn) {
    var name;
    if (_.isArray(obj)) {
        // Serialize array item.
        _.each(obj, function(value, index) {
            if (/\[\]$/.test(prefix)) {
                // Treat each array item as a scalar.
                addFn(prefix, value);
            } else {
                // Item is non-scalar (array or object), encode its numeric index.
                buildParams(
                    prefix + '[' + (typeof value === 'object' && value !== null && value !== undefined ? index : '') + ']',
                    value,
                    addFn
                );
            }
        });
    } else if (typeof obj === 'object') {
        // Serialize object item.
        for (name in obj) {
            buildParams(prefix + '[' + name + ']', obj[name], addFn);
        }
    } else {
        // Serialize scalar item.
        addFn(prefix, obj);
    }
}

function objectToQueryParamString(obj) {
    var parts = [];
    var addFn = function(key, value) {
        value = (value === null || value === undefined) ? '' : value;
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    };

    _.each(_.keys(obj), function(key) {
        var value = obj[key];
        buildParams(key, value, addFn);
    });

    return parts.join('&').replace(/%20/g, '+');
}

module.exports = objectToQueryParamString;
