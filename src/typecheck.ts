/* eslint-disable @typescript-eslint/no-explicit-any */
type CheckValue = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function check<Value, Error>(fn: (value: CheckValue) => value is Value, error: Error) {
    return function(value: Value): {pass: true} | {pass: false; error: Error} {
        if (fn(value)) {
            return {pass: true};
        } else {
            return {pass: false, error: error};
        }
    };
}

check.isOneOf = function isOneOf(options) {
    return options.includes.bind(options);
};

check.isArrayOf = function<Value>(itemValidator: (value: CheckValue) => value is Value) {
    return function(value: CheckValue): value is Value[] {
        return Array.isArray(value) && value.every(itemValidator);
    };
};

export = check;
