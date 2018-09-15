/*
 * gruntfile-gtx
 * https://github.com/Bartvds/gruntfile-gtx
 *
 * Copyright (c) 2013-2018 Bart van der Schoor
 * Licensed under the MIT license.
 */

'use strict';

const util = require('util');
const path = require('path');
const lib = require('./lib');

// duckpatch decorator
function defaultTaskData(data) {
  data.params = data.params || {};
  data.plugins = data.plugins || [];
  data.groups = data.groups || [];
  return data;
}

// power-boost grunt and return gtx api
function wrapGrunt(grunt) {
  // de-clutter
  const _ = grunt.util._;
  const forEach = _.forEach;
  const hasOwnProp = lib.hasOwnProp;

  // assemble
  const gtx = {
    grunt: grunt,
    debug: false
  };
  grunt.gtx = gtx;

  const prefix = '';
  const taskMap = {};
  const macros = {};
  const selections = {};
  const config = {};
  let isInit = false;
  let useAutoLoad = false;
  let autoLoadOptions = {};
  const createdAliases = [];
  const defaultMacroOptions = {
    concurrent: 1
  };
  const loadNpmPlugins = [];
  let implicitDependPlugins = [];
  const cpuCores = require('os').cpus().length;

  // odd pathing but necessary for issues with cwd (from the tests)
  grunt.loadTasks(path.resolve(__dirname, '..', 'tasks'));

  function addAlias(name, tasks) {
    tasks = lib.splitify(tasks);
    createdAliases.push({name: name, tasks: tasks});
    grunt.registerTask(name, tasks);
  }

  function runConcurrent(tasks, concurrentLimit) {
    //parallel
    const concurrentID = lib.getNameUID(prefix, 'conc');
    if (concurrentLimit > 1 && tasks.length > 1) {
      lib.pushUnique(implicitDependPlugins, 'grunt-concurrent');
      //chain name
      const cfg = {
        tasks: tasks,
        options: {
          logConcurrentOutput: false,
          limit: concurrentLimit
        }
      };
      addAlias(concurrentID, gtx.configFor('concurrent', cfg));
    }
    else {
      addAlias(concurrentID, tasks);
    }
    return concurrentID;
  }

  function addTaskList(name, label, tasks, concurrentLimit) {
    //parallel
    const concurrentID = runConcurrent(tasks, label, concurrentLimit);
    addAlias(name + ':' + label, concurrentID);
  }

  // magically load tasks
  gtx.loadAuto = function (options) {
    useAutoLoad = true;
    autoLoadOptions = grunt.util._.extend({}, options, autoLoadOptions);
  };

  // load from node_modules
  gtx.loadNpm = function () {
    forEach(lib.splitify(arguments), (name) => {
      lib.pushUnique(loadNpmPlugins, name);
      //grunt.loadNpmTasks(name);
    });
  };

  // load from path
  gtx.loadTasks = function () {
    forEach(lib.splitify(arguments), (name) => {
      grunt.loadTasks(name);
    });
  };

  // helper
  gtx.call = function (name, func) {
    if (arguments.length === 1) {
      func = name;
      name = lib.getNameUID(prefix);
    }
    grunt.registerTask(name, func);

    return name;
  };

  // alias for registerTask
  gtx.alias = function (name) {
    const arr = [];

    for (let i = 1; i < arguments.length; i++) {
      lib.splitifyValueInto(arguments[i], arr);
    }

    forEach(arr, (elem, index, arr) => {
      if (typeof elem === 'function') {
        arr[index] = gtx.call(elem);
      }
    });

    addAlias(name, arr.slice(0));

    return name;
  };

  gtx.concurrent = function (name) {
    const arr = lib.splitify(arguments);

    forEach(arr, (elem, index, arr) => {
      if (typeof elem === 'function') {
        arr[index] = gtx.call(elem);
      }
    });

    addAlias(name, runConcurrent(arr.slice(0), cpuCores));

    return name;
  };

  // anon-alias for alias (hurr hurr)
  gtx.series = function () {
    const name = lib.getNameUID();
    const arr = lib.splitify(arguments);

    forEach(arr, (elem, index, arr) => {
      if (typeof elem === 'function') {
        arr[index] = gtx.call(elem);
      }
    });

    // lets add a copy for safety
    addAlias(name, arr.slice(0));

    return name;
  };

  // anon-alias for concurrent
  gtx.parallel = function () {
    const name = lib.getNameUID();
    const arr = lib.splitify(arguments);

    forEach(arr, (elem, index, arr) => {
      if (typeof elem === 'function') {
        arr[index] = gtx.call(elem);
      }
    });

    // lets add a copy for safety
    addAlias(name, runConcurrent(arr.slice(0), cpuCores));

    return name;
  };

  // copy a classic config object into the main tree
  gtx.config = function (cfg) {
    const targets = [];

    forEach(cfg, (pluginData, pluginName) => {
      if (pluginName === 'pkg') {
        config[pluginName] = pluginData;
      }
      else {
        forEach(pluginData, (targetData, targetName) => {
          const name = gtx.configFor(pluginName, targetName, targetData);
          targets.push(name);
        });
      }
    });

    return targets;
  };

  // add data for a target, possibly generate a name
  gtx.configFor = function (pluginName, targetName, data) {
    if (arguments.length <= 2) {
      data = targetName;
      targetName = lib.getNameUID();
    }

    //TODO add proper map object
    if (!hasOwnProp(config, pluginName)) {
      config[pluginName] = {};
    }

    //TODO validate uniqueness?
    config[pluginName][targetName] = data;

    return pluginName + ':' + targetName;
  };

  // directly set options
  gtx.options = function (pluginName, targetName, options) {
    //TODO there must be a better way to do this
    if (arguments.length <= 2) {
      if (!hasOwnProp(config, pluginName)) {
        config[pluginName] = {options: options};
      }
      else {
        config[pluginName].options = options;
      }
    }
    else {
      if (!hasOwnProp(config, pluginName)) {
        config[pluginName] = {};
      }
      if (!hasOwnProp(config[pluginName], targetName)) {
        config[pluginName][targetName] = {};
      }
      config[pluginName][targetName].options = options;
    }
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

  gtx.log = function (message, sender) {
    return gtx.configFor('gtx-log', {message: message, sender: sender});
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
    if (hasOwnProp(macros, type)) {
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

  // create instance from defined macro
  gtx.create = function (id, type, params, groups) {
    if (arguments.length < 2) {
      throw (new Error('expected at least 2 arguments'));
    }

    //TODO add proper map
    if (!hasOwnProp(macros, type)) {
      throw(new Error('missing macros type: ' + type));
    }

    if (groups) {
      groups = lib.splitify(groups);
    }

    // store data
    forEach(lib.splitify(id), (id) => {
      taskMap[id] = defaultTaskData({
        id: id,
        type: type,
        params: params,
        groups: groups
      });
    });
  };

  // create anonymous macro instance, return name
  gtx.anon = function (type, params, groups) {
    if (arguments.length < 1) {
      throw (new Error('expected at least 1 argument'));
    }

    const id = lib.getNameUID(type);
    gtx.create(id, type, params, groups);

    return id;
  };

  // use a selector to create alias for matches
  //TODO (re)implement this
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
      gtx.config(cfg);
    }

    const groups = {};
    const types = {};
    const plugins = {};
    const all = [];

    // import config
    forEach(config, (plugin, pluginName) => {
      if (pluginName === 'pkg') {
        return;
      }

      if (pluginName === 'options') {
        return;
      }

      //TODO is this correct? what about random user data?
      forEach(plugin, (target, targetName) => {
        if (targetName === 'options') {
          return;
        }

        const data = defaultTaskData({
          id: targetName,
          type: pluginName,
          plugins: [pluginName]
        });

        lib.pushHash(plugins, pluginName, data);
        all.push(data);
      });
    });

    // add macro instances
    forEach(taskMap, (data) => {
      all.push(data);

      const tasks = [];
      const alias = 'gtx:' + data.id;
      const macro = macros[data.type];

      // helper closures for easy access
      // TODO find a way to move these to own file/place
      const addTask = function (pluginName, targetName, targetData) {
        if (arguments.length < 2) {
          throw (new Error('expected at least 2 arguments'));
        }

        if (arguments.length === 2) {
          targetData = targetName;
          targetName = lib.getNameUID(prefix, data.id);
        }

        gtx.configFor(pluginName, targetName, targetData);

        lib.pushUnique(data.plugins, pluginName);
        lib.pushHash(plugins, pluginName, data);

        lib.pushUnique(tasks, pluginName + ':' + targetName);
      };
      const runTask = function (plugin, target) {
        if (arguments.length < 1) {
          throw (new Error('expected at least 1 argument'));
        }
        if (arguments.length === 2) {
          lib.pushUnique(tasks, plugin + ':' + target);
        } else {
          lib.pushUnique(tasks, plugin);
        }
      };
      const addGroup = function (group) {
        if (arguments.length < 1) {
          throw (new Error('expected at least 1 argument'));
        }
        forEach(lib.splitify(group), function (groupName) {
          lib.pushHash(groups, groupName, alias);
        });
      };
      const callFunc = function (func) {
        if (arguments.length < 1) {
          throw (new Error('expected at least 1 argument'));
        }
        var targetName = lib.getNameUID(prefix, data.id);
        gtx.call(targetName, func);
        lib.pushUnique(tasks, targetName);
      };
      const doLog = function (value) {
        lib.pushUnique(tasks, gtx.log(value, data.id));
      };

      // custom context
      const context = {
        grunt: grunt,
        config: config,
        // add the helpers
        add: addTask,
        tag: addGroup,
        run: runTask,
        call: callFunc,
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
        forEach(data.groups, (groupName) => {
          lib.pushHash(groups, groupName, alias);
        });
      }
    });

    // add combi aliases
    forEach(groups, (tasks, id) => {
      addAlias('gtx-group:' + id, tasks);
    });

    forEach(types, (tasks, type) => {
      const macro = macros[type];
      //addAlias('gtx-type:' + type, tasks);
      addTaskList('gtx-type', type, tasks, macro.options.concurrent);
    });

    // TODO re-implement selector

    // process auto-load
    if (useAutoLoad) {
      //TODO re-implement autoLoad() properly since we know what plugins were used
      //load everything for now
      require('load-grunt-tasks')(grunt, autoLoadOptions);
      if (grunt.file.exists('./tasks')) {
        grunt.loadTasks('./tasks');
      }
    }

    // add these
    if (loadNpmPlugins.length > 0) {
      //grunt.log.writeln('loading plugins: ' + loadNpmPlugins.join(', '));
      loadNpmPlugins.forEach(function (plugin) {
        grunt.loadNpmTasks(plugin);
      });
    }

    implicitDependPlugins = _.difference(implicitDependPlugins, loadNpmPlugins);
    if (implicitDependPlugins.length > 0) {
      //grunt.log.writeln('implicitly loading plugins: ' + implicitDependPlugins.join(', '));
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
  gtx.initConfig = gtx.config;
  gtx.registerMultiTask = grunt.registerMultiTask;
  gtx.multi = grunt.registerMultiTask;

  //add some lazy utils

  // handy
  /*jshint -W098 */
  gtx.extendObject = function (source, extend) {
    let ret = {};

    forEach(arguments, (arg) => {
      ret = lib.copyTo(ret, arg);
    });

    return ret;
  };
  /*jshint +W098 */

  // merge paths + literals
  /*jshint -W098 */
  gtx.readJSON = function (paths) {
    let ret = {};

    forEach(arguments, (arg) => {
      if (typeof arg === 'string') {
        ret = lib.copyTo(ret, grunt.file.readJSON(arg));
      }
      else {
        ret = lib.copyTo(ret, arg);
      }
    });

    return ret;
  };
  /*jshint +W098 */

  // merge paths + literals
  /*jshint -W098 */
  gtx.readYAML = function (paths) {
    let ret = {};

    forEach(arguments, (arg) => {
      if (typeof arg === 'string') {
        ret = lib.copyTo(ret, grunt.file.readYAML(arg));
      }
      else {
        ret = lib.copyTo(ret, arg);
      }
    });

    return ret;
  };
  /*jshint +W098 */

  // wheee
  return gtx;
}

module.exports = {
  wrap: wrapGrunt
};
