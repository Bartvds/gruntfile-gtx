# gruntfile-gtx

[![Build Status](https://secure.travis-ci.org/Bartvds/gruntfile-gtx.png?branch=master)](http://travis-ci.org/Bartvds/gruntfile-gtx) [![Dependency Status](https://gemnasium.com/Bartvds/gruntfile-gtx.png)](https://gemnasium.com/Bartvds/gruntfile-gtx) [![NPM version](https://badge.fury.io/js/gruntfile-gtx.png)](http://badge.fury.io/js/gruntfile-gtx)

> Turbo, spoilers and a sunroof for your Gruntfile.

[Grunt](http://www.gruntjs.com) enhancement to make gruntfile task management more dynamic and powerful. Handle demanding task and target setups while keeping your Gruntfile shiny and DRY.

:warning: The project is pre-alpha, use with care.

## Features

* Use macros to generate chains of related (anonymous) plugin task instances.
* Use tags to group and select similar targets.
* Create new aliases by filtering tasks on various fields.
* Transparently streamline gruntfile api a little.

Macros are powerful to define chains of targets for different plugins that together define a blueprint for build-sub-process. Create different instances that share or change parameters like identifiers, (partial) paths.

## Usage

Check the [Gruntfile](https://github.com/Bartvds/gruntfile-gtx/blob/master/Gruntfile.js) for practical [dogfooding](https://en.wikipedia.org/wiki/Dogfooding) and [browse the tests](https://github.com/Bartvds/gruntfile-gtx/tree/master/test/spec) for some more options.

### Example

The following code block shows many of the enhancement features. The macro example is lifted from the [gruntfile of TSD](https://github.com/DefinitelyTyped/tsd/blob/develop-0.5.x/Gruntfile.js) and shows a macro to compile and run separated 'test modules'.

This specific macro aims to make the different project modules easier to run by splitting the test-suite over multiple separate folders. Additionally separate 'modules' can also be run concurrently to cut-down on overall test-duration for IO heavy topics. 

Note how the macro uses a few plugins to setup and run: it would be a hassle to maintain these modules in a regular gruntfile but it is easy when using a macro to build the chains. 


````js
// export like any Gruntfile
module.exports = function (grunt) {

	// get the gtx instance
	var gtx = require('gruntfile-gtx').wrap(grunt);

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// load some plugins

	gtx.loadNpm(
		'myPlugin',
		'myOtherPlugin'
	);
	gtx.loadTasks('./tasks');

	// use bundled 'load-grunt-tasks'
	gtx.autoLoad();

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// basic configuration

	// build the grunt config like the regular structure
	gtx.addConfig({
		pkg: grunt.file.readJSON('package.json'),
		myPlugin: {
			options: {
				//..
			},
			main: {
				src: ['./files/main/*.js']
				//..
			}
		},
		myOtherPlugin: {
			main: {
				src: ['./files/dev/*.js']
				//..
			}
		}
	});
	// ... but split over multiple statements
	gtx.addConfig({
		myPlugin: {
			dev: {
				src: ['./files/dev/*.js']
				//..
			}
		}
	});
	// directly set config object
	gtx.addConfigFor('myPlugin', 'beta', {
		src: ['./files/beta/*.js']
	});
	// generate a unique name (note: this is the basis for the macro feature)
	var name = gtx.addConfigFor('myPlugin', {
		src: ['./files/gamma/*.js']
	});
	// do creative stuff by generating tasks (go wild here)
	gtx.alias('bulk_run', ['one', 'two', 'three'].map(function (name) {
		return gtx.addConfigFor('myPlugin', {
			src: ['./files/' + name + '/*.js']
		});
	}));

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// define a macro (lifted from practical use-case)

	// note the macro object is a context with helpers to assemble a new instance named 'id'
	gtx.define('module_tester', function (macro, id) {
		// let's use the instance id to build a shared path
		var testPath = 'test/modules/' + id + '/';

		// use grunt-contrib-clean to remove old test output
		macro.newTask('clean', [testPath + 'tmp/**/*']);

		// use grunt-ts to compile the TypeScript test cases
		macro.newTask('ts', {
			options: {},
			src: [testPath + 'src/**/*.ts'],
			out: testPath + 'tmp/' + id + '.test.js'
		});
		// use grunt-tslint
		macro.newTask('tslint', {
			src: [testPath + 'src/**/*.ts']
		});
		// optionally spawn a grunt-contrib-connect
		if (macro.getParam('http', 0) > 0) {
			macro.newTask('connect', {
				options: {
					port: macro.getParam('http'),
					base: testPath + 'www/'
				}
			});
			//tag for easy retrieval
			macro.tag('http');
		}
		// run a regular task
		macro.runTask('myPlugin:dev');

		// run grunt-mocha-test on the compiled test cases
		macro.newTask('mochaTest', {
			options: {
				timeout: macro.getParam('timeout', 2000)
			},
			src: [testPath + 'tmp/**/*.test.js']
		});
	}, {
		// optionally run parallel using grunt-concurrent (for now only from gtx-type)
		concurrent: 4
	});

	// use the macro to make many instances
	gtx.create('git', 'module_tester', null, 'lib');
	gtx.create('tsd', 'module_tester', {timeout: 10000}, 'lib,core');
	gtx.create('http', 'module_tester', {
		timeout: 20000,
		http: 8080
	}, 'lib');
	gtx.create('basic,remote,local', 'module_tester');

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	// let's make an alias to run all instances as your $ grunt test
	gtx.alias('test', ['gtx-type:module_tester']);

	// alias is short-cut for grunt.registerTask();
	gtx.alias('default', ['test']);

	// compile and send to the grunt.initConfig()
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
````

### Additional examples:

* Complex example from [mocha-unfunk-reporter](https://github.com/Bartvds/mocha-unfunk-reporter/blob/abc2732c1c44aca17dc8a7c647aa1f3d7313279e/Gruntfile.js) uses a macro to setup a CLI output bulk tester (this is also a warning about complexity).

## Info

*	Your gruntfile is still a regular gruntfile to run by `grunt-cli`. 
	*	Use the `grunt -h` command to view the generated tasks.
	*	Main difference is to import and apply `gruntfile-gtx` on start if the Gruntfile.
	*	Call `gtx.finalise()` at the end of the file to generate the config and apply aliases. 
*	Generated aliases are prefixed with `gtx`, like `gtx-select:myAlias` or `gtx-group:dev`.
	*	They run like any task created by `grunt.registerTask()`. 
*	The extra API sugar like `gtx.loadNpm()` is optional, but is generally DRY-er then the regular versions.
*	String input uses a form of expansion and iteration where applicable.
	*	Split strings on separators to array: `gtx.alias('name', 'one, two, three')`
	*	Nested arrays are flattened and the content split: `gtx.alias('name', [['aa','bb'], 'cc', ['dd, ee'],'ff,gg,hh'])`  
	*	Where grunt methods accept a single string the alias will iterate: `gtx.loadNpm([..])`
*	Gruntfile-gtx was created to solve acute practical problems and grown organically to fit real world needs: no gold-plating but some rough edges made shiny from usage.

## Future

There a lot of ideas for this floating around, from auto-dependency chains and non-repeating macro util tasks, to globbing helpers to generate macro instances and flows adapting to custom cli parameters or env variables. 

Also it would be cool to interface with (Yeoman) generators for easy instancing of build sub modules.

Most of these wait until Grunt reaches `0.5.0` (which will be amazing and solve some of the original problems).

## API

:x: Yet undocumented. See the examples, the [Gruntfile](https://github.com/Bartvds/gruntfile-gtx/blob/master/Gruntfile.js) and [browse the tests](https://github.com/Bartvds/gruntfile-gtx/tree/master/test/spec) for examples.

# History

* 0.0.8 - Cleaned task, small fixes, bundle [load-grunt-tasks](https://github.com/sindresorhus/load-grunt-tasks) (via `grunt.autoLoad()`)
* 0.0.5 - Added concurrent-execution to gtx:type
* 0.0.3 - NPM push
* 0.0.2 - Various construction work

## Contributing

Contributions are welcome (idiomatic, clean etc) but best to post a proposal in the [Issues](https://github.com/Bartvds/gruntfile-gtx/issues) before making big changes. 

## Vagrant

There is a Vagrantfile and set of Chef cookbooks to use with [Vagrant](http://www.vagrantup.com) for easy testing on a Linux VM. It will install a node.js from package, install the dependencies and enable grunt.

## License

Copyright (c) 2013 Bart van der Schoor

Licensed under the MIT license.