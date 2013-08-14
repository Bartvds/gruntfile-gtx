// Gruntfile task enhancer
//
// Bart van der Schoor
//

var util = require('util');
var path = require('path');
var lib = require('./lib');

/*jshint -W098 */

// duckpatch decorator
function defaultTaskData(data) {
	data.params = data.params || {};
	data.plugins = data.plugins || [];
	data.groups = data.groups || [];
	return data;
}

// wrap grunt and return gtx api
// brutal
function wrapGrunt(grunt) {
	"use strict";

	// de-clutter
	var _ = grunt.util._;
	var forEach = _.forEach;

	var prefix = 'gtx';
	var gtx = {
		grunt: grunt,
		debug: false
	};
	// grunt.gtx = gtx;

	var taskMap = {};
	var macros = {};
	var selections = {};
	var config = {};
	var isInit = false;
	var createdAliases = [];

	// odd but necessary for issues with cwd (in tests)
	grunt.loadTasks(path.resolve(__dirname, '..', 'tasks'));

	function addAlias(name, list) {
		createdAliases.push({name: name, tasks: list});
		grunt.registerTask(name, list);
	}

	gtx.loadNpm = function () {
		forEach(lib.splitify(arguments), function (name) {
			grunt.loadNpmTasks(name);
		});
	};
	gtx.loadTasks = function () {
		forEach(lib.splitify(arguments), function (name) {
			grunt.loadTasks(name);
		});
	};
	// registerTask alias
	gtx.alias = function (name) {
		var arr = [];
		for (var i = 1; i < arguments.length; i++) {
			lib.splitifyValueInto(arguments[i], arr);
		}
		addAlias(name, arr);
	};

	// copy a classic config object into the main tree
	gtx.addConfig = function (cfg) {
		var targets = [];
		forEach(cfg, function (pluginData, pluginName) {
			if (pluginName === 'pkg') {
				config[pluginName] = pluginData;
			}
			else {
				forEach(pluginData, function (targetData, targetName) {
					var name = gtx.addConfigFor(pluginName, targetName, targetData);
					targets.push(name);
				});
			}
		});
		return targets;
	};

	gtx.addConfigFor = function (pluginName, targetName, data) {
		console.log('-> addConfigFor ' + pluginName + ':' + targetName);

		if (arguments.length < 3) {
			data = targetName;
			targetName = lib.getNameUID();
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
		if (arguments.length < 2) {
			throw (new Error('expected at least 2 arguments'));
		}
		//TODO add proper map
		if (!macros.hasOwnProperty(type)) {
			throw(new Error('missing macros type: ' + type));
		}
		// store data
		groups = lib.splitify(groups);

		forEach(lib.splitify(id), function (id) {
			taskMap[id] = defaultTaskData({
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
		isInit = true;

		if (cfg) {
			gtx.addConfig(cfg);
		}

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
				var data = defaultTaskData({
					id: targetName,
					type: pluginName,
					plugins: [pluginName]
				});
				lib.pushHash(plugins, pluginName, data);
				all.push(data);
			});
		});

		// add custom
		forEach(taskMap, function (data) {

			all.push(data);

			var tasks = [];
			var alias = 'gtx:' + data.id;

			// helper closures for easy access
			// TODO find a way to move these to own file/place
			var newTask = function (pluginName, targetName, targetData) {
				if (arguments.length < 2) {
					throw (new Error('expected at least 2 arguments'));
				}
				if (arguments.length === 2) {
					targetData = targetName;
					targetName = lib.getNameUID(prefix);
				}

				gtx.addConfigFor(pluginName, targetName, targetData);

				lib.pushUnique(data.plugins, pluginName);
				lib.pushHash(plugins, pluginName, data);

				lib.pushUnique(tasks, pluginName + ':' + targetName);
			};
			var runTask = function (plugin, target) {
				if (arguments.length < 1) {
					throw (new Error('expected at least 2 arguments'));
				}
				if (arguments.length === 2) {
					lib.pushUnique(tasks, plugin + ':' + target);
				} else {
					lib.pushUnique(tasks, plugin);
				}
			};
			var addGroup = function (group) {
				if (arguments.length < 1) {
					throw (new Error('expected at least 2 arguments'));
				}
				forEach(lib.splitify(group), function (groupName) {
					lib.pushHash(groups, groupName, alias);
				});
			};

			var doLog = function (value) {
				grunt.log.writeln(value);
			};

			// custom context
			var context = {
				grunt: grunt,
				config: config,
				// add the helpers
				newTask: newTask,
				tag: addGroup,
				runTask: runTask,
				getUID: lib.getNameUID,
				getParam: lib.getParamAccessor(data.id, data.params),
				log: doLog
			};

			console.log('execute macro ' + data.id + ':' + data.type);

			// execute
			macros[data.type].apply(null, [context, data.id]);

			// add it!
			addAlias(alias, tasks);

			// keep type
			lib.pushHash(types, data.type, alias);

			// add to groups
			if (data.groups) {
				forEach(data.groups, function (groupName) {
					lib.pushHash(groups, groupName, alias);
				});
			}
		});

		// add combi aliases
		forEach(groups, function (tasks, id) {
			addAlias('gtx-group:' + id, tasks);
		});

		forEach(types, function (tasks, id) {
			addAlias('gtx-type:' + id, tasks);
		});

		// selector
		/*forEach(selections, function (selector, id) {

			var tasks = all.slice(0);

			// subroutine
			var check = function (tasks, field, call) {
				if (field && tasks.length > 0) {
					forEach(string.splitify(field), function (field) {
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

			addAlias('gtx-select:' + id, tasks);
		});*/

		// booya
		if (gtx.debug) {
			grunt.log.writeln(util.inspect(taskMap, false, 2));
			grunt.log.writeln();
			gtx.dumpConfig();
			grunt.log.writeln();
			grunt.log.writeln(util.inspect(createdAliases));
		}

		// add it all
		grunt.initConfig(config);
	};

	// shadowmonkeywrap
	gtx.registerTask = gtx.alias;
	gtx.loadNpmTasks = gtx.loadNpm;
	gtx.initConfig = gtx.addConfig;

	// wheee
	return gtx;
}
module.exports = {
	wrap: wrapGrunt
};