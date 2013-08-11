module.exports = function (grunt) {
	'use strict';

	//var path = require('path');
	var assert = require('assert');

	var gtx = require('../../../lib/index.js').wrap(grunt);

	//gtx.loadTasks('../../../node_modules/grunt-contrib-clean');
	gtx.loadTasks('../../tasks');

	assert.strictEqual(__dirname, process.cwd(), 'process.cwd');

	gtx.addConfig({
		/*clean: {
			tmp: './tmp/*'
		},*/
		test_task: {
			main: {
				_target: 'test/tmp/main',
				_data: 'hello! basic',
				options: {

				}
			}
		}
	});

	gtx.alias('test', ['test_task']);
	//gtx.alias('test', ['clean', 'test_task']);
	gtx.alias('default', ['test']);

	gtx.finalise();
};