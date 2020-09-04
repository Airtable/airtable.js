function has<O, P extends string>(object: O, property: P): object is O & {[key in P]: any} {
    return Object.prototype.hasOwnProperty.call(object, property);
}

export = has;
