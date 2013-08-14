var mkdirp = require('mkdirp');
//var _ = require('underscore');

var chai = require('chai');
chai.Assertion.includeStack = true;
chai.should();
//var expect = chai.expect;
var assert = chai.assert;
chai.use(require('chai-fs'));

var gtx_mod = require('../../lib/gtx');
assert.isObject(gtx_mod, 'gtx');

chai.gtx_mod = gtx_mod;

before(function () {
	// create some empty dirs (cannot check-in empty dirs to git)
	mkdirp.sync('./test/tmp');
	mkdirp.sync('./tmp');

	assert.isDirectory('./test/tmp');
});

describe('gruntfile-gtx', function () {
	it('exports module', function () {
		assert.isObject(gtx_mod, 'gtx');
		assert.isFunction(gtx_mod.wrap, 'gtx.wrap');
	});
});