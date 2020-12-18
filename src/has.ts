/* eslint-disable @typescript-eslint/no-explicit-any */
type HasValue = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function has<O, P extends string>(object: O, property: P): object is O & {[key in P]: HasValue} {
    return Object.prototype.hasOwnProperty.call(object, property);
}

export = has;
