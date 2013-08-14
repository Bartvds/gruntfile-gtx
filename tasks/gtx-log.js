module.exports = function (grunt) {

	grunt.registerMultiTask('gtx-log', 'Log values to console', function () {
		var pre = '-> "' + this.target + '"';
		var prep = pre + ': ';

		var options = this.options({
			log: '<no log message>'
		});

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
};
