# gruntfile-gtx

[![Build Status](https://secure.travis-ci.org/Bartvds/gruntfile-gtx.png?branch=master)](http://travis-ci.org/Bartvds/gruntfile-gtx) [![Dependency Status](https://gemnasium.com/Bartvds/gruntfile-gtx.png)](https://gemnasium.com/Bartvds/gruntfile-gtx) [![NPM version](https://badge.fury.io/js/gruntfile-gtx.png)](http://badge.fury.io/js/gruntfile-gtx)

> Turbo, spoilers and a sunroof for your Gruntfile. :checkered_flag:

[Grunt](http://www.gruntjs.com) enhancement to make gruntfile task management more dynamic and powerful. Handle demanding task and target setups while keeping your Gruntfile shiny and DRY.

:warning: The project is pre-alpha. Use with care until 0.1.0 (fixed version, no ~'s) =

## Features

* Use macros to generate chains of related plugin tasks.
* Use tags to group and select similar targets.
* Create new aliases by filtering tasks on various fields.
* Transparently streamline the gruntfile api.

The most powerful feature is the macro definition that is used to define chains of targets for different plugins that together define a blueprint for build-sub-process. Create different instances that share or change parameters like identifiers, (partial) paths.

## Macro use-case

Assume you have a project nicely split into testable modules. You want to leverage this to quickly iterate coding and testing on a specific module. 

* Each module requires running a plugin chain: for example: clean, lint, compile, test, compress, update exports etc.
* In a regular gruntfile this will mean maintaining repeating configuration data in different places. Fields like paths and identifiers are reused each target configuration. This is not DRY and will lead to mistakes and config bloat.
* With gruntfile-gtx you can define a macro, a function that will be called per-instance with a helper object that assembles the new chain.
* When you use the macro you give the instance an alias name and pass your custom fields. The macro then will generate the appropriate grunt configuration elements and alias the chain as a new task.
* Use these as-is or apply a selector query to make new aliases: for example select a few specific tasks for debugging. It can be used like any other alias. Call it from command line, link it from your IDE.

## Examples

Check the [Gruntfile](https://github.com/Bartvds/gruntfile-gtx/blob/master/Gruntfile.js) for practical [dogfooding](https://en.wikipedia.org/wiki/Dogfooding) and [browse the tests](https://github.com/Bartvds/gruntfile-gtx/tree/master/test/spec) for some more options.

## Info

* Your gruntfile is still a regular gruntfile to run by `grunt-cli`. 
	* Main difference is to import and apply `gruntfile-gtx` on start if the Gruntfile.
	* Call `gtx.finalise()` at the end of the file to generate the config and apply aliases. 
* The extra API sugar like `gtx.loadNpm()` is optional, but is generally DRY-er then the regular versions.
* Use the `grunt -h` command to view the generated tasks.
* Generated aliases are prefixed with `gtx`, like `gtx-select:myAlias` or `gtx-group:dev`.
	* They run like any task created by `grunt.registerTask()`. 
	* For example run `$ grunt gtx-group:test`.versions. 
* String input uses a form of expansion and iteration where applicable.
	* Split strings on separators to array: `gtx.alias('name', 'one, two, three')`
	* Nested arrays are flattened and the content split: `gtx.alias('name', [['aa','bb'], 'cc', ['dd, ee'],'ff,gg,hh'])`  
	* Where grunt methods accept a single string the alias will iterate: `gtx.loadNpm([..])`

## Future

There a lot of ideas for this floating around, from auto-dependency chains and non-repeating macro util tasks, to globbing helpers to generate macro instances and flows adapting to custom cli parameters or env variables.

## API

:x: Yet undocumented. See the [Gruntfile](https://github.com/Bartvds/gruntfile-gtx/blob/master/Gruntfile.js) and [browse the tests](https://github.com/Bartvds/gruntfile-gtx/tree/master/test/spec) for examples.

# History

* ~0.0.2 - Various construction work.

## Vagrant

There is a Vagrantfile and set of Chef cookbooks to use with [Vagrant](http://www.vagrantup.com) for easy testing on a Linux VM. It will install a node.js from package, install the dependencies and enable grunt.

## License

Copyright (c) 2013 Bart van der Schoor

Licensed under the MIT license.