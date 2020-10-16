import isArray from 'lodash/isArray';
import forEach from 'lodash/forEach';
import isNil from 'lodash/isNil';

/* eslint-disable @typescript-eslint/no-explicit-any */
type ToParamBody = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Adapted from jQuery.param:
// https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
function buildParams(prefix, obj, addFn) {
    if (isArray(obj)) {
        // Serialize array item.
        forEach(obj, (value, index) => {
            if (/\[\]$/.test(prefix)) {
                // Treat each array item as a scalar.
                addFn(prefix, value);
            } else {
                // Item is non-scalar (array or object), encode its numeric index.
                buildParams(
                    `${prefix}[${typeof value === 'object' && value !== null ? index : ''}]`,
                    value,
                    addFn
                );
            }
        });
    } else if (typeof obj === 'object') {
        // Serialize object item.
        forEach(obj, (value, key) => {
            buildParams(`${prefix}[${key}]`, value, addFn);
        });
    } else {
        // Serialize scalar item.
        addFn(prefix, obj);
    }
}

function objectToQueryParamString(obj: ToParamBody): string {
    const parts = [];
    const addFn = (key, value) => {
        value = isNil(value) ? '' : value;
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    };

    forEach(obj, (value, key) => {
        buildParams(key, value, addFn);
    });

    return parts.join('&').replace(/%20/g, '+');
}

export = objectToQueryParamString;
