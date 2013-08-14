module.exports = function (grunt) {
	'use strict';

	//var path = require('path');

	var gtx = require('../../../lib/gtx.js').wrap(grunt);

	gtx.loadTasks('../../../node_modules/grunt-contrib-clean/tasks');
	gtx.loadTasks('../../test_tasks');

	gtx.addConfig({
		clean: {
			tmp: './tmp/*'
		},
		echo: {
			hello: {
				options: {
					echo: 'hello!'
				}
			}
		}
	});

	gtx.alias('default', ['echo']);

	gtx.finalise();
};