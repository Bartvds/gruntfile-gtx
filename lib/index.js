// Gruntfile task enhacer
//
// Bart van der Schoor
//
// it is crude and brutal but after some real-world use I will refactor and extract it to a module.

var util = require('util');

/*jshint -W098 */

// return a parameter accessor
function getParamAccessor(id, params) {
	// easy access
	var paramGet = function (prop, alt, required) {
		if (arguments.length < 1) {
			throw (new Error('expected at least 1 argument'));
		}
		if (arguments.length < 2) {
			required = true;
		}
		if (params && params.hasOwnProperty(prop)) {
			return params[prop];
		}
		if (required) {
			if (!params) {
				throw (new Error('no params supplied for: ' + id));
			}
			throw (new Error('missing groan param property: ' + prop + ' in: ' + id));
		}
		return alt;
	};
	paramGet.raw = params;
	return paramGet;
}

// util
function pushHash(hash, name, value) {
	if (!hash.hasOwnProperty(name)) {
		hash[name] = [value];
	}
	else {
		hash[name].push(value);
	}
}
function pushUnique(arr, value) {
	if (arr.indexOf(value) < 0) {
		arr.push(value);
	}
}

// split strings to array
var csvSplit = /[ \t]*[,;][ \t]*/g;
var seperator = /[ \t]*[:][ \t]*/g;
function splitifyValueInto(value, ret) {
	ret = ret || [];
	var i;
	if (typeof value === 'string') {
		value = value.split(csvSplit);
		for (i = 0; i < value.length; i++) {
			ret.push(value[i].replace(seperator, ':'));
		}
	}
	else {
		for (i = 0; i < value.length; i++) {
			splitifyValueInto(value[i], ret);
		}
	}
	return ret;
}
function splitify() {
	var ret = [];
	for (var i = 0; i < arguments.length; i++) {
		splitifyValueInto(arguments[i], ret);
	}
	return ret;
}

function ran(len) {
	return Math.floor(Math.random() * Math.pow(10, len));
}
function padNumStr(str, len) {
	str = '' + str;
	while (str.length < len) {
		str = '0' + str;
	}
	return str;
}
// get random ids
var uidCounterA = 0;
function getUID() {
	return padNumStr(++uidCounterA, 3);
}
function getNameUID(label) {
	label = label ? label + '' : '';
	return '' + label + '#' + getUID() + '';
}
// factory
function getTaskData(data) {
	data.plugins = data.plugins || [];
	data.groups = data.groups || [];
	return data;
}

// wrap grunt and return gtx api
function wrapGrunt(grunt) {
	"use strict";

	// de-clutter
	var _ = grunt.util._;
	var forEach = _.forEach;

	var prefix = 'gtx';
	var gtx = {
		grunt: grunt
	};
	// grunt.gtx = gtx;

	var map = {};
	var macros = {};
	var selections = {};
	var config = {};
	var ignore = {};
	var isInit = false;

	grunt.registerMultiTask(prefix + '-log', 'log values to console', function () {
		var pre = '-> "' + this.target + '"';
		var prep = pre + ': ';

		var options = this.options({});

		var value = this.data.log || options.log;
		if (value) {
			if (_.isFunction(value)) {
				value = value(grunt, options, this.data);
			}

			if (_.isString(value) || _.isDate(value) || _.isRegExp(value)) {
				grunt.log.writeln(prep + value);
			}
			else {
				grunt.log.writeln(prep + util.inspect(value, null, 10));
			}
		}
		else {
			grunt.log.writeln(pre);
		}
	});

	gtx.loadNpm = function () {
		forEach(splitify(arguments), function (name) {
			console.log('loadNpm:' + name);
			grunt.loadNpmTasks(name);
		});
	};
	gtx.loadTasks = function () {
		forEach(splitify(arguments), function (name) {
			grunt.loadTasks(name);
		});
	};
	// registerTask alias
	gtx.alias = function (name) {
		var arr = [];
		for (var i = 1; i < arguments.length; i++) {
			splitifyValueInto(arguments[i], arr);
		}
		grunt.registerTask(name, arr);
	};

	// copy a classic config object into the main tree
	gtx.addConfig = function (cfg) {
		var tagets = [];
		forEach(cfg, function (pluginData, pluginName) {
			if (pluginName === 'pkg') {
				config[pluginName] = pluginData;
			}
			else {
				forEach(pluginData, function (targetData, targetName) {
					console.log(pluginName + ':' + targetName);
					tagets.push(gtx.addConfigFor(pluginName, targetName, targetData));
				});
			}
		});
		return tagets;
	};
	gtx.addConfigFor = function (pluginName, targetName, data) {
		if (arguments.length < 3) {
			data = targetName;
			targetName = getNameUID();
		}
		if (!config.hasOwnProperty(pluginName)) {
			config[pluginName] = {};
		}
		config[pluginName][targetName] = data;
		return pluginName + ':' + targetName;
	};
	// for debugging
	gtx.dumpConfig = function (depth) {
		grunt.log.writeln('-> dumpConfig');
		grunt.log.writeln(util.inspect(config, false, depth || 10));
		return config;
	};
	// for hackability
	gtx.getConfig = function () {
		return config;
	};

	gtx.logTask = function (value) {
		gtx.addConfigFor('gtx-log', {log: value});
	};
	// define a macro
	gtx.define = function (type, func) {
		if (arguments.length < 2) {
			throw (new Error('expected at least 2 arguments'));
		}
		if (macros.hasOwnProperty(type)) {
			throw(new Error('cannot override macros type:' + type));
		}
		macros[type] = func;
	};

	// use a macro
	gtx.create = function (id, type, params, groups) {
		if (arguments.length < 4) {
			throw (new Error('expected at least 4 arguments'));
		}
		if (!macros.hasOwnProperty(type)) {
			throw(new Error('missing macros type: ' + type));
		}
		// store data
		groups = splitify(groups);
		forEach(splitify(id), function (id) {
			map[id] = getTaskData({
				id: id,
				type: type,
				params: params,
				groups: groups
			});
		});
	};
	// use a selector to create alias fro matches
	gtx.select = function (id, selector) {
		selections[id] = selector;
	};

	// closurefest 3000
	gtx.finalise = function (cfg) {
		if (isInit) {
			throw (new Error('multiple call to finalise() detected'));
		}
		if (cfg) {
			gtx.addConfig(cfg);
		}
		isInit = true;

		var groups = {};
		var types = {};
		var plugins = {};
		var all = [];

		// import config
		forEach(config, function (plugin, pluginName) {
			if (pluginName === 'pkg') {
				return;
			}
			if (pluginName === 'options') {
				return;
			}
			forEach(plugin, function (target, targetName) {
				if (targetName === 'options') {
					return;
				}
				var data = getTaskData({
					id: targetName,
					type: pluginName,
					plugins: [pluginName]
				});
				pushHash(plugins, pluginName, data);
				all.push(data);
			});
		});

		// add custom
		forEach(map, function (data) {

			all.push(data);

			var tasks = [];
			var alias = prefix + ':' + data.id;

			// helper closures for easy access
			// TODO find a way to move these out (context!?)
			var newTask = function (pluginName, targetName, targetData) {
				if (arguments.length < 2) {
					throw (new Error('expected at least 2 arguments'));
				}
				if (arguments.length === 2) {
					targetData = targetName;
					targetName = getNameUID(prefix);
				}

				gtx.addConfigFor(pluginName, targetName, targetData);

				pushUnique(data.plugins, pluginName);
				pushHash(plugins, pluginName, data);

				tasks.push(pluginName + ':' + targetName);
			};
			var runTask = function (plugin, target) {
				if (arguments.length < 1) {
					throw (new Error('expected at least 2 arguments'));
				}
				if (arguments.length === 2) {
					tasks.push(plugin + ':' + target);
				} else {
					tasks.push(plugin);
				}
			};
			var addGroup = function (group) {
				if (arguments.length < 1) {
					throw (new Error('expected at least 2 arguments'));
				}
				forEach(splitify(group), function (groupName) {
					pushHash(groups, groupName, alias);
				});
			};

			// custom context
			var context = {
				grunt: grunt,
				config: config,
				// add the helpers
				newTask: newTask,
				tag: addGroup,
				runTask: runTask,
				getUID: getNameUID,
				getParam: getParamAccessor(data.id, data.params)
			};

			// execute
			macros[data.type].apply(null, [context, data.id]);

			// add it!
			grunt.registerTask(alias, tasks);

			// keep type
			pushHash(types, data.type, alias);

			// add to groups
			if (data.groups) {
				forEach(data.groups, function (groupName) {
					pushHash(groups, groupName, alias);
				});
			}
		});

		// add combi aliases
		forEach(groups, function (tasks, id) {
			grunt.registerTask(prefix + '-group:' + id, tasks);
		});

		forEach(types, function (tasks, id) {
			grunt.registerTask(prefix + '-type:' + id, tasks);
		});

		// selector
		/*forEach(selections, function (selector, id) {

			var tasks = all.slice(0);

			// subroutine
			var check = function (tasks, field, call) {
				if (field && tasks.length > 0) {
					forEach(splitify(field), function (field) {
						if (tasks.length > 0) {
							tasks = grunt.util._.filter(tasks, function (task) {
								return call(task, field);
							});
						}
					});
				}
				return tasks;
			};

			// apply filters
			tasks = check(tasks, selector.type, function (task, field) {
				return task.type === field;
			});
			tasks = check(tasks, selector.plugins, function (task, field) {
				return task.plugins.indexOf(field) > -1;
			});
			tasks = check(tasks, selector.groups, function (task, field) {
				return task.groups.indexOf(field) > -1;
			});

			// convert to task names
			tasks = grunt.util._.map(tasks, function (task) {
				return task.type + ':' + task.id;
			});

			grunt.registerTask(prefix + '-select:' + id, tasks);
		});*/

		// booya
		//gtx.dumpConfig();

		// add it all
		grunt.initConfig(config);
	};

	// shadowmonkeywrap
	gtx.registerTask = gtx.alias;
	gtx.loadNpmTasks = gtx.loadNpm;

	// wheee
	return gtx;
}
module.exports = {
	wrap: wrapGrunt
};