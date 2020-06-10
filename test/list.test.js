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
                expect(err.statusCode).toBe(402);
                expect(err.message).toBe('foo bar');
                expect(records).toBeUndefined();
                expect(offset).toBeUndefined();
                done();
            });
    });

    it('iterates through each record with opts', function(done) {
        var iterationCounter = 0;

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/?limit=100&opts=arepassedalong');
            res.json({
                records: [
                    {
                        id: 'recordA',
                        fields: {Name: 'Rebecca'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                    {
                        id: 'recordB',
                        fields: {Name: 'Mike'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                ],
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .forEach(
                {opts: 'arepassedalong'},
                function(record) {
                    if (iterationCounter === 0) {
                        expect(record.getId()).toBe('recordA');
                        expect(record.get('Name')).toBe('Rebecca');
                    } else if (iterationCounter === 1) {
                        expect(record.getId()).toBe('recordB');
                        expect(record.get('Name')).toBe('Mike');
                    }
                    iterationCounter++;
                },
                function() {
                    expect(iterationCounter).toBe(2);
                    done();
                }
            );
    });

    it('iterates through each record without opts', function(done) {
        var iterationCounter = 0;
        var json = {
            records: [
                {
                    id: 'recordA',
                    fields: {Name: 'Rebecca'},
                    createdTime: '2020-04-20T16:20:00.000Z',
                },
            ],
        };

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/?limit=100');
            res.json(json);
        });

        return airtable
            .base('app123')
            .table('Table')
            .forEach(
                function(record) {
                    expect(record.getId()).toBe('recordA');
                    expect(record.get('Name')).toBe('Rebecca');
                    iterationCounter++;
                },
                function() {
                    expect(iterationCounter).toBe(1);
                    done();
                }
            );
    });

    it('iterates through records without any records', function(done) {
        var iterationCounter = 0;
        var json = {
            records: [],
        };

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/?limit=100');
            res.json(json);
        });

        return airtable
            .base('app123')
            .table('Table')
            .forEach(
                function() {
                    iterationCounter++;
                },
                function() {
                    expect(iterationCounter).toBe(0);
                    done();
                }
            );
    });

    it('can throw an error if forEach fails', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .forEach(
                function() {},
                function(err) {
                    expect(err.statusCode).toBe(402);
                    expect(err.message).toBe('foo bar');
                    done();
                }
            );
    });

    it('iterates through each record and handles pagination', function(done) {
        var iterationCounter = 0;

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table/?limit=100');
            res.json({
                records: [
                    {
                        id: 'recordA',
                        fields: {Name: 'Rebecca'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                ],
                offset: 'offset123',
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .forEach(
                function(record) {
                    if (iterationCounter === 0) {
                        expect(record.getId()).toBe('recordA');
                        expect(record.get('Name')).toBe('Rebecca');

                        testExpressApp.set('handler override', function(req, res) {
                            expect(req.method).toBe('GET');
                            expect(req.url).toBe('/v0/app123/Table/?limit=100&offset=offset123');
                            // Don't include an offset in second page of results
                            // to indicate that it is the final page of results
                            res.json({
                                records: [
                                    {
                                        id: 'recordB',
                                        fields: {Name: 'Mike'},
                                        createdTime: '2020-04-20T16:20:00.000Z',
                                    },
                                ],
                            });
                        });
                    } else if (iterationCounter === 1) {
                        expect(record.getId()).toBe('recordB');
                        expect(record.get('Name')).toBe('Mike');
                    }
                    iterationCounter++;
                },
                function() {
                    expect(iterationCounter).toBe(2);
                    done();
                }
            );
    });
});
