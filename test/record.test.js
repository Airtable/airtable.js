'use strict';

var Record = require('../lib/record');
var testHelpers = require('./test_helpers');

describe('Record', function() {
    var airtable;
    var table;
    var teardownAsync;
    var testExpressApp;
    var baseId = 'app123';

    beforeEach(function() {
        return testHelpers.getMockEnvironmentAsync().then(function(env) {
            airtable = env.airtable;
            teardownAsync = env.teardownAsync;
            testExpressApp = env.testExpressApp;
            table = airtable.base(baseId).table('Table');
        });
    });

    afterEach(function() {
        return teardownAsync();
    });

    it('can be initialized with a record ID and no data', function() {
        var record = new Record(table, 'rec123');
        expect(record.id).toBe('rec123');
        expect(record.fields).toEqual({});
    });

    it('can be initialized with data, which contains the ID', function() {
        var record = new Record(table, null, {
            id: 'rec123',
            fields: {foo: 'bar'},
        });
        expect(record.id).toBe('rec123');
        expect(record.fields).toEqual({foo: 'bar'});
        expect(record.get('foo')).toBe('bar');
    });

    it('can be initialized with data and an ID (the explicit ID wins)', function() {
        var record = new Record(table, 'rec123', {
            id: 'recIGNORED',
            fields: {foo: 'bar'},
        });
        expect(record.id).toBe('rec123');
        expect(record.fields).toEqual({foo: 'bar'});
    });

    describe('getId', function() {
        it('returns the record ID', function() {
            expect(new Record(table, 'rec123').getId()).toBe('rec123');
        });
    });

    describe('get', function() {
        var record;
        beforeEach(function() {
            record = new Record(table, null, {
                id: 'rec123',
                fields: {foo: 'bar'},
            });
        });

        it("returns a field's value if set", function() {
            expect(record.get('foo')).toBe('bar');
        });

        it("returns undefined if requesting a cell value that doesn't exist", function() {
            expect(record.get('missing')).toBeUndefined();
        });
    });

    describe('set', function() {
        var record;
        beforeEach(function() {
            record = new Record(table, null, {
                id: 'rec123',
                fields: {foo: 'bar'},
            });
        });

        it('sets a new value', function() {
            record.set('bing', 'sing');
            expect(record.get('bing')).toBe('sing');
        });

        it('re-sets an existing value', function() {
            record.set('foo', 'pig');
            expect(record.get('foo')).toBe('pig');
        });
    });

    describe('patchUpdate', function() {
        var record;

        beforeEach(function() {
            record = new Record(table, null, {
                id: 'rec123',
                fields: {foo: 'bar'},
            });

            testExpressApp.set('handler override', function(req, res) {
                expect(req.method).toBe('PATCH');
                expect(req.url).toBe('/v0/app123/Table/rec123?');
                expect(req.body).toStrictEqual({fields: {baz: 'qux'}});
                res.json({
                    id: req.params.recordId,
                    fields: {foo: 'bar', baz: 'qux'},
                    createdTime: '2020-04-20T16:20:00.000Z',
                });
            });
        });

        it('patch-updates the record and calls a callback', function(done) {
            record.patchUpdate({baz: 'qux'}, function(err, updatedRecord) {
                expect(err).toBeNull();

                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toEqual('bar');
                expect(record.get('baz')).toEqual('qux');
                done();
            });
        });

        it('returns a promise when no callback is passed', function() {
            return record.patchUpdate({baz: 'qux'}).then(function(updatedRecord) {
                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toEqual('bar');
                expect(record.get('baz')).toEqual('qux');
            });
        });

        it('aliases "updateFields"', function() {
            expect(record.updateFields).toBe(record.patchUpdate);
        });
    });

    describe('putUpdate', function() {
        var record;

        beforeEach(function() {
            record = new Record(table, null, {
                id: 'rec123',
                fields: {foo: 'bar'},
            });

            testExpressApp.set('handler override', function(req, res) {
                expect(req.method).toBe('PUT');
                expect(req.url).toBe('/v0/app123/Table/rec123?');
                expect(req.body).toStrictEqual({fields: {baz: 'qux'}});
                res.json({
                    id: req.params.recordId,
                    fields: {baz: 'qux'},
                    createdTime: '2020-04-20T16:20:00.000Z',
                });
            });
        });

        it('put-updates the record and calls a callback', function(done) {
            record.putUpdate({baz: 'qux'}, function(err, updatedRecord) {
                expect(err).toBeNull();

                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toBeUndefined();
                expect(record.get('baz')).toEqual('qux');
                done();
            });
        });

        it('saves the record and calls a callback', function(done) {
            record.set('foo', undefined); // eslint-disable-line no-undefined
            record.set('baz', 'qux');
            record.save(function(err, updatedRecord) {
                expect(err).toBeNull();

                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toBeUndefined();
                expect(record.get('baz')).toEqual('qux');
                done();
            });
        });

        it('returns a promise when no callback is passed', function() {
            return record.putUpdate({baz: 'qux'}).then(function(updatedRecord) {
                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toBeUndefined();
                expect(record.get('baz')).toEqual('qux');
            });
        });

        it('aliases "replaceFields"', function() {
            expect(record.replaceFields).toBe(record.putUpdate);
        });
    });

    describe('fetch', function() {
        beforeEach(function() {
            testExpressApp.set('handler override', function(req, res) {
                expect(req.method).toBe('GET');
                expect(req.url).toBe('/v0/app123/Table/rec123?');
                res.json({
                    id: req.params.recordId,
                    fields: {foo: 'bar'},
                    createdTime: '2020-04-20T16:20:00.000Z',
                });
            });
        });

        it('fetches a record and calls a callback', function(done) {
            var record = new Record(table, 'rec123');

            record.fetch(function(err, fetchedRecord) {
                expect(err).toBeNull();
                expect(fetchedRecord).toBe(record);
                expect(record.get('foo')).toBe('bar');
                expect(record.get('baz')).toBeUndefined();
                done();
            });
        });

        it('returns a promise when no callback is passed', function() {
            var record = new Record(table, 'rec123');

            return record.fetch().then(function(fetchedRecord) {
                expect(fetchedRecord).toBe(record);
                expect(record.get('foo')).toBe('bar');
                expect(record.get('baz')).toBeUndefined();
            });
        });
    });
});
