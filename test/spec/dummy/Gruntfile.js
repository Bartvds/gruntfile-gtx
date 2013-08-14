module.exports = function (grunt) {
	'use strict';

	//var path = require('path');
	var path = require('path');

	var gtx = require('../../../lib/gtx.js').wrap(grunt);
	gtx.debug = true;

	gtx.loadTasks('../../../node_modules/grunt-contrib-clean/tasks');
	gtx.loadTasks('../../test_tasks');

	gtx.addConfig({
		clean: {
			tests: ['tmp/**/*']
		},
		dummy_tango: {
			tango_one: {},
			"tango-two": {}
		},
		"dash-victor": {
			victor_one: {},
			"victor-two": {}
		},
		echo: {
			before: {
				options: {
					echo: 'before: ' + path.basename(__filename)
				}
			},
			after: {
				options: {
					echo: 'after: ' + path.basename(__filename)
				}
			},
			echo: {
				options: {
					echo: 'echo'
				}
			}
		}
	});
	gtx.define('soundCheck', function (macro, id) {
		macro.addLog('Test!');

		var str = id + ' says: ';
		macro.newTask('echo', {
			options: {
				echo: str + 'one'
			}
		});
		if (!macro.getParam('echoMuted', false)) {
			macro.newTask('echo', {
				options: {
					echo: str + 'two'
				}
			});
			macro.newTask('echo', {
				options: {
					echo: str + 'two two'
				}
			});
			macro.newTask('echo', {
				options: {
					echo: str + 'one one two two'
				}
			});
		}
		macro.log('Done!');
	});

	gtx.create('Hank,Jimmy', 'soundCheck');
	gtx.create('Albert', 'soundCheck', {echoMuted: true});

	gtx.alias('default', ['echo:before', 'dummies', 'echo:after']);

	gtx.alias('dummies', [
		'dummy_tango:tango_one',
		'dummy_tango:tango-two',
		'echo:echo',
		'dash-victor:victor_one',
		'dash-victor:victor-two'
	]);

	gtx.alias('tangos', ['dummy_tango:tango_one', 'dummy_tango:tango_two']);
	gtx.alias('victors', ['dash-victor:victor_one', 'dash-victor:victor-two']);

	gtx.alias('multi', ['echo:before', 'echo:echo', 'echo:after']);

	gtx.finalise();
};
