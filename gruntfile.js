module.exports = function(grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            // define the files to lint
            files: ['gruntfile.js', 'lib/**/!(class.js)*.js'],
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
                    setTimeout: true
                }
            }
        },
        browserify: {
            client: {
                src: './lib/airtable.js',
                dest: './build/airtable.browser.js',
                options: {
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
