'use strict';

var check = require('../lib/typecheck');
var isNumber = require('lodash/isNumber');

describe('check', function() {
    var errorMessage = 'It did not check correctly';

    it('checks if it passes the function to check', function() {
        var checkFn = check(function(n) {
            return n === 5;
        }, errorMessage);
        expect(checkFn(5).pass).toBe(true);
        expect(checkFn(5).error).toBeUndefined();
        expect(checkFn(1).pass).toBe(false);
        expect(checkFn(1).error).toBe(errorMessage);
    });

    it('checks it is one of', function() {
        var checkIsOneOfFn = check.isOneOf([10, 30]);
        expect(checkIsOneOfFn(10)).toBe(true);
        expect(checkIsOneOfFn(30)).toBe(true);
        expect(checkIsOneOfFn(33)).toBe(false);
        expect(checkIsOneOfFn('ten')).toBe(false);
    });

    it('checks it is array of', function() {
        var checkIsArrayOfNumberFn = check.isArrayOf(isNumber);
        expect(checkIsArrayOfNumberFn([])).toBe(true);
        expect(checkIsArrayOfNumberFn({})).toBe(false);
        expect(checkIsArrayOfNumberFn('55,22')).toBe(false);
        expect(checkIsArrayOfNumberFn([55, 22])).toBe(true);
        expect(checkIsArrayOfNumberFn([55, '5', 22])).toBe(false);
    });
});
