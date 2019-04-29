'use strict';

var testHelpers = require('./test_helpers');

describe('record deletion', function() {
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

    it('can delete one record', function() {
        return airtable
            .base('app123')
            .table('Table')
            .destroy('rec123')
            .then(function(deletedRecord) {
                expect(deletedRecord.id).toBe('rec123');
            });
    });

    it('can delete one record and call a callback', function(done) {
        airtable
            .base('app123')
            .table('Table')
            .destroy('rec123', function(err, deletedRecord) {
                expect(err).toBeNull();
                expect(deletedRecord.id).toBe('rec123');
                done();
            });
    });

    it('can delete multiple records', function() {
        return airtable
            .base('app123')
            .table('Table')
            .destroy(['rec123', 'rec456'])
            .then(function(deletedRecords) {
                expect(deletedRecords).toHaveLength(2);
                expect(deletedRecords[0].id).toBe('rec123');
                expect(deletedRecords[1].id).toBe('rec456');
            });
    });

    it('can delete multiple records and call a callback', function(done) {
        airtable
            .base('app123')
            .table('Table')
            .destroy(['rec123', 'rec456'], function(err, deletedRecords) {
                expect(err).toBeNull();
                expect(deletedRecords).toHaveLength(2);
                expect(deletedRecords).toHaveLength(2);
                expect(deletedRecords[0].id).toBe('rec123');
                expect(deletedRecords[1].id).toBe('rec456');
                done();
            });
    });
});
