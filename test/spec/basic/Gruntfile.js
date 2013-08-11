module.exports = function (grunt) {
	'use strict';

	var gtx = require('../../../lib/index.js').wrap(grunt);
	gtx.loadTasks('../../tasks');

	gtx.addConfig({
		test_task: {
			all: {
				_target: 'tmp/test_write.all',
				_data: 'test_write',
				options: {

				}
			}
		}
	});

	gtx.alias('default', ['test']);

	gtx.finalise();
};