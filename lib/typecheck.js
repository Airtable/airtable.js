'use strict';

var _ = require('lodash');

function check(fn, error) {
    return function(value) {
        if (fn(value)) {
            return {pass: true};
        } else {
            return {pass: false, error: error};
        }
    };
}

check.isOneOf = function isOneOf(options) {
    return _.contains.bind(this, options);
};

check.isArrayOf = function(itemValidator) {
    return function(value) {
        return _.isArray(value) && _.every(value, itemValidator);
    };
};

module.exports = check;
