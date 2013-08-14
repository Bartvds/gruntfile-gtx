module.exports = function (grunt) {
	'use strict';

	//var path = require('path');

	var gtx = require('./lib/index').wrap(grunt);
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
			all: {
				options: {
					reporter: './node_modules/jshint-path-reporter',
					jshintrc: '.jshintrc'
				},
				src: [
					'Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'
				]
			}
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter'
			},
			all: { src: ['test/spec/init.js', 'test/spec/**/*.test.js'] }
		},
		run_grunt: {
			options: {
				'no-color': true,
				debugCli: true
			},
			all: {
				src: ['test/spec/*/Gruntfile.js']
			}
		}
	});

	gtx.define('testGruntTask', function (macro, id) {

		var specPath = 'test/spec/' + id + '/';

		macro.newTask('clean', [specPath + 'tmp']);

		macro.newTask('run_grunt', {
			options: {
				log: macro.getParam('log', true),
				help: true,
				parser: 'parseHelp',
				saveLog: macro.getParam('log', true),
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

	gtx.alias('default', ['test']);
	gtx.alias('test', ['jshint', 'run_grunt:all', 'mochaTest:all']);

	gtx.alias('edit_01', 'gtx:basic');
	gtx.alias('edit_02', 'gtx:dummy');

	gtx.finalise();
};