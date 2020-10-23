import isArray from 'lodash/isArray';
import isNil from 'lodash/isNil';
import keys from 'lodash/keys';

/* eslint-disable @typescript-eslint/no-explicit-any */
type ToParamBody = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Adapted from jQuery.param:
// https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
function buildParams(prefix, obj, addFn) {
    if (isArray(obj)) {
        // Serialize array item.
        for (let index = 0; index < obj.length; index++) {
            const value = obj[index];
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
        }
    } else if (typeof obj === 'object') {
        // Serialize object item.
        for (const key of keys(obj)) {
            const value = obj[key];
            buildParams(`${prefix}[${key}]`, value, addFn);
        }
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

    for (const key of keys(obj)) {
        const value = obj[key];
        buildParams(key, value, addFn);
    }

    return parts.join('&').replace(/%20/g, '+');
}

export = objectToQueryParamString;
