'use strict';

function pluralise(count, str) {
	return count + ' ' + str + (count === 1 ? '' : 's');
}

function runGruntfile(grunt, src, tasks, options, callback) {
	var start = Date.now();

	var path = require('path');
	//var os = require('os');
	//var assert = require('assert');
	var _ = grunt.util._;

	var mixiedStdIO = [];
	var taskList = [];

	var cwd = (_.isUndefined(options.cwd) || _.isNull(options.cwd) ? path.dirname(src) : options.cwd);

	var useArgs = options.args;
	if (options.help) {
		//override
		useArgs = {
			help: true
		};
	}

	// apply defaults
	var argHash = _.defaults({
		'gruntfile': path.resolve(src)
	}, useArgs);

	if (tasks) {
		if (!_.isArray(tasks)) {
			_.forEach(tasks, function (target) {
				taskList.push(target);
			});
		}
		else {
			taskList.push(tasks);
		}
	}
	else {
		tasks = ['default'];
	}

	// serialise named args
	var argArr = [];
	_.each(argHash, function (value, opt) {
		if (opt.length === 0) {
			argArr.push(value);
		}
		else {
			argArr.push((opt.length === 1 ? '-' : '--') + opt);
			if (value !== true && !(_.isNull(value) && _.isUndefined(value))) {
				argArr.push(value);
			}
		}
	});
	// append task names
	if (taskList) {
		_.each(taskList, function (task) {
			argArr.push(task);
		});
	}

	// for debugging
	var cliBatch = [
		'cd ' + path.resolve(cwd),
		'grunt ' + argArr.join(' '),
		'cd ' + process.cwd()
	];
	// print repeatable
	if (options.debugCli) {
		grunt.log.writeln(cliBatch.join('\n'));
		grunt.log.writeln('');
	}
	//TODO decide to handle globally on task or per target
	/*if (options.shellScriptName) {
		var dir = path.dirname(src);
		grunt.file.write(path.join(dir, options.shellScriptName +'.sh'), cliBatch.join('\n'));
		grunt.file.write(path.join(dir, options.shellScriptName +'.bat'), cliBatch.join('\n'));
	}*/

	//return value
	var result = {
		cwd: cwd,
		src: src,
		output: '',
		tasks: taskList,
		options: options,
		res: null
	};

	// spawn cli options
	var param = {
		cmd: 'grunt',
		args: argArr,
		opts: {
			cwd: cwd
		}
	};

	var child = grunt.util.spawn(param,
		function (err, res, code) {
			grunt.log.writeln('-> '.cyan + 'reporting ' + src);

			result.error = err;
			result.res = res;
			result.code = code;
			result.mixiedStdIO = mixiedStdIO.join('');
			result.duration = (Date.now() - start);

			// basic check
			if (err || code !== 0) {
				result.fail = true;
			}
			else {
				result.fail = false;
			}

			// process the result object
			if (options.process) {
				var ret = options.process(result);
				if (_.isUndefined(ret)) {
					// no return value: leaves as-is
				}
				else if (ret === true) {
					// boolean true mean it passes
					result.fail = false;
				}
				else {
					// anythings else mean fail
					result.fail = true;

					var label = 'grunt_cli(' + [tasks].join(' / ') + ')';

					grunt.log.writeln('-> ' + ('grunt process fail').red + ' for ' + label);

					if (ret !== false) {
						// only log if not a boolean
						grunt.log.writeln('-> ' + ret);
					}
				}
			}

			// log the log
			if (options.log) {
				grunt.log.writeln(result.mixiedStdIO);
			}
			if (options.logFile) {
				var tmp = options.logFile;
				if (path.dirname(tmp)) {
					tmp = path.join(tmp, 'grunt-log.txt');
				}
				grunt.log.writeln('-> '.cyan + 'saving data to ' + tmp);
				grunt.file.write(tmp, result.mixiedStdIO);

				result.logFile = tmp;
			}

			callback(err, result);
		}
	);
	// mix output
	child.stdout.on('data', function (data) {
		mixiedStdIO.push(data);
	});
	child.stderr.on('data', function (data) {
		mixiedStdIO.push(data);
	});
}

var cliParams = {
	help: 'flag',
	base: 'string',
	no_color: 'flag',
	debug: 'flag',
	stack: 'flag',
	force: 'flag',
	tasks: 'string',
	npm: 'string',
	no_write: 'flag',
	verbose: 'flag',
	version: 'flag'
};
var passParams = {
	cwd: null,
	log: true,
	logFile: null,
	debugCli: false,
	process: null
};

module.exports = function (grunt) {

	var _ = grunt.util._;

	grunt.registerMultiTask('grunt_cli_run', 'Run grunt-cli from grunt.', function () {
		var options = this.options(_.defaults({
			concurrent: 2
		}, passParams));

		//var self = this;
		var done = this.async();
		var fail = [];
		var pass = [];
		var start = Date.now();

		grunt.util.async.forEachLimit(this.filesSrc, options.concurrent, function (filePath, callback) {
			if (!grunt.file.exists(filePath)) {
				grunt.log.warn('file "' + filePath + '" not found.');
				return false;
			}

			var runOptions = {
				args: {}
			};

			// loop default keys but read from options
			_.each(passParams, function (value, key) {
				runOptions[key] = options[key];
			});

			// import grunt-cli params
			_.each(cliParams, function (value, key) {
				if (!_.isUndefined(options[key])) {
					var val = options[key];
					if (val === 'flag') {
						runOptions.args[key] = true;
					}
					else {
						runOptions.args[key] = options[key];
					}
				}
			});

			grunt.log.writeln('-> '.cyan + 'starting ' + filePath);

			runGruntfile(grunt, filePath, options.task, runOptions, function (err, result) {

				if (!result) {
					grunt.fail.warn('no result for ' + filePath);
					callback(err);
				}
				else {
					var end = ' ' + filePath + ' (' + (result.duration) + 'ms)';

					if (result.fail) {
						fail.push(result);
						grunt.fail.warn(('failed').red + end);
					} else {
						pass.push(result);
						grunt.log.writeln('-> '.cyan + 'completed' + end);
						callback(err, result);
					}
				}
			});

		}, function (err) {
			grunt.log.writeln('');
			if (err) {
				grunt.fail.warn(' ' + err);
			}
			else {
				var end = ' (' + (Date.now() - start) + 'ms)\n';

				if (fail.length > 0) {
					grunt.fail.warn('' + (pluralise(fail.length, 'gruntfile') + ' failed').red + ' and ' + (pass.length + ' passed ').green + end);
				}
				else {
					grunt.log.ok('' + pluralise(pass.length, 'gruntfile').green + ' executed' + end);
				}
			}
			done();
		});
	});
};