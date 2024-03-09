function check<Value, Error>(fn: (value: unknown) => value is Value, error: Error) {
  return function (value: Value): { error: Error; pass: false } | { pass: true } {
    if (fn(value)) {
      return { pass: true };
    } else {
      return { pass: false, error: error };
    }
  };
}

check.isOneOf = function isOneOf(options: unknown[]) {
  return options.includes.bind(options);
};

check.isArrayOf = function <Value>(itemValidator: (value: unknown) => value is Value) {
  return function (value: unknown): value is Value[] {
    return Array.isArray(value) && value.every(itemValidator);
  };
};

export = check;
