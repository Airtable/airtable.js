'use strict';

var testHelpers = require('./test_helpers');

describe('record creation', function() {
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

    it('can create one record', function() {
        return airtable
            .base('app123')
            .table('Table')
            .create({
                foo: 'boo',
                bar: 'yar',
            })
            .then(function(createdRecord) {
                expect(createdRecord.id).toBe('rec0');
                expect(createdRecord.get('foo')).toBe('boo');
                expect(createdRecord.get('bar')).toBe('yar');
            });
    });

    it('can create one record and call a callback', function(done) {
        airtable
            .base('app123')
            .table('Table')
            .create(
                {
                    foo: 'boo',
                    bar: 'yar',
                },
                function(err, createdRecord) {
                    expect(err).toBeNull();
                    expect(createdRecord.id).toBe('rec0');
                    expect(createdRecord.get('foo')).toBe('boo');
                    expect(createdRecord.get('bar')).toBe('yar');
                    done();
                }
            );
    });

    it('can throw an error if create fails', function(done) {
        testExpressApp.set('handler override', function(req, res) {
            res.status(402).json({
                error: {message: 'foo bar'},
            });
        });

        return airtable
            .base('app123')
            .table('Table')
            .create(
                {
                    foo: 'boo',
                    bar: 'yar',
                },
                {typecast: true}
            )
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

    it('can add the "typecast" parameter when creating one record', function() {
        return airtable
            .base('app123')
            .table('Table')
            .create(
                {
                    foo: 'boo',
                    bar: 'yar',
                },
                {typecast: true}
            )
            .then(function(createdRecord) {
                expect(createdRecord.id).toBe('rec0');
                expect(createdRecord.get('typecasted')).toBe(true);
            });
    });

    it('can create one record with an array', function() {
        return airtable
            .base('app123')
            .table('Table')
            .create([
                {
                    fields: {foo: 'boo'},
                },
            ])
            .then(function(createdRecords) {
                expect(createdRecords).toHaveLength(1);
                expect(createdRecords[0].id).toBe('rec0');
                expect(createdRecords[0].get('foo')).toBe('boo');
            });
    });

    it('can create two records', function() {
        return airtable
            .base('app123')
            .table('Table')
            .create([{fields: {foo: 'boo'}}, {fields: {bar: 'yar'}}])
            .then(function(createdRecords) {
                expect(createdRecords).toHaveLength(2);
                expect(createdRecords[0].id).toBe('rec0');
                expect(createdRecords[0].get('foo')).toBe('boo');
                expect(createdRecords[1].id).toBe('rec1');
                expect(createdRecords[1].get('bar')).toBe('yar');
            });
    });

    it('can create two records and call a callback', function(done) {
        airtable
            .base('app123')
            .table('Table')
            .create([{fields: {foo: 'boo'}}, {fields: {bar: 'yar'}}], function(
                err,
                createdRecords
            ) {
                expect(err).toBeNull();
                expect(createdRecords).toHaveLength(2);
                expect(createdRecords[0].id).toBe('rec0');
                expect(createdRecords[0].get('foo')).toBe('boo');
                expect(createdRecords[1].id).toBe('rec1');
                expect(createdRecords[1].get('bar')).toBe('yar');
                done();
            });
    });

    it('can create two records with the "typecast" parameter', function() {
        return airtable
            .base('app123')
            .table('Table')
            .create([{fields: {foo: 'boo'}}, {fields: {bar: 'yar'}}], {typecast: true})
            .then(function(createdRecords) {
                expect(createdRecords).toHaveLength(2);
                expect(createdRecords[0].id).toBe('rec0');
                expect(createdRecords[0].get('typecasted')).toBe(true);
                expect(createdRecords[1].id).toBe('rec1');
                expect(createdRecords[1].get('typecasted')).toBe(true);
            });
    });
});
