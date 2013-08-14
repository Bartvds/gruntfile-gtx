module.exports = function (grunt) {
	'use strict';

	var gtx = require('./lib/gtx').wrap(grunt);
	// gtx.debug = true;

	gtx.loadNpm('grunt-mocha-test');
	gtx.loadNpm('grunt-contrib-jshint');
	gtx.loadNpm('grunt-contrib-clean');
	gtx.loadNpm('grunt-run-grunt');

	gtx.loadTasks('./test/test_tasks');

	gtx.addConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			tmp: ['tmp/**/*', 'test/tmp**/*']
		},
		jshint: {
			core: {
				options: {
					reporter: './node_modules/jshint-path-reporter',
					jshintrc: '.jshintrc'
				},
				src: [
					'Gruntfile.js', 'lib/**/*.js'
				]
			}
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			}
		},
		run_grunt: {
			options: {
				'no-color': true,
				debugCli: true
			}
		}
	});

	gtx.define('testGruntTask', function (macro, id) {
		var specPath = 'test/spec/' + id + '/';

		macro.newTask('clean', [specPath + 'tmp']);

		macro.newTask('jshint', {
			src: [
				specPath + '**/*.js'
			]
		});

		macro.newTask('run_grunt', {
			options: {
				log: macro.getParam('log', true),
				logFile: specPath + 'tmp/log.txt',
				help: true,
				// check exported data
				parser: 'parseHelp',
				process: function (result) {
					grunt.file.write(specPath + 'tmp/tasks.json', JSON.stringify(result.parsed, null, 2));
				}
			},
			src: [specPath + 'Gruntfile.js']
		});

		macro.newTask('mochaTest', {
			src: ['test/spec/init.js', specPath + '**/*.test.js']
		});
		macro.tag('test');
	});

	gtx.create('basic', 'testGruntTask', {log: false});
	gtx.create('dummy', 'testGruntTask', {log: true});

	gtx.alias('test', ['gtx-group:test']);

	gtx.alias('edit_01', 'gtx:basic');
	gtx.alias('edit_02', 'gtx:dummy');

	gtx.alias('default', ['test']);

	gtx.finalise();
};