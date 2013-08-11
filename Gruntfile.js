module.exports = function (grunt) {
	'use strict';

	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.loadTasks('./test/tasks');
	grunt.loadTasks('./test/tasks');

	var path = require('path');

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
			help: {
				options: {
					args: {
						'h': null
					}
				},
				files: [
					{
						expand: true,
						cwd: 'test/spec',
						dest: 'test/spec/',
						src: ['./**/Gruntfile.js'],
						rename: function (dest, src) {
							dest = path.resolve(path.join(dest, path.dirname(src), 'tmp', 'grunt-log.txt'));
							console.log(dest);
							return dest;
						}
					}
				]
			},
			all: {
				options: {
					params: {
						args: {

						}
					}
				},
				files: [
					{
						expand: true,
						cwd: 'test/spec',
						dest: 'test/spec/',
						src: ['./**/Gruntfile.js'],
						rename: function (dest, src) {
							dest = path.resolve(path.join(dest, path.dirname(src), 'tmp', 'grunt-log.txt'));
							console.log(dest);
							return dest;
						}
					}
				]
			}
		},
		gtx_log: {
			'pre_grunt': {
				log: 'go!'
			},
			'pre_test': {
			}
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			},
			all: {
				src: ['test/init.js', 'test/spec/**/*.spec.js']
			}
		}
	});

	grunt.registerTask('default', ['test']);
	grunt.registerTask('test', ['jshint', 'multi_grunt', 'mochaTest']);

};