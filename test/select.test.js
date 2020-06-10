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

    it('selects records with valid params', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            expect(req.method).toBe('GET');
            expect(req.url).toBe(
                '/v0/app123/Table?maxRecords=50&sort%5B0%5D%5Bfield%5D=Name&sort%5B0%5D%5Bdirection%5D=desc'
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
            .select({maxRecords: 50, sort: [{field: 'Name', direction: 'desc'}]})
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

    it('selects records errors when the params are not a plain object', function() {
        return expect(() => {
            airtable
                .base('app123')
                .table('Table')
                .select('?invalid=params');
        }).toThrow(/should be a plain object/);
    });
});
