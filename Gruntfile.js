module.exports = function (grunt) {
	'use strict';

	var gtx = require('./lib/gtx').wrap(grunt);
	// gtx.debug = true;

	gtx.loadAuto();
	gtx.loadTasks('./test/test_tasks');

	gtx.config({
		pkg: gtx.readJSON('package.json', {extra: 'foo'}),
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
	gtx.define('testCase', function (macro, id) {
		var specPath = 'test/spec/' + id + '/';

		macro.log(specPath);

		//TODO needs a macro.once()
		macro.run('prep');

		macro.add('clean', [specPath + 'tmp']);

		macro.add('jshint', {
			src: [
				specPath + '**/*.js'
			]
		});
		macro.add('run_grunt', {
			options: {
				log: macro.getParam('log', false),
				logFile: specPath + 'tmp/log.txt',
				// check exported data
				parser: 'parseHelp',
				help: true,
				stack: true,
				process: function (result) {
					grunt.file.write(specPath + 'tmp/tasks.json', JSON.stringify(result.parsed, null, 2));
				}
			},
			src: [specPath + 'Gruntfile.js']
		});
		macro.add('mochaTest', {
			src: ['test/spec/init.js', specPath + '**/*.test.js']
		});
		macro.tag('test');
	}, {
		concurrent: 2
	});

	// build main aliases

	gtx.alias('prep', ['jshint:core']);
	gtx.alias('default', ['test']);

	// use the macro
	gtx.create('basic,concurrent', 'testCase', {log: true});
	gtx.create('dummy', 'testCase', {log: true});
	gtx.create('anon', 'testCase', {log: true});

	gtx.alias('test', ['gtx-group:test']);
	gtx.alias('dev', ['gtx-type:testCase']);

	gtx.alias('edit_01', 'gtx:basic');
	gtx.alias('edit_02', 'gtx:dummy');

	//gtx.debug = true;
	gtx.finalise();
};
