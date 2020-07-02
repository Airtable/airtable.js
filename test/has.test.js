'use strict';

var has = require('../lib/has');

describe('has', function() {
    it('returns true if the object has the property as an own property, false otherwise', function() {
        expect(has({}, 'foo')).toBe(false);
        expect(has({}, 'hasOwnProperty')).toBe(false);

        expect(has({foo: void 0}, 'foo')).toBe(true);
        expect(has({foo: void 0}, 'boo')).toBe(false);
        expect(has({foo: void 0}, 'hasOwnProperty')).toBe(false);
    });

    it('works even if the object has a property called "hasOwnProperty"', function() {
        expect(has({hasOwnProperty: 123}, 'hasOwnProperty')).toBe(true);
    });
});
