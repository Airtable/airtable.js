'use strict';

var fs = require('fs');
var path = require('path');

var BUILD_PATHS = [
    path.join(__dirname, '..', 'build', 'airtable.browser.js'),
    path.join(__dirname, '..', 'lib', 'airtable.umd.js'),
];

describe('browser builds', function() {
    for (const buildPath of BUILD_PATHS) {
        it("doesn't contain any environment variables", function(done) {
            fs.readFile(buildPath, 'utf8', function(err, builtJs) {
                if (err) {
                    done(err);
                    return;
                }

                var exceptions = [/process\.env\.NODE_DEBUG/, /process\.env = {}/];

                var builtWithoutExceptions = exceptions.reduce(function(result, exception) {
                    return result.replace(exception, '');
                }, builtJs);

                expect(builtWithoutExceptions).not.toContain('process.env');

                done();
            });
        });
    }
});
