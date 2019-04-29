'use strict';

var callbackToPromise = require('../lib/callback_to_promise');

describe('callbackToPromise', function() {
    function returnThisPlusValue(value, callback) {
        callback(null, this + value);
    }

    function sum() {
        var callback = arguments[arguments.length - 1];
        var result = 0;
        for (var i = 0; i < arguments.length - 1; i++) {
            result += arguments[i];
        }
        callback(null, result);
    }

    it('lets a function return a promise', function() {
        var wrapped = callbackToPromise(returnThisPlusValue, 1);
        expect(wrapped(2)).resolves.toBe(3);
    });

    it('maintains the ability to call a function with a callback', function(done) {
        var wrapped = callbackToPromise(returnThisPlusValue, 1);
        wrapped(2, function(err, result) {
            expect(err).toBeNull();
            expect(result).toBe(3);
            done();
        });
    });

    it('is resilient to changes in the number of arguments', function(done) {
        var wrapped = callbackToPromise(sum, null);

        wrapped(1, 2, function(err1, result1) {
            expect(err1).toBeNull();
            expect(result1).toBe(3);
            wrapped(3, 4, 5, function(err2, result2) {
                expect(err2).toBeNull();
                expect(result2).toBe(12);
                wrapped(6, function(err3, result3) {
                    expect(err3).toBeNull();
                    expect(result3).toBe(6);
                    done();
                });
            });
        });
    });
});
