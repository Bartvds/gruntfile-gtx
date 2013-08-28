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
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: ['pkg'],
				commit: true,
				commitMessage: 'release %VERSION%',
				commitFiles: ['-a'], // '-a' for all files
				createTag: true,
				tagName: '%VERSION%',
				tagMessage: 'version %VERSION%',
				push: true,
				pushTo: 'origin',
				// cargo cult magic.. wtf?
				// options to use with '$ git describe'
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
			}
		},
		clean: {
			tmp: ['tmp/**/*', 'test/tmp**/*']
		},
		jshint: {
			options: {
				reporter: './node_modules/jshint-path-reporter',
				jshintrc: '.jshintrc'
			},
			core: {
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
		}
	});
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

	// build main aliases

	gtx.alias('prep', ['jshint:core']);
	gtx.alias('default', ['test']);

	// use the macro
	gtx.create('basic', 'testGruntTask', {log: false});
	gtx.create('dummy', 'testGruntTask');

	gtx.alias('test', ['gtx-group:test']);

	gtx.alias('edit_01', 'gtx:basic');
	gtx.alias('edit_02', 'gtx:dummy');


	//gtx.debug = true;
	gtx.finalise();
};