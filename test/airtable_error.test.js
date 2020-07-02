'use strict';

var AirtableError = require('../lib/airtable_error');

describe('AirtableError', function() {
    describe('#toString', function() {
        it('includes the provided `error` value', function() {
            var error = new AirtableError('value of error parameter');
            expect(error.toString()).toEqual(expect.stringContaining('value of error parameter'));
        });

        it('includes the provided `message` value', function() {
            var error = new AirtableError(null, 'value of message parameter');
            expect(error.toString()).toEqual(expect.stringContaining('value of message parameter'));
        });

        it('includes the provided `statusCode` value', function() {
            var error = new AirtableError(null, null, 404);
            expect(error.toString()).toEqual(expect.stringContaining('404'));
        });
    });
});
