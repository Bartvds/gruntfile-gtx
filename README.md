# gruntfile-gtx

[![Build Status](https://travis-ci.org/Bartvds/gruntfile-gtx.svg?branch=master)](https://travis-ci.org/Bartvds/gruntfile-gtx)
[![Coverage Status](https://coveralls.io/repos/github/Bartvds/gruntfile-gtx/badge.svg?branch=master)](https://coveralls.io/github/Bartvds/gruntfile-gtx?branch=master)
[![Dependency Status](https://david-dm.org/killmenot/Bartvds/gruntfile-gtx.svg)](https://david-dm.org/killmenot/Bartvds/gruntfile-gtx.svg)
[![npm version](https://img.shields.io/npm/v/gruntfile-gtx.svg)](https://img.shields.io/npm/v/gruntfile-gtx.svg)
> Turbo, spoilers and a sunroof for your Gruntfile.

[Grunt](http://www.gruntjs.com) enhancement to make gruntfile task management more dynamic and powerful. Handle demanding setups while keeping your Gruntfile shiny and DRY.


## Features

* Use macros to generate chains of related (semi-anonymous) plugin task instances.
* Use tags to group and select similar targets.
* Create new aliases by filtering tasks on various fields.
* Transparently streamline gruntfile api a little.

Macros are powerful to define chains of targets for different plugins that together define a blueprint for build-sub-process. Create different instances that share or change parameters like identifiers, (partial) paths.

### API Change

Per `v0.1.0` the API was updated. The old docs can be found [here](https://github.com/Bartvds/gruntfile-gtx/commit/3472afa6546980e2a00933023c357dd516fcba2c)


## Usage

Check the [Gruntfile](https://github.com/Bartvds/gruntfile-gtx/blob/master/Gruntfile.js) for practical [dogfooding](https://en.wikipedia.org/wiki/Dogfooding) and [browse the tests](https://github.com/Bartvds/gruntfile-gtx/tree/master/test/spec) for some more options.

### Example

````js
module.exports = function (grunt) {

  // get the gtx instance
  var gtx = require('gruntfile-gtx').wrap(grunt);
````

Load some plugins:
````js
  gtx.loadNpm(
    'myPlugin',
    'myOtherPlugin'
  );
  //classic array
  gtx.loadNpm([
    'myPlugin',
    'myOtherPlugin'
  ]);
  // folder
  gtx.loadTasks('./tasks');
  
  // alternately load automatically (from ./tasks and ./node_modules)
  gtx.loadAuto();
````

Build the grunt config like the regular structure:
````js
  gtx.config({
    // read and blend objects
    pkg: gtx.readJSON('package.json', {title: 'foo'}, './conf/overwrite.json'),
    myPlugin: {
      options: {
        //..
      },
      main: {
        src: ['./files/main/*.js']
      }
    },
    myOtherPlugin: {
      main: {
        src: ['./files/dev/*.js']
      }
    }
  });
  // ... but split over multiple statements
  gtx.config({
    myPlugin: {
      dev: {
        src: ['./files/dev/*.js']
      }
    }
  });
  // or directly set config objects
  gtx.configFor('myPlugin', 'beta', {
    src: ['./files/beta/*.js']
  });
````

Define tasks:
````js
  // define a simple task
  gtx.call('say', function() {
    grunt.log.writeln('hello!');
  });

  // define a multi-task
  gtx.multi('alpha_multi', function() {
    var options = this.options({
      //..
    });
    grunt.log.writeln('hello!');
  });
````

Run tasks:
````js  
  // named serial
  gtx.alias('many', ['one', 'two', 'three']);

  // named concurrent (max cpu cores)
  gtx.concurrent('many', ['one', 'two', 'three']);
````

Generate a unique name for a configuration (this is the basis for the macro feature)
````js
  var name = gtx.configFor('myPlugin', {
    src: ['./files/gamma/*.js']
  });

  // do creative stuff by generating tasks (go wild here)
  gtx.alias('bulk_run', ['one', 'two', 'three'].map(function (name) {
    return gtx.configFor('myPlugin', {
      src: ['./files/' + name + '.js']
    });
  }));

  // generated tasks from parallel() to run concurrently
  gtx.alias('many', ['one', gtx.parallel('two', 'three')]);

  // generated tasks from serial()
  gtx.alias('more', ['one', 
    gtx.parallel(
      gtx.serial('two', 'three'),
      gtx.serial('four', 'five'))
    )
  ]);
````

This example is lifted from the [gruntfile of TSD](https://github.com/DefinitelyTyped/tsd/blob/develop-0.5.x/Gruntfile.js) and shows a macro to compile and run separated 'test modules'. These can also be run concurrently to cut-down on overall test-duration for IO heavy topics. 

Note how the macro uses a few plugins to setup and run: it would be a hassle to maintain these modules in a regular gruntfile but it is easy when using a macro to build the instance: 

````js
  gtx.define('module_tester', function (macro, id) {
    // the macro object is a context with helpers to assemble a new instance named 'id'

    // let's use the instance id to build a shared path
    var testPath = 'test/modules/' + id + '/';

    // use grunt-contrib-clean to remove old test output
    macro.add('clean', [testPath + 'tmp/**/*']);

    // run a regular task
    macro.run('myPlugin:dev');

    // use grunt-ts to compile the TypeScript test cases
    macro.add('ts', {
      options: {},
      src: [testPath + 'src/**/*.ts'],
      out: testPath + 'tmp/' + id + '.test.js'
    });
    // use grunt-tslint
    macro.add('tslint', {
      src: [testPath + 'src/**/*.ts']
    });
    // optionally spawn a grunt-contrib-connect
    if (macro.getParam('http', 0) > 0) {
      macro.add('connect', {
        options: {
          port: macro.getParam('http'),
          base: testPath + 'www/'
        }
      });
      //tag for easy retrieval
      macro.tag('http');
    }
    // run grunt-mocha-test on the compiled test cases
    macro.add('mochaTest', {
      options: {
        timeout: macro.getParam('timeout', 2000)
      },
      src: [testPath + 'tmp/**/*.test.js']
    });
  }, {
    // optionally run parallel using grunt-concurrent (for now only from gtx-type)
    concurrent: 4
  });
````

Use the macro to make many similar instances:
````js
  // use the macro to make many instances
  gtx.create('git', 'module_tester', null, 'lib');
  gtx.create('tsd', 'module_tester', {timeout: 10000}, 'lib,core');
  gtx.create('http', 'module_tester', {
    timeout: 20000,
    http: 8080
  }, 'lib');
  // bulk
  gtx.create('basic,remote,local', 'module_tester');
  gtx.create(['basic','remote','local'], 'module_tester');
````

Mix functions and id's:
````js
  // mix calls in alias
  gtx.alias('mix', ['alpha:one', 'bravo:two', function() {
    grunt.log.writeln('roger');
  }, 'charlie', function() {
    grunt.log.writeln('roger');
  }]);
````

Finish up:
````js
  // let's make an alias to run all instances as your $ grunt test
  gtx.alias('test', 'gtx-type:module_tester');

  // alias is short-cut for grunt.registerTask();
  gtx.alias('default', ['test']);

  // compile and send to grunt.initConfig()
  gtx.finalise();
};
````

To run these macro instances:
````
$ grunt -h
$ grunt gtx:git
$ grunt gtx-group:core
$ grunt gtx-group:http
$ grunt gtx-type:module_tester

// bonus: clean all
$ grunt clean
````

### Additional examples:

* Complex example from [mocha-unfunk-reporter](https://github.com/Bartvds/mocha-unfunk-reporter/blob/abc2732c1c44aca17dc8a7c647aa1f3d7313279e/Gruntfile.js) uses a macro to setup a CLI output bulk tester (this is also a warning about power and responsibility).


## Info

* Your gruntfile is still a regular gruntfile to run by `grunt-cli`. 
  * Use the `grunt -h` command to view the generated tasks.
  * Main difference is to import and apply `gruntfile-gtx` on start if the Gruntfile.
  * Call `gtx.finalise()` at the end of the file to generate the config and apply aliases. 
* Generated aliases are prefixed with `gtx`, like `gtx-select:myAlias` or `gtx-group:dev`.
  * They run like any task created by `grunt.registerTask()`. 
* The extra API sugar like `gtx.loadNpm()` is optional, but is generally DRY-er then the regular versions.
* String input uses a form of expansion and iteration where applicable.
  * Split strings on separators to array: `gtx.alias('name', 'one, two, three')`
  * Nested arrays are flattened and the content split: `gtx.alias('name', [['aa','bb'], 'cc', ['dd, ee'],'ff,gg,hh'])`  
  * Where grunt methods accept a single string the alias will iterate: `gtx.loadNpm([..])`
* Gruntfile-gtx was grown organically: no gold-plating but some edges made shiny from wear.


## Future

There a lot of ideas for this floating around for this, from auto-dependency chains and non-repeating macro util tasks, to globbing helpers to generate macro instances and flows adapting to custom cli parameters or env variables. Also it would be cool to interface with (Yeoman) generators for easy instancing of build sub modules.

Most of these wait until Grunt reaches `0.5.0` which solve some of the original problems.


## API

See above usage examples and look at the [Gruntfile](https://github.com/Bartvds/gruntfile-gtx/blob/master/Gruntfile.js) and [the tests](https://github.com/Bartvds/gruntfile-gtx/tree/master/test/spec) for more usage.


## Release History

See the [CHANGELOG](/CHANGELOG).


## Contributing

Contributions are welcome (idiomatic, clean etc) but best to post a proposal in the [Issues](https://github.com/Bartvds/gruntfile-gtx/issues) before making big changes. 


## License

Copyright (c) 2013-2018 Bart van der Schoor

Licensed under the MIT license.
