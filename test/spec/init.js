'use strict';

const mkdirp = require('mkdirp');
const grunt = require('grunt');
const chai = require('chai');

chai.Assertion.includeStack = true;
chai.should();

const assert = chai.assert;
chai.use(require('chai-fs'));

const gtx_mod = require('../../lib/gtx');
assert.isObject(gtx_mod, 'gtx');

chai.gtx_mod = gtx_mod;

before(() => {
  // create some empty dirs (cannot check-in empty dirs to git)
  mkdirp.sync('./test/tmp');
  mkdirp.sync('./tmp');

  assert.isDirectory('./test/tmp');
});

describe('gruntfile-gtx', () => {
  it('exports module', () => {
    assert.isObject(gtx_mod, 'gtx');
    assert.isFunction(gtx_mod.wrap, 'gtx.wrap');
  });

  it('module main is linked in package.json', () => {
    const pkg = grunt.file.readJSON('package.json');
    assert.isObject(pkg, 'pkg');

    assert.property(pkg, 'main', 'pkg.main');
    assert.isFile(pkg['main'], 'pkg.main');
  });
});
