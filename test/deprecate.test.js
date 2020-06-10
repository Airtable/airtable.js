'use strict';

var deprecate = require('../lib/deprecate');

describe('Airtable', function() {
    var x;
    var addOne;
    var plusPlus;
    var spy;

    beforeEach(function() {
        addOne = function(n) {
            x = n + 1;
        };
        plusPlus = deprecate(addOne, 'addOne', 'addOne has been deprecated');
        spy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(function() {
        spy.mockRestore();
    });

    it('applys the function and warns once', function() {
        plusPlus(1);
        expect(x).toBe(2);
        expect(console.warn).toHaveBeenCalledTimes(1);
        plusPlus(7);
        expect(x).toBe(8);
        expect(console.warn).toHaveBeenCalledTimes(1);
    });
});
