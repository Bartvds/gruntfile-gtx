module.exports = function (grunt) {
	'use strict';

	var gtx = require('./lib/gtx').wrap(grunt);
	// gtx.debug = true;

	gtx.loadNpm('grunt-mocha-test');
	gtx.loadNpm('grunt-contrib-jshint');
	gtx.loadNpm('grunt-contrib-clean');
	gtx.loadNpm('grunt-run-grunt');
	gtx.loadNpm('grunt-bump');

	gtx.loadTasks('./test/test_tasks');

	gtx.addConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			tmp: ['tmp/**/*', 'test/tmp**/*'] //, 'test/spec/*/tmp/**/*'
		},
		jshint: {
			core: {
				options: {
					reporter: './node_modules/jshint-path-reporter',
					jshintrc: '.jshintrc'
				},
				src: [
					'Gruntfile.js', 'lib/**/*.js', 'tasks/**/*.js'
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
				debugCli: false
			}
		},
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: ['pkg'],
				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['-a'], // '-a' for all files
				createTag: true,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: true,
				pushTo: 'origin',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
			}
		}
	});

	gtx.alias('prep', ['jshint:core']);

	// assemble a macro
	gtx.define('testGruntTask', function (macro, id) {
		var specPath = 'test/spec/' + id + '/';

		macro.log(specPath);

		//TODO need needs a macro.once()
		macro.runTask('prep');

		macro.newTask('clean', [specPath + 'tmp']);

		macro.newTask('jshint', {
			src: [
				specPath + '**/*.js'
			]
		});
		macro.newTask('run_grunt', {
			options: {
				log: macro.getParam('log', false),
				logFile: specPath + 'tmp/log.txt',
				// check exported data
				parser: 'parseHelp',
				help: true,
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
	gtx.create('dummy', 'testGruntTask', {log: false});

	gtx.alias('test', ['gtx-group:test']);

	gtx.alias('edit_01', 'gtx:basic');
	gtx.alias('edit_02', 'gtx:dummy');

	gtx.alias('default', ['test']);

	//gtx.debug = true;
	gtx.finalise();
};