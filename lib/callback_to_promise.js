'use strict';

/**
 * Given a function fn that takes a callback as its last argument, returns
 * a new version of the function that takes the callback optionally. If
 * the function is not called with a callback for the last argument, the
 * function will return a promise instead.
 */
function callbackToPromise(fn, context, callbackArgIndex) {
    return function() {
        // If callbackArgIndex isn't provided, use the last argument.
        if (callbackArgIndex === undefined) {
            callbackArgIndex = arguments.length > 0 ? arguments.length - 1 : 0;
        }
        var callbackArg = arguments[callbackArgIndex];
        if (typeof callbackArg === 'function') {
            fn.apply(context, arguments);
        } else {
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return new Promise(function(resolve, reject) {
                args.push(function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
                fn.apply(context, args);
            });
        }
    };
}

module.exports = callbackToPromise;
