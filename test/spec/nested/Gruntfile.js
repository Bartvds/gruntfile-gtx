/*jshint -W098*/

module.exports = function (grunt) {
	'use strict';
	//var path = require('path');

	var gtx = require('../../../lib/gtx.js').wrap(grunt);
	//gtx.debug = true;

	gtx.define('greeting', function (macro, id, data) {
		var msg = macro.getParam('message');
		macro.add('echo', id, {
			options: {
				echo: msg
			}
		});

		// create another instance of this macro, but don't add it to the macro
		// itself.  create more "loud" groups for each.
		if (!/-loud$/.test(id)) {
			gtx.create(id + '-loud', 'greeting', {message: msg + '!!!'},
				data.groups.map(function (group) {
					return group + '-loud';
				}));
		}

	});

	gtx.create('hey-bro', 'greeting', {message: 'hey bro'}, ['male', 'informal']);
	gtx.create('helllooooo-ladies', 'greeting', {message: 'helllooooo ladies'},
		['female', 'informal']);

	gtx.finalise();
};
