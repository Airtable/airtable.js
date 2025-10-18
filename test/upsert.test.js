'use strict';

var testHelpers = require('./test_helpers');

describe('record upsert', function() {
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

    describe('basic upsert functionality', function() {
        it('can upsert records with single merge field', function() {
            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'John Doe',
                                Email: 'john@example.com',
                            },
                        },
                    ],
                    ['Email']
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(1);
                    expect(upsertedRecords[0].id).toBe('rec0');
                    expect(upsertedRecords[0].get('Name')).toBe('John Doe');
                    expect(upsertedRecords[0].get('Email')).toBe('john@example.com');
                });
        });

        it('can upsert records with multiple merge fields', function() {
            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Jane Smith',
                                Email: 'jane@example.com',
                                Company: 'Acme Corp',
                            },
                        },
                    ],
                    ['Email', 'Company']
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(1);
                    expect(upsertedRecords[0].id).toBe('rec0');
                    expect(upsertedRecords[0].get('Name')).toBe('Jane Smith');
                    expect(upsertedRecords[0].get('Email')).toBe('jane@example.com');
                    expect(upsertedRecords[0].get('Company')).toBe('Acme Corp');
                });
        });

        it('can upsert multiple records', function() {
            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Alice',
                                Email: 'alice@example.com',
                            },
                        },
                        {
                            fields: {
                                Name: 'Bob',
                                Email: 'bob@example.com',
                            },
                        },
                    ],
                    ['Email']
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(2);
                    expect(upsertedRecords[0].id).toBe('rec0');
                    expect(upsertedRecords[0].get('Name')).toBe('Alice');
                    expect(upsertedRecords[1].id).toBe('rec1');
                    expect(upsertedRecords[1].get('Name')).toBe('Bob');
                });
        });

        it('can upsert with typecast option', function() {
            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Test User',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                    ['Email'],
                    {typecast: true}
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(1);
                    expect(upsertedRecords[0].id).toBe('rec0');
                    expect(upsertedRecords[0].get('typecasted')).toBe(true);
                });
        });
    });

    describe('callback API', function() {
        it('can upsert records and call a callback', function(done) {
            airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Callback Test',
                                Email: 'callback@example.com',
                            },
                        },
                    ],
                    ['Email'],
                    function(err, upsertedRecords) {
                        expect(err).toBeNull();
                        expect(upsertedRecords).toHaveLength(1);
                        expect(upsertedRecords[0].id).toBe('rec0');
                        expect(upsertedRecords[0].get('Name')).toBe('Callback Test');
                        done();
                    }
                );
        });

        it('can upsert records with options and call a callback', function(done) {
            airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Options Test',
                                Email: 'options@example.com',
                            },
                        },
                    ],
                    ['Email'],
                    {typecast: true},
                    function(err, upsertedRecords) {
                        expect(err).toBeNull();
                        expect(upsertedRecords).toHaveLength(1);
                        expect(upsertedRecords[0].id).toBe('rec0');
                        expect(upsertedRecords[0].get('typecasted')).toBe(true);
                        done();
                    }
                );
        });
    });

    describe('error handling', function() {
        it('throws error for empty fieldsToMergeOn array', function(done) {
            airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                    [],
                    function(err) {
                        expect(err).toBeInstanceOf(Error);
                        expect(err.message).toBe(
                            'fieldsToMergeOn must be a non-empty array of field names'
                        );
                        done();
                    }
                );
        });

        it('throws error for non-array recordsData', function(done) {
            airtable
                .base('app123')
                .table('Table')
                .upsert(
                    {
                        fields: {
                            Name: 'Test',
                            Email: 'test@example.com',
                        },
                    },
                    ['Email'],
                    function(err) {
                        expect(err).toBeInstanceOf(Error);
                        expect(err.message).toBe(
                            'recordsData must be an array for upsert operations'
                        );
                        done();
                    }
                );
        });

        it('can throw an error if upsert fails', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.status(402).json({
                    error: {message: 'upsert failed'},
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                    ['Email']
                )
                .then(
                    function() {
                        throw new Error('Promise unexpectedly fulfilled.');
                    },
                    function(err) {
                        expect(err.statusCode).toBe(402);
                        expect(err.message).toBe('upsert failed');
                        done();
                    }
                );
        });

        it('handles API validation errors', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.status(422).json({
                    error: {
                        type: 'INVALID_REQUEST_BODY',
                        message: 'The request body is invalid',
                    },
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                    ['Email']
                )
                .then(
                    function() {
                        throw new Error('Promise unexpectedly fulfilled.');
                    },
                    function(err) {
                        expect(err.statusCode).toBe(422);
                        expect(err.error).toBe('INVALID_REQUEST_BODY');
                        done();
                    }
                );
        });
    });

    describe('edge cases', function() {
        it('handles mixed field formats in records', function() {
            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Formatted Record',
                                Email: 'formatted@example.com',
                            },
                        },
                        {
                            fields: {
                                Name: 'Plain Record',
                                Email: 'plain@example.com',
                            },
                        },
                    ],
                    ['Email']
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(2);
                    expect(upsertedRecords[0].get('Name')).toBe('Formatted Record');
                    expect(upsertedRecords[1].get('Name')).toBe('Plain Record');
                });
        });

        it('handles string records in array', function() {
            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'String Record',
                                Email: 'string@example.com',
                            },
                        },
                        {
                            fields: {
                                Name: 'Object Record',
                                Email: 'object@example.com',
                            },
                        },
                    ],
                    ['Name']
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(2);
                    expect(upsertedRecords[0].get('Name')).toBe('String Record');
                    expect(upsertedRecords[1].get('Name')).toBe('Object Record');
                });
        });

        it('validates request payload structure', function() {
            testExpressApp.set('handler override', function(req, res) {
                expect(req.method).toBe('PATCH');
                expect(req.body.performUpsert).toBeDefined();
                expect(req.body.performUpsert.fieldsToMergeOn).toEqual(['Email']);
                expect(req.body.records).toHaveLength(1);
                expect(req.body.records[0].fields).toEqual({
                    Name: 'Test',
                    Email: 'test@example.com',
                });

                res.json({
                    records: [
                        {
                            id: 'rec0',
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                    ['Email']
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(1);
                });
        });

        it('includes typecast option in request payload', function() {
            testExpressApp.set('handler override', function(req, res) {
                expect(req.body.typecast).toBe(true);
                expect(req.body.performUpsert).toBeDefined();

                res.json({
                    records: [
                        {
                            id: 'rec0',
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                                typecasted: true,
                            },
                        },
                    ],
                });
            });

            return airtable
                .base('app123')
                .table('Table')
                .upsert(
                    [
                        {
                            fields: {
                                Name: 'Test',
                                Email: 'test@example.com',
                            },
                        },
                    ],
                    ['Email'],
                    {typecast: true}
                )
                .then(function(upsertedRecords) {
                    expect(upsertedRecords).toHaveLength(1);
                    expect(upsertedRecords[0].get('typecasted')).toBe(true);
                });
        });
    });
});
