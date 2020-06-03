'use strict';

var testHelpers = require('./test_helpers');

describe('Table', function() {
    var airtable;
    var teardownAsync;

    beforeAll(function() {
        return testHelpers.getMockEnvironmentAsync().then(function(env) {
            airtable = env.airtable;
            teardownAsync = env.teardownAsync;
        });
    });

    afterAll(function() {
        return teardownAsync();
    });

    it('throws an error without a table reference', function() {
        return expect(() => {
            airtable.base('app123').table();
        }).toThrow();
    });
});
