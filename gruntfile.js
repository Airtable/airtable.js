'use strict';

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,
        browserify: {
            client: {
                src: './build/dist/lib/airtable.js',
                dest: './build/airtable.browser.js',
                options: {
                    transform: [
                        [
                            'envify',
                            {
                                _: 'purge',
                                npm_package_version: pkg.version,
                            },
                        ],
                    ],
                    preBundleCB: function(b) {
                        b.require('./build/dist/lib/airtable.js', {expose: 'airtable'});
                    },
                },
            },
        },
    });

    grunt.loadNpmTasks('grunt-browserify');
};
