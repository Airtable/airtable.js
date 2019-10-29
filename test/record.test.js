'use strict';

var Record = require('../lib/record');

describe('Record', function() {
    var table;

    beforeEach(function() {
        table = {
            _base: {
                runAction: jest.fn(),
            },
            _urlEncodedNameOrId: function() {
                return 'My%20Table';
            },
        };
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

    describe('patchUpdate', function() {
        var record;

        beforeEach(function() {
            record = new Record(table, null, {
                id: 'rec123',
                fields: {foo: 'bar'},
            });

            table._base.runAction.mockImplementationOnce(function(
                method,
                path,
                queryParams,
                bodyData,
                callback
            ) {
                callback(null, null, {
                    id: bodyData.id,
                    createdTime: '2020-04-20T16:20:00.000Z',
                    fields: Object.assign({foo: 'bar'}, bodyData.fields),
                });
            });
        });

        it('patch-updates the record and calls a callback', function(done) {
            record.patchUpdate({baz: 'qux'}, function(err, updatedRecord) {
                expect(err).toBeNull();

                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toEqual('bar');
                expect(record.get('baz')).toEqual('qux');

                expect(table._base.runAction).toHaveBeenCalledWith(
                    'patch',
                    '/My%20Table/rec123',
                    {},
                    {
                        fields: {baz: 'qux'},
                    },
                    expect.any(Function)
                );

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

            table._base.runAction.mockImplementationOnce(function(
                method,
                path,
                queryParams,
                bodyData,
                callback
            ) {
                callback(null, null, {
                    id: bodyData.id,
                    createdTime: '2020-04-20T16:20:00.000Z',
                    fields: Object.assign(bodyData.fields),
                });
            });
        });

        it('patch-updates the record and calls a callback', function(done) {
            record.putUpdate({baz: 'qux'}, function(err, updatedRecord) {
                expect(err).toBeNull();

                expect(updatedRecord).toBe(record);
                expect(record.get('foo')).toBeUndefined();
                expect(record.get('baz')).toEqual('qux');

                expect(table._base.runAction).toHaveBeenCalledWith(
                    'put',
                    '/My%20Table/rec123',
                    {},
                    {
                        fields: {baz: 'qux'},
                    },
                    expect.any(Function)
                );

                done();
            });
        });

        it('returns a promise when no callback is passed', function() {
            return record.patchUpdate({baz: 'qux'}).then(function(updatedRecord) {
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
            table._base.runAction.mockImplementationOnce(function(
                method,
                path,
                queryParams,
                bodyData,
                callback
            ) {
                callback(null, null, {
                    id: 'rec123',
                    createdTime: '2020-04-20T16:20:00.000Z',
                    fields: {foo: 'bar'},
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

                expect(table._base.runAction).toHaveBeenCalledWith(
                    'get',
                    '/My%20Table/rec123',
                    {},
                    null,
                    expect.any(Function)
                );

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
