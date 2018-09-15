var util = require('util');
var path = require('path');
var grunt = require('grunt');
var chai = require('chai');
var assert = chai.assert;

function toUnixNewline(str) {
  return str.replace(/\r\n|\r/g, "\n");
}
function toWindowNewLine(str) {
  return str.replace(/\r\n|\r|\n/g, "\r\n");
}
function inspect(value, depth) {
  console.log(util.inspect(value, false, depth || 10));
}

// chai-fs needs this
function fileEqual(normalised, setName, pairName) {
  assert.lengthOf(arguments, 3, 'arguments');

  var actual = grunt.file.read('test/spec/' + setName + '/tmp' + pairName);
  var expected = grunt.file.read('test/spec/' + setName + '/expected' + pairName);
  if (normalised) {
    actual = toUnixNewline(actual);
    expected = toUnixNewline(expected);
  }
  assert.ok(actual, 'actual should be ok: ' + pairName);
  assert.ok(expected, 'expected should be ok: ' + pairName);

  assert.strictEqual(actual, expected, 'should match content');
}

function fileEqualJSON(setName, pairName) {
  assert.lengthOf(arguments, 2, 'arguments');

  var tmp = 'test/spec/' + setName + '/tmp/' + pairName;
  assert.isFile(tmp);

  var actual = grunt.file.readJSON(tmp);
  var expected = grunt.file.readJSON('test/spec/' + setName + '/expected/' + pairName);
  assert.ok(actual, 'actual should be ok: ' + pairName);
  assert.ok(expected, 'expected should be ok: ' + pairName);

  assert.deepEqual(actual, expected, 'should match JSON: ' + pairName);
}

function getTestName(filename) {
  //get name of dir
  return path.basename(path.dirname(filename));
}

function assertSpec(__filename, files) {
  var setName = getTestName(__filename);

  describe('spec/' + setName, function () {
    if (files.length === 0) {
      it(base, function () {
        assert(false, 'no files');
      });
      return;
    }
    files.forEach(function (file) {
      var base = path.basename(file);
      it(base, function () {
        var ext = path.extname(file);
        if (ext === '.json') {
          fileEqualJSON(setName, file);
        }
        else if (ext === '.txt') {
          fileEqual(setName, file);
        }
        else {
          assert(false, 'no spec assertion for ' + base);
        }
      });
    });
  });
}

module.exports = {
  toWindowNewLine: toWindowNewLine,
  toUnixNewline: toUnixNewline,
  fileEqual: fileEqual,
  fileEqualJSON: fileEqualJSON,
  assertSpec: assertSpec,
  getTestName: getTestName,
  inspect: inspect
};
