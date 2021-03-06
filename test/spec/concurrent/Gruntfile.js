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
  gtx.define('echoList', function (macro, id) {
    macro.log('Test!');

    const defaultWait = 200;
    const wait = macro.getParam('wait', defaultWait);

    if (wait > defaultWait) {
      macro.tag('slow');
    }
    else if (wait < defaultWait) {
      macro.tag('fast');
    }

    const str = id + ' says: ';

    macro.add('echo', {
      options: {
        echo: str + 'one',
        wait: wait * 2
      }
    });
    macro.add('echo', {
      options: {
        echo: str + 'two two',
        wait: wait
      }
    });
    macro.log('Done!');
  }, {
    concurrent: 3
  });

  gtx.create('alpha,bravo,charlie,delta,echo,foxtrot,golf,hotel,india', 'echoList', {wait: 200});
  gtx.create('tango,victory', 'echoList', {wait: 500});
  gtx.create('oscar,mike', 'echoList', {wait: 100});
  gtx.create('xray', 'echoList', {wait: 1000});

  gtx.alias('default', ['test']);
  gtx.alias('test', ['gtx-type:echoList:xm']);
  gtx.alias('dev', ['gtx-type:echoList']);

  gtx.finalise();
};
