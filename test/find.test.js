'use strict';

var testHelpers = require('./test_helpers');

describe('record retrival', function() {
    var airtable;
    var testExpressApp;
    var teardownAsync;

    beforeEach(function() {
        return testHelpers.getMockEnvironmentAsync().then(function(env) {
            airtable = env.airtable;
            testExpressApp = env.testExpressApp;
            teardownAsync = env.teardownAsync;
        });
    });

    afterEach(function() {
        delete global.window;
        return teardownAsync();
    });

    it('can find one record', function() {
        var recordId = 'record1';

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/record1?');
            expect(req.get('user-agent')).toMatch(/Airtable.js/);
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

    it('set the correct headers in a browser', function() {
        global.window = {};
        var recordId = 'record1';

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/record1?');
            expect(req.get('x-airtable-user-agent')).toMatch(/Airtable.js/);
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

    it('set the correct headers in a browser', function() {
        global.window = {};
        var recordId = 'record1';

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/record1?');
            expect(req.get('x-airtable-user-agent')).toMatch(/Airtable.js/);
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

    it('can handle an error', function() {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .find('recabcd')
            .then(
                function() {
                    throw new Error('Promise unexpectly fufilled.');
                },
                function(err) {
                    expect(err.statusCode).toBe(402);
                    expect(err.message).toBe('foo bar');
                }
            );
    });

    it('can find after a retry if rate limited', function() {
        var apiCallCount = 0;
        var recordId = 'record1';

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/record1?');
            if (apiCallCount === 0) {
                res.status(429).json({
                    error: {message: 'Over rate limit'},
                });
            } else if (apiCallCount === 1) {
                res.json({
                    id: req.params.recordId,
                    fields: {Name: 'Rebecca'},
                    createdTime: '2020-04-20T16:20:00.000Z',
                });
            }
            apiCallCount++;
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

    it('can timeout if the servers are slow', function(done) {
        var recordId = 'record1';

        testExpressApp.set('handler override', function(req) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/record1?');
            // Timeout before returning a response
        });

        return airtable
            .base('app123')
            .table('Table')
            .find(recordId)
            .then(
                function() {
                    throw new Error('Promise unexpectedly fufilled.');
                },
                function(err) {
                    expect(err.message).toMatch(/aborted/);
                    done();
                }
            );
    });
});
