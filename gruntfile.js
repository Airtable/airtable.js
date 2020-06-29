'use strict';

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,
        ts: {
            default: {
                tsconfig: './tsconfig.json',
            },
        },
        browserify: {
            client: {
                src: './lib/airtable.js',
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
                        b.require('./lib/airtable.js', {expose: 'airtable'});
                    },
                },
            },
        },
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-ts');
    grunt.registerTask('default', ['ts']);
};
