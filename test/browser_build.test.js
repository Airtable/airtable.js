'use strict';

var fs = require('fs');
var path = require('path');

var BUILD_PATH = path.join(__dirname, '..', 'build', 'airtable.browser.js');

describe('browser build', function() {
    it("doesn't contain any environment variables", function(done) {
        fs.readFile(BUILD_PATH, 'utf8', function(err, builtJs) {
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
});
