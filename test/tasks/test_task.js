'use strict';

module.exports = function (grunt) {
	//var path = require('path');

	grunt.registerMultiTask('test_task', 'test_task', function () {
		//var options = this.options({});

		var base = this.data._target;
		grunt.log.writeln(base);
		// grunt.log.writeln(path.resolve(base));

		//write data
		/*if (this.data.raw) {
			grunt.file.write(base + '.raw.txt', this.data.raw);
		}
		if (this.data.json) {
			grunt.file.write(base + '.data.json', this.data.json);
		}

		if (this.data._options) {
			grunt.file.write(base + '.options.json', JSON.stringify(options));
		}
		var data = {};
		if (this.data._fields) {
			grunt.util._.forEach(this.data._fields, function (field) {
				data[field] = this.data[field];
			});
			grunt.file.write(base + '.fields.json', JSON.stringify(data));
		}*/
	});
};