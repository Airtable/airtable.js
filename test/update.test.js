'use strict';

var testHelpers = require('./test_helpers');

describe('record updates', function() {
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
        return teardownAsync();
    });

    describe('non-destructive updates', function() {
        it('can update one record', function() {
            return airtable
                .base('app123')
                .table('Table')
                .update('rec123', {
                    foo: 'boo',
                    bar: 'yar',
                })
                .then(function(updatedRecord) {
                    expect(updatedRecord.id).toBe('rec123');
                    expect(updatedRecord.get('foo')).toBe('boo');
                    expect(updatedRecord.get('bar')).toBe('yar');
                });
        });

        it('can update one record and call a callback', function(done) {
            airtable
                .base('app123')
                .table('Table')
                .update(
                    'rec123',
                    {
                        foo: 'boo',
                        bar: 'yar',
                    },
                    function(err, updatedRecord) {
                        expect(err).toBeNull();
                        expect(updatedRecord.id).toBe('rec123');
                        expect(updatedRecord.get('foo')).toBe('boo');
                        expect(updatedRecord.get('bar')).toBe('yar');
                        done();
                    }
                );
        });

        it('can add the "typecast" parameter when updating one record', function() {
            return airtable
                .base('app123')
                .table('Table')
                .update(
                    'rec123',
                    {
                        foo: 'boo',
                        bar: 'yar',
                    },
                    {typecast: true}
                )
                .then(function(updatedRecord) {
                    expect(updatedRecord.id).toBe('rec123');
                    expect(updatedRecord.get('typecasted')).toBe(true);
                });
        });

        it('can update one record with an array', function() {
            return airtable
                .base('app123')
                .table('Table')
                .update([
                    {
                        id: 'rec123',
                        fields: {foo: 'boo'},
                    },
                ])
                .then(function(updatedRecords) {
                    expect(updatedRecords).toHaveLength(1);
                    expect(updatedRecords[0].id).toBe('rec123');
                    expect(updatedRecords[0].get('foo')).toBe('boo');
                });
        });

        it('can throw an error if a single record update fails', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.status(402).json({
                    error: {message: 'foo bar'},
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .update('rec123', {
                    foo: 'boo',
                    bar: 'yar',
                })
                .then(
                    function() {
                        throw new Error('Promise unexpectly fufilled.');
                    },
                    function(err) {
                        expect(err.statusCode).toBe(402);
                        expect(err.message).toBe('foo bar');
                        done();
                    }
                );
        });

        it('can update two records', function() {
            return airtable
                .base('app123')
                .table('Table')
                .update([
                    {
                        id: 'rec123',
                        fields: {foo: 'boo'},
                    },
                    {
                        id: 'rec456',
                        fields: {bar: 'yar'},
                    },
                ])
                .then(function(updatedRecords) {
                    expect(updatedRecords).toHaveLength(2);
                    expect(updatedRecords[0].id).toBe('rec123');
                    expect(updatedRecords[0].get('foo')).toBe('boo');
                    expect(updatedRecords[1].id).toBe('rec456');
                    expect(updatedRecords[1].get('bar')).toBe('yar');
                });
        });

        it('can update two records and call a callback', function(done) {
            airtable
                .base('app123')
                .table('Table')
                .update(
                    [
                        {
                            id: 'rec123',
                            fields: {foo: 'boo'},
                        },
                        {
                            id: 'rec456',
                            fields: {bar: 'yar'},
                        },
                    ],
                    function(err, updatedRecords) {
                        expect(err).toBeNull();
                        expect(updatedRecords).toHaveLength(2);
                        expect(updatedRecords[0].id).toBe('rec123');
                        expect(updatedRecords[0].get('foo')).toBe('boo');
                        expect(updatedRecords[1].id).toBe('rec456');
                        expect(updatedRecords[1].get('bar')).toBe('yar');
                        done();
                    }
                );
        });

        it('can update two records with the "typecast" parameter', function() {
            return airtable
                .base('app123')
                .table('Table')
                .update(
                    [
                        {
                            id: 'rec123',
                            fields: {foo: 'boo'},
                        },
                        {
                            id: 'rec456',
                            fields: {bar: 'yar'},
                        },
                    ],
                    {typecast: true}
                )
                .then(function(updatedRecords) {
                    expect(updatedRecords).toHaveLength(2);
                    expect(updatedRecords[0].id).toBe('rec123');
                    expect(updatedRecords[0].get('typecasted')).toBe(true);
                    expect(updatedRecords[1].id).toBe('rec456');
                    expect(updatedRecords[1].get('typecasted')).toBe(true);
                });
        });

        it('can throw an error if a multi-record update fails', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.status(402).json({
                    error: {message: 'foo bar'},
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .update([
                    {
                        id: 'rec123',
                        fields: {foo: 'boo'},
                    },
                    {
                        id: 'rec456',
                        fields: {bar: 'yar'},
                    },
                ])
                .then(
                    function() {
                        throw new Error('Promise unexpectly fufilled.');
                    },
                    function(err) {
                        expect(err.statusCode).toBe(402);
                        expect(err.message).toBe('foo bar');
                        done();
                    }
                );
        });

        it('can throw an error if a multi-record update call fails due to network error', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.status(522).end();
            });

            return airtable
                .base('app123')
                .table('Table')
                .update([
                    {
                        id: 'rec123',
                        fields: {foo: 'boo'},
                    },
                    {
                        id: 'rec456',
                        fields: {bar: 'yar'},
                    },
                ])
                .then(
                    function() {
                        throw new Error('Promise unexpectly fufilled.');
                    },
                    function(err) {
                        expect(err.statusCode).toBe(522);
                        expect(err.message).toBe('An unexpected error occurred');
                        done();
                    }
                );
        });
    });

    describe('destructive updates', function() {
        it('can update one record', function() {
            return airtable
                .base('app123')
                .table('Table')
                .replace('rec123', {
                    foo: 'boo',
                    bar: 'yar',
                })
                .then(function(updatedRecord) {
                    expect(updatedRecord.id).toBe('rec123');
                    expect(updatedRecord.get('foo')).toBe('boo');
                    expect(updatedRecord.get('bar')).toBe('yar');
                });
        });

        it('can add the "typecast" parameter when updating one record', function() {
            return airtable
                .base('app123')
                .table('Table')
                .replace(
                    'rec123',
                    {
                        foo: 'boo',
                        bar: 'yar',
                    },
                    {typecast: true}
                )
                .then(function(updatedRecord) {
                    expect(updatedRecord.id).toBe('rec123');
                    expect(updatedRecord.get('typecasted')).toBe(true);
                });
        });

        it('can throw an error if a single record replace fails', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.status(402).json({
                    error: {message: 'foo bar'},
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .replace('rec123', {
                    foo: 'boo',
                    bar: 'yar',
                })
                .then(
                    function() {
                        throw new Error('Promise unexpectly fufilled.');
                    },
                    function(err) {
                        expect(err.statusCode).toBe(402);
                        expect(err.message).toBe('foo bar');
                        done();
                    }
                );
        });

        it('can update one record with an array', function() {
            return airtable
                .base('app123')
                .table('Table')
                .replace([
                    {
                        id: 'rec123',
                        fields: {foo: 'boo'},
                    },
                ])
                .then(function(updatedRecords) {
                    expect(updatedRecords).toHaveLength(1);
                    expect(updatedRecords[0].id).toBe('rec123');
                    expect(updatedRecords[0].get('foo')).toBe('boo');
                });
        });

        it('can update two records', function() {
            return airtable
                .base('app123')
                .table('Table')
                .replace([
                    {
                        id: 'rec123',
                        fields: {foo: 'boo'},
                    },
                    {
                        id: 'rec456',
                        fields: {bar: 'yar'},
                    },
                ])
                .then(function(updatedRecords) {
                    expect(updatedRecords).toHaveLength(2);
                    expect(updatedRecords[0].id).toBe('rec123');
                    expect(updatedRecords[0].get('foo')).toBe('boo');
                    expect(updatedRecords[1].id).toBe('rec456');
                    expect(updatedRecords[1].get('bar')).toBe('yar');
                });
        });

        it('can update two records with the "typecast" parameter', function() {
            return airtable
                .base('app123')
                .table('Table')
                .replace(
                    [
                        {
                            id: 'rec123',
                            fields: {foo: 'boo'},
                        },
                        {
                            id: 'rec456',
                            fields: {bar: 'yar'},
                        },
                    ],
                    {typecast: true}
                )
                .then(function(updatedRecords) {
                    expect(updatedRecords).toHaveLength(2);
                    expect(updatedRecords[0].id).toBe('rec123');
                    expect(updatedRecords[0].get('typecasted')).toBe(true);
                    expect(updatedRecords[1].id).toBe('rec456');
                    expect(updatedRecords[1].get('typecasted')).toBe(true);
                });
        });
    });
});
