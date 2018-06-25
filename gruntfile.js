'use strict';

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    // Project configuration.
    grunt.initConfig({
        pkg: pkg,
        jshint: {
            // define the files to lint
            files: ['gruntfile.js', 'lib/**/!(class.js)*.js', 'test/*.test.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                strict: true,
                globalstrict: true,
                globals: {
                    console: true,
                    module: true,
                    require: true,
                    process: true,
                    setTimeout: true,
                    jest: true,
                    describe: true,
                    it: true,
                    expect: true,
                    Promise: true,
                    __dirname: true
                }
            }
        },
        browserify: {
            client: {
                src: './lib/airtable.js',
                dest: './build/airtable.browser.js',
                options: {
                    transform: [
                        ['envify', {
                            _: 'purge',
                            npm_package_version: pkg.version,
                        }]
                    ],
                    preBundleCB: function(b) {
                        b.require('./lib/airtable.js', { expose: 'airtable' });
                    }
                }
            }
        },
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Default task(s).
    grunt.registerTask('default', ['jshint']);

    grunt.loadNpmTasks('grunt-browserify');
};
