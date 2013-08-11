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
		grunt_cli_run: {
			grunt_spec: {
				options: {
					debugCli: true,
					verbose: true,
					process: function (result) {
						console.dir(result);
						if (result.code || result.error) {
							return false;
						}
						//return 'bleh';
					}
				},
				src: ['test/spec/**/Gruntfile.js']
			},
			self_help: {
				options: {
					help: true
				},
				src: ['Gruntfile.js']
			},
			self_info: {
				options: {
					verbose: true,
					version: true
				},
				src: ['Gruntfile.js']
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
	grunt.registerTask('test', ['jshint', 'grunt_cli_run', 'mochaTest']);

};