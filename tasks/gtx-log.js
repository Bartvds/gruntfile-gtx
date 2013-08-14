module.exports = function (grunt) {

	var util = require('util');
	var _ = grunt.util._;

	grunt.registerMultiTask('gtx-log', 'Log values to console', function () {
		var options = this.options({
			message: '<no log message>'
		});
		var sender = '';
		if (options.sender) {
			sender = options.sender + ': ';
		}
		var pre = '-> "' + this.target + '"';
		var prep = pre + ': ' + sender;

		var value = this.data.message || options.message;
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
