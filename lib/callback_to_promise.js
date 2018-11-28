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
        if (callbackArgIndex === void 0) {
            callbackArgIndex = arguments.length > 0 ? arguments.length - 1 : 0;
        }
        var callbackArg = arguments[callbackArgIndex];
        if (typeof callbackArg === 'function') {
            fn.apply(context, arguments);
        } else {
            var args = [];
            // If an explicit callbackArgIndex is set, but the function is called
            // with too few arguments, we want to push undefined onto args so that
            // our constructed callback ends up at the right index.
            var argLen = Math.max(arguments.length, callbackArgIndex);
            for (var i = 0; i < argLen; i++) {
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
