'use strict';

module.exports = function (grunt) {
	var path = require('path');

	grunt.registerMultiTask('test_write', 'test_write', function () {
		var options = this.options({});

		var base = this.data._target;
		grint.log.writeln(base);

		//write data
		if (this.data.raw) {
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
		}
	});
};