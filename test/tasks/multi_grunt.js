'use strict';

function pluralise(count, str) {
	return count + ' ' + str + (count === 1 ? '' : 's');
}

module.exports = function (grunt) {

	var assert = require('assert');
	var _ = grunt.util._;

	grunt.registerMultiTask('multi_grunt', 'multi_grunt', function () {
		var options = this.options({
			saveResult: true
		});

		var path = require('path');
		//var os = require('os');
		//var self = this;
		var done = this.async();
		var context = {
			timer: Date.now(),
			counter: 0,
			options: options,
			files: []
		};
		console.dir(this.files);
		//flatten for sanity
		grunt.util._.each(this.files, function (f) {
			grunt.util._.each(f.src, function (filePath) {
				if (!grunt.file.exists(filePath)) {
					grunt.log.warn('file "' + filePath + '" not found.');
					return false;
				}
				assert.ok(f.dest, 'f.dest: ' + f.dest);
				context.files.push({src: filePath, dest: f.dest});
			});
		});

		console.dir(context.files);

		// more?
		var limit = 2;

		grunt.util.async.forEachLimit(context.files, limit, function (file, callback) {
			var start = Date.now();

			grunt.log.writeln('-> run ' + file.src);
			grunt.log.writeln('-> save ' + file.dest);

			var cwd = (_.isUndefined(context.options.cwd) || _.isNull(context.options.cwd) ? path.dirname(file.src) : context.options.cwd);

			// apply defaults
			var argHash = _.defaults({
				'--gruntfile': path.resolve(file.src)
			}, options.args || {});

			// serialise named args
			var args = [];
			_.each(argHash, function (value, opt) {
				args.push((opt.length === 1 ? '-' : '--') + opt);
				if (!(_.isNull(value) && _.isUndefined(value) && _.isTrue(value))) {
					args.push(value);
				}
			});
			// unnamed vars
			if (argHash._) {
				_.each(argHash._, function (value) {
					args.push(value);
				});
			}

			var param = {
				cmd: 'grunt',
				args: args,
				opts: {
					cwd: cwd
				}
			};

			console.log('');
			console.log('cd ' + path.resolve(cwd));
			console.log('grunt ' + args.join(' '));
			console.log('cd ' + process.cwd());
			console.log('');
			// console.log(path.resolve(cwd));
			//console.dir(param);

			// spawn cli
			grunt.util.spawn(param,
				function (error, result, code) {
					grunt.log.writeln('-> '.cyan + 'execute ' + file.src);

					var res = code > 0 ? result.stderr : result.stdout;

					grunt.log.writeln(res);

					if (options.saveResult) {
						grunt.log.writeln('-> '.cyan + 'saving data to ' + file.dest);
						grunt.file.write(file.dest, res);
					}

					if (error) {
						grunt.fail.warn('-> '.cyan + 'error '.red + ('' + code).red + ' ' + file.src.cyan + ' (' + (Date.now() - start) + 'ms)');
					} else if (code > 0) {
						grunt.fail.warn('-> '.cyan + 'exitcode '.red + ('' + code).red + ' ' + file.src.cyan + ' (' + (Date.now() - start) + 'ms)');
					} else {
						context.counter += 1;
						grunt.log.writeln('-> '.cyan + 'completed ' + file.src + ' (' + (Date.now() - start) + 'ms)');
					}
					callback(error);
				}
			);
		}, function (err) {
			grunt.log.writeln('');
			if (err) {
				grunt.fail.warn(' ' + err);
			}
			else {
				grunt.log.ok('' + pluralise(context.counter, 'gruntfile') + ' executed (' + (Date.now() - context.timer) + 'ms)\n');
			}
			done();
		});
	});
};