'use strict';

module.exports = function (grunt) {
  const gtx = require('../../../lib/gtx.js').wrap(grunt);

  gtx.loadTasks('../../../node_modules/grunt-contrib-clean/tasks');

  gtx.config({
    clean: {
      tmp: './tmp/*'
    },
    echo: {
      hello: {
        options: {
          echo: 'hello!'
        }
      }
    }
  });
  gtx.define('simple_macro', function (macro) {
    macro.log('Test! ' + macro.getParam('message'));
  });

  gtx.alias('default', ['echo', gtx.anon('simple_macro', {message: 'hello!'})]);

  grunt.log.writeln(gtx.anon('simple_macro', {message: 'hello!'}));

  gtx.finalise();
};
