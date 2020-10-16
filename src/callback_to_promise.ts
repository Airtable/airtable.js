/**
 * Given a function fn that takes a callback as its last argument, returns
 * a new version of the function that takes the callback optionally. If
 * the function is not called with a callback for the last argument, the
 * function will return a promise instead.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
function callbackToPromise(fn: any, context: any, callbackArgIndex: number = void 0): any {
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
    return function(...callArgs: unknown[]) {
        let thisCallbackArgIndex;
        if (callbackArgIndex === void 0) {
            // istanbul ignore next
            thisCallbackArgIndex = callArgs.length > 0 ? callArgs.length - 1 : 0;
        } else {
            thisCallbackArgIndex = callbackArgIndex;
        }
        const callbackArg = callArgs[thisCallbackArgIndex];
        if (typeof callbackArg === 'function') {
            fn.apply(context, callArgs);
            return void 0;
        } else {
            const args = [];
            // If an explicit callbackArgIndex is set, but the function is called
            // with too few arguments, we want to push undefined onto args so that
            // our constructed callback ends up at the right index.
            const argLen = Math.max(callArgs.length, thisCallbackArgIndex);
            for (let i = 0; i < argLen; i++) {
                args.push(callArgs[i]);
            }
            return new Promise((resolve, reject) => {
                args.push((err, result) => {
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

export = callbackToPromise;
