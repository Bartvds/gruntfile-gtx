module.exports = function (grunt) {
	'use strict';

	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.loadTasks('./test/tasks');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			all: {
				options: {
					reporter: './node_modules/jshint-path-reporter',
					jshintrc: '.jshintrc'
				},
				src: [
					'Gruntfile.js',
					'lib/**/*.js',
					'test/**/*.js'
				]
			}
		},
		clean: {
			tmp: ['tmp/**/*', 'test/tmp**/*']
		},
		multi_grunt: {
			tmp: ['test/spec/**/Gruntfile.js']
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			},
			pass: {
				src: ['test/init.js', 'test/specs/*.js']
			},
			spec : {
				options: {
					reporter: 'Spec'
				},
				src: ['test/init.js', 'test/specs/**/*.spec.js']
			}
		}
	});

	grunt.registerTask('default', ['test']);
	grunt.registerTask('test', ['jshint', 'mochaTest']);

};