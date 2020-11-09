'use strict';

var Airtable = require('../lib/airtable');
var version = require('../package.json').version;
var testHelpers = require('./test_helpers');

describe('Base', function() {
    var airtable;
    var teardownAsync;
    var testExpressApp;
    var fakeBase;
    var baseId = 'app123';

    beforeEach(function() {
        return testHelpers.getMockEnvironmentAsync().then(function(env) {
            airtable = env.airtable;
            teardownAsync = env.teardownAsync;
            testExpressApp = env.testExpressApp;
            fakeBase = airtable.base(baseId);
        });
    });

    afterEach(function() {
        return teardownAsync();
    });

    describe('#makeRequest', function() {
        beforeEach(function() {
            testExpressApp.set('handler override', function(req, res) {
                res.json({foo: 'bar'});
            });
        });

        describe('HTTP method', function() {
            it('makes a GET request by default', function() {
                return fakeBase.makeRequest().then(function() {
                    expect(testExpressApp.get('most recent request').method).toEqual('GET');
                });
            });

            ['get', 'post', 'patch', 'put', 'delete'].forEach(function(method) {
                it('can set the HTTP method to ' + method, function() {
                    return fakeBase.makeRequest({method: method}).then(function() {
                        expect(testExpressApp.get('most recent request').method).toEqual(
                            method.toUpperCase()
                        );
                    });
                });
            });
        });

        describe('path', function() {
            it('makes a request to the base root URL by default', function() {
                return fakeBase.makeRequest().then(function() {
                    expect(testExpressApp.get('most recent request').path).toEqual('/v0/app123/');
                });
            });

            it('can make requests to other paths', function() {
                return fakeBase.makeRequest({path: '/foo/bar'}).then(function() {
                    expect(testExpressApp.get('most recent request').path).toEqual(
                        '/v0/app123/foo/bar'
                    );
                });
            });
        });

        describe('query strings', function() {
            it("doesn't set a query string by default", function() {
                return fakeBase.makeRequest().then(function() {
                    expect([...testExpressApp.get('most recent request').query.entries()]).toEqual(
                        []
                    );
                });
            });

            it('can set the query string', function() {
                return fakeBase
                    .makeRequest({
                        qs: {
                            foo: 'bar',
                            arr: ['one', 'two'],
                            obj: {baz: 'qux'},
                        },
                    })
                    .then(function() {
                        const {query} = testExpressApp.get('most recent request');
                        expect(query.getAll('foo')).toEqual(['bar']);
                        expect(query.getAll('arr[]')).toEqual(['one', 'two']);
                        expect(query.getAll('obj[baz]')).toEqual(['qux']);
                    });
            });
        });

        describe('headers', function() {
            it('sets two headers by default', function() {
                return fakeBase.makeRequest().then(function() {
                    const req = testExpressApp.get('most recent request');
                    expect(req.get('authorization')).toEqual('Bearer key123');
                    expect(req.get('user-agent')).toEqual('Airtable.js/' + version);
                });
            });

            it('can set additional headers', function() {
                return fakeBase
                    .makeRequest({
                        headers: {
                            'X-Foo': 'bar',
                            'X-Bar': 'baz',
                        },
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.get('authorization')).toEqual('Bearer key123');
                        expect(req.get('user-agent')).toEqual('Airtable.js/' + version);
                        expect(req.get('x-foo')).toEqual('bar');
                        expect(req.get('x-bar')).toEqual('baz');
                    });
            });

            it('can override default headers if specified with the right casing', function() {
                return fakeBase
                    .makeRequest({
                        headers: {
                            Authorization: 'foo',
                            'User-Agent': 'bar',
                        },
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.get('authorization')).toEqual('foo');
                        expect(req.get('user-agent')).toEqual('bar');
                    });
            });

            it('can override default headers if specified with different casing', function() {
                return fakeBase
                    .makeRequest({
                        headers: {
                            authorization: 'foo',
                            'uSER-aGENT': 'bar',
                        },
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.get('authorization')).toEqual('foo');
                        expect(req.get('user-agent')).toEqual('bar');
                    });
            });

            it('allows multiple headers with different casings; one will "win"', function() {
                return fakeBase
                    .makeRequest({
                        headers: {
                            'x-foo': 'bar',
                            'X-Foo': 'baz',
                        },
                    })
                    .then(function() {
                        const value = testExpressApp.get('most recent request').get('x-foo');
                        expect(value === 'bar' || value === 'baz').toBeTruthy();
                    });
            });

            it('allows headers with custom user agent', function() {
                return fakeBase
                    .makeRequest({
                        headers: {
                            Authorization: 'foo',
                            'X-Airtable-User-Agent': 'bazz',
                        },
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.get('authorization')).toEqual('foo');
                        expect(req.get('user-agent')).toEqual('bazz');
                    });
            });

            it('allows custom headers set via Airtable constructor', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(200)
                        .json({})
                        .end();
                });

                var base = new Airtable({
                    apiKey: 'key123',
                    endpointUrl: airtable._endpointUrl,
                    customHeaders: {
                        cookie: 'crisp=true',
                    },
                }).base('app123');

                return base.makeRequest().then(function() {
                    const req = testExpressApp.get('most recent request');
                    expect(req.get('cookie')).toEqual('crisp=true');
                });
            });

            it('allows custom headers set via Airtable constructor to be overridden', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(200)
                        .json({})
                        .end();
                });

                var base = new Airtable({
                    apiKey: 'key123',
                    endpointUrl: airtable._endpointUrl,
                    customHeaders: {
                        cookie: 'crisp=true',
                    },
                }).base('app123');

                return base
                    .makeRequest({
                        headers: {
                            cookie: 'soft=chewy',
                        },
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.get('cookie')).toEqual('soft=chewy');
                    });
            });
        });

        describe('request body', function() {
            it('can include a body', function() {
                return fakeBase
                    .makeRequest({
                        method: 'post',
                        body: {foo: 'bar'},
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.is('json')).toBeTruthy();
                        expect(req.body).toEqual({foo: 'bar'});
                    });
            });

            it('ignores the body for GET requests', function() {
                return fakeBase
                    .makeRequest({
                        method: 'get',
                        body: {foo: 'bar'},
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.body).toEqual({});
                    });
            });

            it('ignores the body for DELETE requests', function() {
                return fakeBase
                    .makeRequest({
                        method: 'delete',
                        body: {foo: 'bar'},
                    })
                    .then(function() {
                        const req = testExpressApp.get('most recent request');
                        expect(req.body).toEqual({});
                    });
            });
        });

        describe('error handling', function() {
            it('handles 401s', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(401).json({});
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'AUTHENTICATION_REQUIRED',
                    message: expect.any(String),
                    statusCode: 401,
                });
            });

            it('handles 403s', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(403)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'NOT_AUTHORIZED',
                    message: expect.any(String),
                    statusCode: 403,
                });
            });

            it('handles 404s without an error message', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(404)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'NOT_FOUND',
                    message: expect.any(String),
                    statusCode: 404,
                });
            });

            it('handles 404s with an error message', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(404).json({
                        error: {
                            message: 'foo bar',
                        },
                    });
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'NOT_FOUND',
                    message: 'foo bar',
                    statusCode: 404,
                });
            });

            it('handles 413s', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(413)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'REQUEST_TOO_LARGE',
                    message: expect.any(String),
                    statusCode: 413,
                });
            });

            it('handles 422s without a type or message', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(422)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'UNPROCESSABLE_ENTITY',
                    message: expect.any(String),
                    statusCode: 422,
                });
            });

            it("handles 422s and respects the server's error type", function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(422).json({
                        error: {
                            type: 'FOO_BAR',
                        },
                    });
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'FOO_BAR',
                    message: expect.any(String),
                    statusCode: 422,
                });
            });

            it("handles 422s and respects the server's error message", function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(422).json({
                        error: {
                            message: 'foo bar',
                        },
                    });
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'UNPROCESSABLE_ENTITY',
                    message: 'foo bar',
                    statusCode: 422,
                });
            });

            it('handles 429s immediately when retries are turned off', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(429)
                        .json({})
                        .end();
                });

                var base = new Airtable({
                    apiKey: 'key123',
                    endpointUrl: airtable._endpointUrl,
                    noRetryIfRateLimited: true,
                }).base('app123');

                return expect(base.makeRequest()).rejects.toEqual({
                    error: 'TOO_MANY_REQUESTS',
                    message: expect.any(String),
                    statusCode: 429,
                });
            });

            it('retries 429s until success', function() {
                let numberOfRequests = 0;
                testExpressApp.set('handler override', (req, res) => {
                    numberOfRequests++;
                    if (numberOfRequests < 2) {
                        res.status(429).end();
                    } else {
                        res.json({foo: 'bar'});
                    }
                });

                return fakeBase.makeRequest().then(function() {
                    expect(numberOfRequests).toEqual(2);
                });
            });

            it('handles 500s', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(500)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'SERVER_ERROR',
                    message: expect.any(String),
                    statusCode: 500,
                });
            });

            it('handles 503s', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(503)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'SERVICE_UNAVAILABLE',
                    message: expect.any(String),
                    statusCode: 503,
                });
            });

            it('handles other 4xx errors without a type or message', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(402)
                        .json({})
                        .end();
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'UNEXPECTED_ERROR',
                    message: expect.any(String),
                    statusCode: 402,
                });
            });

            it("handles other 4xx errors, respecting the server's type", function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(402).json({
                        error: {type: 'FOO_BAR'},
                    });
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'FOO_BAR',
                    message: expect.any(String),
                    statusCode: 402,
                });
            });

            it("handles other 4xx errors, respecting the server's message", function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.status(402).json({
                        error: {message: 'foo bar'},
                    });
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'UNEXPECTED_ERROR',
                    message: 'foo bar',
                    statusCode: 402,
                });
            });

            it('errors with non-JSON response bodies (even if the Content-Type header is correct)', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.set('Content-Type', 'application/json');
                    res.send('{"foo":');
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'UNEXPECTED_ERROR',
                    message: expect.any(String),
                    statusCode: 200,
                });
            });

            it('errors with non-object response bodies', function() {
                testExpressApp.set('handler override', (req, res) => {
                    res.json(['foo', 'bar']);
                });

                return expect(fakeBase.makeRequest()).rejects.toEqual({
                    error: 'UNEXPECTED_ERROR',
                    message: expect.any(String),
                    statusCode: 200,
                });
            });

            it("won't make requests to a server with a self-signed SSL certificate", function() {
                return teardownAsync()
                    .then(function() {
                        return testHelpers.getMockEnvironmentAsync({https: true});
                    })
                    .then(function(env) {
                        fakeBase = env.airtable.base('app123');
                        teardownAsync = env.teardownAsync;
                        testExpressApp = env.testExpressApp;
                    })
                    .then(function() {
                        return expect(fakeBase.makeRequest()).rejects.toEqual({
                            error: 'CONNECTION_ERROR',
                            message: expect.any(String),
                            statusCode: null,
                        });
                    });
            });

            it('will timeout if the server takes a long time to respond', function(done) {
                testExpressApp.set('handler override', function() {
                    // Timeout before returning a response
                });

                return fakeBase.makeRequest().then(
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

        describe('result', function() {
            it('includes the status code in the result', function() {
                return expect(fakeBase.makeRequest()).resolves.toMatchObject({
                    statusCode: 200,
                });
            });

            it('includes the headers the result', function() {
                return expect(fakeBase.makeRequest()).resolves.toMatchObject({
                    headers: {},
                });
            });

            it('includes the body the result', function() {
                return expect(fakeBase.makeRequest()).resolves.toMatchObject({
                    body: {foo: 'bar'},
                });
            });
        });
    });

    describe('#runAction (deprecated)', function() {
        it('makes requests with the right options', function(done) {
            expect(version).toEqual(expect.stringMatching(/^\d+\.\d+\.\d+$/));

            fakeBase.runAction('get', '/my_table/rec456', {}, null, function() {
                const req = testExpressApp.get('most recent request');
                expect(req.method).toEqual('GET');
                expect(req.path).toEqual('/v0/app123/my_table/rec456');
                expect(req.get('authorization')).toEqual('Bearer key123');
                expect(req.get('x-api-version')).toEqual('0.1.0');
                expect(req.get('x-airtable-application-id')).toEqual('app123');
                expect(req.get('user-agent')).toEqual('Airtable.js/' + version);

                done();
            });
        });

        it('exposes the body of the request directly on the response', function(done) {
            testExpressApp.set('handler override', function(req, res) {
                res.json({
                    fizz: 'buzz',
                });
            });

            fakeBase.runAction('get', '/', {}, null, function(err, res, body) {
                expect(err).toBeNull();
                expect(res.body.fizz).toBe('buzz');
                expect(body.fizz).toBe('buzz');
                done();
            });
        });

        it('makes requests GET requests with empty bodies', function(done) {
            expect(version).toEqual(expect.stringMatching(/^\d+\.\d+\.\d+$/));

            fakeBase.runAction('get', '/my_table/rec456', {}, {}, function() {
                const req = testExpressApp.get('most recent request');
                expect(req.method).toEqual('GET');
                expect(req.path).toEqual('/v0/app123/my_table/rec456');

                done();
            });
        });

        it("won't make requests to a server with a self-signed SSL certificate", function(done) {
            teardownAsync()
                .then(function() {
                    return testHelpers.getMockEnvironmentAsync({https: true});
                })
                .then(function(env) {
                    fakeBase = env.airtable.base('app123');
                    teardownAsync = env.teardownAsync;
                    testExpressApp = env.testExpressApp;

                    fakeBase.runAction('get', '/my_table/rec456', {}, null, function(err) {
                        expect(err).toBeTruthy();

                        expect(testExpressApp.get('most recent request')).toBeFalsy();

                        done();
                    });
                })
                .catch(done);
        });
    });

    describe('#getId', function() {
        it('gets the id', function() {
            expect(fakeBase.getId()).toBe(baseId);
        });
    });
});
