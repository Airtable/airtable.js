'use strict';

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,
        browserify: {
            umd: {
                src: './lib/tmp_airtable.js',
                dest: './lib/airtable.umd.js',
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
                        b.require('./lib/tmp_airtable.js', {expose: 'airtable'});
                    },
                    browserifyOptions: {
                        standalone: 'Airtable',
                    },
                },
            },
            browser: {
                src: './lib/tmp_airtable.js',
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
                        b.require('./lib/tmp_airtable.js', {expose: 'airtable'});
                    },
                },
            },
        },
    });

    grunt.loadNpmTasks('grunt-browserify');
};
