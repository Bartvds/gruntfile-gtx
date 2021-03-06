'use strict';

const path = require('path');

module.exports = function (grunt) {
  const gtx = require('../../../lib/gtx.js').wrap(grunt);

  gtx.loadTasks('../../../node_modules/grunt-contrib-clean/tasks');
  gtx.loadTasks('../../test_tasks');

  gtx.config({
    clean: {
      tests: ['tmp/**/*']
    },
    dummy_tango: {
      tango_one: {},
      'tango-two': {}
    },
    'dash-victor': {
      victor_one: {},
      'victor-two': {}
    },
    echo: {
      before: {
        options: {
          echo: 'before: ' + path.basename(__filename)
        }
      },
      after: {
        options: {
          echo: 'after: ' + path.basename(__filename)
        }
      },
      echo: {
        options: {
          echo: 'echo'
        }
      }
    }
  });
  gtx.define('soundCheck', function (macro, id) {
    macro.log('Test!');

    var str = id + ' says: ';
    macro.add('echo', {
      options: {
        echo: str + 'one'
      }
    });
    if (!macro.getParam('echoMuted', false)) {
      macro.add('echo', {
        options: {
          echo: str + 'two'
        }
      });
      macro.add('echo', {
        options: {
          echo: str + 'two two'
        }
      });
      macro.add('echo', {
        options: {
          echo: str + 'one one two two'
        }
      });
    }
    macro.log('Done!');
  });

  gtx.create('Hank,Jimmy', 'soundCheck');
  gtx.create('Albert', 'soundCheck', {echoMuted: true});

  gtx.alias('default', ['echo:before', 'dummies', 'echo:after']);

  gtx.alias('dummies', [
    'dummy_tango:tango_one',
    'dummy_tango:tango-two',
    'echo:echo',
    'dash-victor:victor_one',
    'dash-victor:victor-two'
  ]);

  gtx.alias('tangos', ['dummy_tango:tango_one', 'dummy_tango:tango_two']);
  gtx.alias('victors', ['dash-victor:victor_one', 'dash-victor:victor-two']);

  gtx.alias('multi', ['echo:before', 'echo:echo', 'echo:after']);

  gtx.finalise();
};
