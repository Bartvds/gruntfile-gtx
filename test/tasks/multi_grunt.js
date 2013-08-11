'use strict';

function pluralise(count, str) {
	return count + ' ' + str + (count === 1 ? '' : 's');
}

module.exports = function (grunt) {
	grunt.registerMultiTask('multi_grunt', 'multi_grunt', function () {
		var options = this.options({
			cwd: '.'
		});

		//var self = this;
		var done = this.async();
		var context = {
			timer: Date.now(),
			counter: 0,
			options: options
		};
		grunt.util.async.forEachSeries(self.filesSrc, function (src) {
			if (!grunt.file.exists(src)) {
				return;
			}
			var child = grunt.util.spawn(
				{
					cmd: 'grunt',
					args: ['--gruntfile', src],
					opts: {
						cwd: (context.options.cwd !== null) ? context.options.cwd : path.dirname(src)
					}
				},
				function (error, result, code) {
					if (error) {
						grunt.fail.warn('-> '.cyan + 'error '.red + ('' + code).red + ' ' + src.cyan + ' (' + (Date.now() - start) + 'ms)');
					} else {
						context.counter += 1;
						grunt.log.writeln('-> '.cyan + 'completed ' + src.cyan + ' (' + (Date.now() - start) + 'ms)');
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
				grunt.log.ok('' + pluralise(context.counter, 'gruntfiles') + ' executed (' + (Date.now() - context.timer) + 'ms)\n');
			}
			done();
		});
	});
};