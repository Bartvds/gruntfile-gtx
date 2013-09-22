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

// power-boost grunt and return gtx api
function wrapGrunt(grunt) {
	"use strict";

	// de-clutter
	var _ = grunt.util._;
	var forEach = _.forEach;

	var prefix = '';
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
	var defaultMacroOptions = {
		concurrent: 1
	};
	var defaultGroupOptions = {
		concurrent: 1
	};
	var loadNpmPlugins = [];
	var implicitDependPlugins = [];

	// odd pathing but necessary for issues with cwd (from the tests)
	grunt.loadTasks(path.resolve(__dirname, '..', 'tasks'));

	function addAlias(name, list) {
		createdAliases.push({name: name, tasks: list});
		grunt.registerTask(name, list);
	}

	function addTaskList(name, label, tasks, concurrentLimit) {

		//parallel
		if (concurrentLimit > 1) {
			lib.pushUnique(implicitDependPlugins, 'grunt-concurrent');

			//chain name
			var concurrentID = lib.getNameUID(prefix, label);
			var cfg = {
				tasks: tasks,
				options: {
					logConcurrentOutput: false,
					limit: concurrentLimit
				}};
			gtx.addConfigFor('concurrent', concurrentID, cfg);

			addAlias(name + ':' + label, ['concurrent:' + concurrentID]);
			addAlias(name + ':' + label + ':single', tasks);
		}
		else {
			addAlias(name + ':' + label, tasks);
		}
	}

	gtx.loadNpm = function () {
		forEach(lib.splitify(arguments), function (name) {
			lib.pushUnique(loadNpmPlugins, name);
			//grunt.loadNpmTasks(name);
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

		forEach(lib.splitify(name), function (name) {
			// lets add a copy for safety
			addAlias(name, arr.slice(0));
		});
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

	// add data for a target, possibly generate a name
	gtx.addConfigFor = function (pluginName, targetName, data) {
		if (arguments.length < 3) {
			data = targetName;
			targetName = lib.getNameUID();
		}
		//TODO add proper map object
		if (!config.hasOwnProperty(pluginName)) {
			config[pluginName] = {};
		}
		//TODO validate uniqueness?
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

	gtx.logTask = function (message, sender) {
		return gtx.addConfigFor('gtx-log', {message: message, sender: sender});
	};

	// define a macro
	gtx.define = function (type, func, options) {
		if (arguments.length < 1) {
			throw (new Error('expected at least 1 argument'));
		}
		if (arguments.length === 1) {
			func = type;
			type = lib.getNameUID('gtx-macro');
		}
		options = _.defaults(options || {}, defaultMacroOptions);
		if (macros.hasOwnProperty(type)) {
			throw(new Error('cannot override macros type:' + type));
		}
		macros[type] = {
			func: func,
			options: options
		};

		// return factory (easy and/or needed for anonymous macros
		return function (id, params, groups) {
			return gtx.create(id, type, params, groups);
		};
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
			throw (new Error('multiple calls to finalise() detected'));
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
			//TODO is this correct? what about random user data?
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

		// add macro instances
		forEach(taskMap, function (data) {

			all.push(data);

			var tasks = [];
			var alias = 'gtx:' + data.id;
			var macro = macros[data.type];

			// helper closures for easy access
			// TODO find a way to move these to own file/place
			var newTask = function (pluginName, targetName, targetData) {
				if (arguments.length < 2) {
					throw (new Error('expected at least 2 arguments'));
				}
				if (arguments.length === 2) {
					targetData = targetName;
					targetName = lib.getNameUID(prefix, data.id);
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
				lib.pushUnique(tasks, gtx.logTask(value, data.id));
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

			//console.log('execute macro ' + data.id + ':' + data.type);

			// execute
			macro.func.apply(null, [context, data.id]);

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

		forEach(types, function (tasks, type) {
			var macro = macros[type];
			//addAlias('gtx-type:' + type, tasks);
			addTaskList('gtx-type', type, tasks, macro.options.concurrent);
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

		//add these
		if (loadNpmPlugins.length > 0) {
			grunt.log.writeln('loading plugins: ' + loadNpmPlugins.join(', '));
			loadNpmPlugins.forEach(function (plugin) {
				grunt.loadNpmTasks(plugin);
			});
		}
		implicitDependPlugins = _.difference(implicitDependPlugins, loadNpmPlugins);
		if (implicitDependPlugins.length > 0) {
			grunt.log.writeln('implicitly loading plugins: ' + implicitDependPlugins.join(', '));
			implicitDependPlugins.forEach(function (plugin) {
				grunt.loadNpmTasks(plugin);
			});
		}

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

	// shadowmonkeyduckwraps
	gtx.registerTask = gtx.alias;
	gtx.loadNpmTasks = gtx.loadNpm;
	gtx.initConfig = gtx.addConfig;

	// wheee
	return gtx;
}
module.exports = {
	wrap: wrapGrunt
};