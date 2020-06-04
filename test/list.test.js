'use strict';

var testHelpers = require('./test_helpers');

describe('list records', function() {
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

    it('lists records with a limit and offset without opts', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/?limit=50&offset=offset000');
            res.json({
                records: [
                    {
                        id: 'recordA',
                        fields: {Name: 'Rebecca'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                ],
                offset: 'offsetABC',
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .list(50, 'offset000', function(err, records, offset) {
                expect(err).toBeNull();
                expect(records.length).toBe(1);
                expect(records[0].getId()).toBe('recordA');
                expect(records[0].get('Name')).toBe('Rebecca');
                expect(offset).toBe('offsetABC');
                done();
            });
    });

    it('lists records with a limit, offset, and opts', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe(
                '/v0/app123/Table/?limit=50&offset=offset000&otherOptions=getpassedalong'
            );
            res.json({
                records: [
                    {
                        id: 'recordA',
                        fields: {Name: 'Rebecca'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                ],
                offset: 'offsetABC',
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .list(50, 'offset000', {otherOptions: 'getpassedalong'}, function(
                err,
                records,
                offset
            ) {
                expect(err).toBeNull();
                expect(records.length).toBe(1);
                expect(records[0].getId()).toBe('recordA');
                expect(records[0].get('Name')).toBe('Rebecca');
                expect(offset).toBe('offsetABC');
                done();
            });
    });

    it('can throw an error if list fails', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .list(50, 'offset000', function(err, records, offset) {
                expect(err).not.toBeNull();
                expect(records).toBeUndefined();
                expect(offset).toBeUndefined();
                done();
            });
    });
});
