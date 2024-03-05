var Airtable = require('../lib/airtable');
var testHelpers = require('./test_helpers');

describe('Custom Fetch', function() {
    var airtable;
    var teardownAsync;
    var testExpressApp;

    beforeEach(function() {
        return testHelpers.getMockEnvironmentAsync().then(function(env) {
            airtable = env.airtable;
            teardownAsync = env.teardownAsync;
            testExpressApp = env.testExpressApp;
        });
    });

    afterEach(function() {
        return teardownAsync();
    });

    it('allows custom fetch set via Airtable constructor', function() {
        testExpressApp.set('handler override', (req, res) => {
            res.status(200)
                .json({})
                .end();
        });

        var base = new Airtable({
            apiKey: 'key123',
            endpointUrl: airtable._endpointUrl,
            /* global globalThis */
            fetch: globalThis.fetch,
        }).base('app123');

        return base.makeRequest().then(function() {
            expect(testExpressApp.get('most recent request').method).toEqual('GET');
        });
    });
});
