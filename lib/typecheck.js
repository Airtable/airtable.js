'use strict';

var includes = require('lodash/includes');
var isArray = require('lodash/isArray');

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
    return includes.bind(this, options);
};

check.isArrayOf = function(itemValidator) {
    return function(value) {
        return isArray(value) && value.every(itemValidator);
    };
};

module.exports = check;
