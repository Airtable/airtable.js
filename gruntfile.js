'use strict';

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: pkg,
        browserify: {
            umd: {
                // During our build script, we copy lib/airtable.js to lib/tmp_airtable.js and use the tmp file here.
                // This is necessary because in our package.json we replace lib/airtable.js with lib/airtable.umd.js
                // for browser builds. We have this setting because we want to make sure that when _other_ apps
                // include airtable.js as a dependency and are bundled for a browser target, they bundle the UMD build
                // rather than the node build. However, since we replace lib/airtable.js with lib/airtable.umd.js in
                // browser builds, browserify is unable to use lib/airtable.js as the src in our own browser builds.
                // Therefore, we copy it to a tmp file and use that as the src.
                // GitHub issue https://github.com/browserify/browserify/issues/1746
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
