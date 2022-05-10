'use strict';

var testHelpers = require('./test_helpers');

describe('record selection', function() {
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

    it('selects records without params', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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
            .select()
            .eachPage(function page(records) {
                expect(records.length).toBe(1);
                records.forEach(function(record) {
                    expect(record.id).toBe('recordA');
                    expect(record.get('Name')).toBe('Rebecca');
                });
                done();
            });
    });

    it('selects records more than one record', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
            res.json({
                records: [
                    {
                        id: 'recordA',
                        fields: {Name: 'Rebecca'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                    {
                        id: 'recordB',
                        fields: {Name: 'Drew'},
                        createdTime: '2020-04-20T16:20:00.000Z',
                    },
                ],
                offset: 'offsetABC',
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .select()
            .eachPage(function page(records) {
                expect(records.length).toBe(2);
                expect(records[0].id).toBe('recordA');
                expect(records[0].get('Name')).toBe('Rebecca');
                expect(records[1].id).toBe('recordB');
                expect(records[1].get('Name')).toBe('Drew');
                done();
            });
    });

    it('selects all records', function(done) {
        var iterationCounter = 0;

        testExpressApp.set('handler override', function(req, res) {
            if (iterationCounter === 0) {
                expect(req.method).toBe('GET');
                expect(req.url).toBe('/v0/app123/Table?');
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
            } else if (iterationCounter === 1) {
                expect(req.method).toBe('GET');
                expect(req.url).toBe('/v0/app123/Table?offset=offsetABC');
                res.json({
                    records: [
                        {
                            id: 'recordB',
                            fields: {Name: 'Drew'},
                            createdTime: '2020-04-20T16:20:00.000Z',
                        },
                    ],
                });
            }
            iterationCounter++;
        });

        return airtable
            .base('app123')
            .table('Table')
            .select()
            .all(function(err, records) {
                expect(err).toBeNull();
                expect(records.length).toBe(2);
                expect(records[0].id).toBe('recordA');
                expect(records[0].get('Name')).toBe('Rebecca');
                expect(records[1].id).toBe('recordB');
                expect(records[1].get('Name')).toBe('Drew');
                expect(iterationCounter).toBe(2);
                done();
            });
    });

    it('handles errors when selecting  all records', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .select()
            .all(function(err, result) {
                expect(err.statusCode).toBe(402);
                expect(err.message).toBe('foo bar');
                expect(result).toBeNull();
                done();
            });
    });

    it('handles errors without JSON bodies when selecting  all records', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(404).end();
        });

        return airtable
            .base('app123')
            .table('Table')
            .select()
            .all(function(err, result) {
                expect(err.statusCode).toBe(404);
                expect(err.message).toBe('Could not find what you are looking for');
                expect(result).toBeNull();
                done();
            });
    });

    it('all errors on the first invalid parameter', function() {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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

        return expect(
            airtable
                .base('app123')
                .table('Table')
                .select()
                .all('monkeys')
        ).rejects.toThrow(/must be a function/);
    });

    it('selects records and paginates the selection without a done function', function(done) {
        var iterationCounter = 0;

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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
            .select()
            .eachPage(function page(records, fetchNextPage) {
                if (iterationCounter === 0) {
                    expect(records.length).toBe(1);
                    records.forEach(function(record) {
                        expect(record.id).toBe('recordA');
                        expect(record.get('Name')).toBe('Rebecca');
                    });

                    testExpressApp.set('handler override', function(req, res) {
                        expect(req.method).toBe('GET');
                        expect(req.url).toBe('/v0/app123/Table?offset=offsetABC');
                        res.json({
                            records: [
                                {
                                    id: 'recordB',
                                    fields: {Name: 'Clinton'},
                                    createdTime: '2020-04-20T16:20:00.000Z',
                                },
                            ],
                        });
                    });
                } else if (iterationCounter === 1) {
                    expect(records.length).toBe(1);
                    records.forEach(function(record) {
                        expect(record.id).toBe('recordB');
                        expect(record.get('Name')).toBe('Clinton');
                    });
                }
                iterationCounter++;
                fetchNextPage();
            })
            .then(function() {
                expect(iterationCounter).toBe(2);
                done();
            });
    });

    it('selects records and paginates the selection with a done function', function(done) {
        var iterationCounter = 0;

        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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
            .select()
            .eachPage(
                function page(records, fetchNextPage) {
                    if (iterationCounter === 0) {
                        expect(records.length).toBe(1);
                        records.forEach(function(record) {
                            expect(record.id).toBe('recordA');
                            expect(record.get('Name')).toBe('Rebecca');
                        });

                        testExpressApp.set('handler override', function(req, res) {
                            expect(req.method).toBe('GET');
                            expect(req.url).toBe('/v0/app123/Table?offset=offsetABC');
                            res.json({
                                records: [
                                    {
                                        id: 'recordB',
                                        fields: {Name: 'Clinton'},
                                        createdTime: '2020-04-20T16:20:00.000Z',
                                    },
                                ],
                            });
                        });
                    } else if (iterationCounter === 1) {
                        expect(records.length).toBe(1);
                        records.forEach(function(record) {
                            expect(record.id).toBe('recordB');
                            expect(record.get('Name')).toBe('Clinton');
                        });
                    }
                    iterationCounter++;
                    fetchNextPage();
                },
                function(err) {
                    expect(err).toBeNull();
                    expect(iterationCounter).toBe(2);
                    done();
                }
            );
    });

    it('selects records with valid params', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe(
                '/v0/app123/Table?maxRecords=50&sort%5B0%5D%5Bfield%5D=Name&sort%5B0%5D%5Bdirection%5D=desc&cellFormat=json&returnFieldsByFieldId=true'
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
            .select({
                maxRecords: 50,
                sort: [{field: 'Name', direction: 'desc'}],
                cellFormat: 'json',
                returnFieldsByFieldId: true,
            })
            .eachPage(function page(records) {
                records.forEach(function(record) {
                    expect(record.id).toBe('recordA');
                    expect(record.get('Name')).toBe('Rebecca');
                });
                done();
            });
    });

    it('selects records filters out invalid parameters and extra arguments without erroring', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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
            .select({ignoredParam: 'ignore me'}, {anotherIgnored: 'param'})
            .eachPage(function page(records) {
                records.forEach(function(record) {
                    expect(record.id).toBe('recordA');
                    expect(record.get('Name')).toBe('Rebecca');
                });
                done();
            });
    });

    it('selects records errors on invalid parameters', function() {
        return expect(() => {
            airtable
                .base('app123')
                .table('Table')
                .select({maxRecords: 'should not be a string'});
        }).toThrow(/`maxRecords` should be a number/);
    });

    it('eachRecords errors on the first invalid parameter', function() {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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

        return expect(
            airtable
                .base('app123')
                .table('Table')
                .select()
                .eachPage('monkeys')
        ).rejects.toThrow(/must be a function/);
    });

    it('eachRecords errors on the second invalid parameter', function() {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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

        return expect(
            airtable
                .base('app123')
                .table('Table')
                .select()
                .eachPage(function() {}, 'monkeys')
        ).rejects.toThrow(/must be a function/);
    });

    it('can throw an error if update fails', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .select()
            .eachPage(
                function() {},
                function(err, result) {
                    expect(err.statusCode).toBe(402);
                    expect(err.message).toBe('foo bar');
                    expect(result).toBeNull();
                    done();
                }
            );
    });

    it('selects records errors when the params are not a plain object', function() {
        return expect(() => {
            airtable
                .base('app123')
                .table('Table')
                .select('?invalid=params');
        }).toThrow(/should be a plain object/);
    });

    it('selects records the first page of records', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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
            .select()
            .firstPage(function(err, records) {
                expect(err).toBeNull();
                expect(records.length).toBe(1);
                records.forEach(function(record) {
                    expect(record.id).toBe('recordA');
                    expect(record.get('Name')).toBe('Rebecca');
                });
                done();
            });
    });

    it('firstPage errors without a done function', function() {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe('/v0/app123/Table?');
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

        return expect(
            airtable
                .base('app123')
                .table('Table')
                .select()
                .firstPage('monkeys')
        ).rejects.toThrow(/must be a function/);
    });

    it('firstPage will handle errors', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .select()
            .firstPage(function(err, result) {
                expect(err.statusCode).toBe(402);
                expect(err.message).toBe('foo bar');
                expect(result).toBeNull();
                done();
            });
    });
});
