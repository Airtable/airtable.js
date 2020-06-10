'use strict';

var testHelpers = require('./test_helpers');

describe('record retrival', function() {
    var airtable;
    var testExpressApp;
    var teardownAsync;

    beforeAll(function() {
        return testHelpers.getMockEnvironmentAsync().then(function(env) {
            airtable = env.airtable;
            testExpressApp = env.testExpressApp;
            teardownAsync = env.teardownAsync;
        });
    });

    afterAll(function() {
        return teardownAsync();
    });

    it('can find one record', function() {
        var recordId = 'record1';

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/record1?');
            res.json({
                id: req.params.recordId,
                fields: {Name: 'Rebecca'},
                createdTime: '2020-04-20T16:20:00.000Z',
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .find(recordId)
            .then(function(foundRecord) {
                expect(foundRecord.id).toBe(recordId);
                expect(foundRecord.get('Name')).toBe('Rebecca');
            });
    });
});
