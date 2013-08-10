# gruntfile-gtx

> Turbo, spoilers and a sunroof for your Gruntfile. 

:rocket: Gruntfile-gtx is a [Grunt](http://www.gruntjs.com) enhancement wrapper to make gruntfile task management more dynamic and powerful. It makes defining complex plugin and task setups easier while keeping your Gruntfle DRY. 

:warning: The project is under construction so use with care. The current state was mutated organically and lacks unit tests. This will be refactored and improved as we go.

:bangbang: Code not be published yet!

## Features

* Use macros to generate chains of plugin tasks with parameter reuse.
* Use tags to group and select similar targets.
* Create new aliases by selecting tasks and macros on various fields.
* Transparently streamline the gruntfile api.

The most powerful feature is the macro definition that is used to define sets of plugins targets that share naming or data fields. Use this to generate aliased bundles of tasks easily. Then use the selector to easily create aliases.

## Case example:

Assume you have a project split into modules where each module can be build and tested separately. 

* This requires running a plugin chain of the module source, like: clean, lint, compile, test, compress, generate docs etc.
* In a regular gruntfile this will mean maintaining a grunt config object that repeats configuration data in different places: it requires to duplicate fields like paths and identifiers to each plugin and target's sub-configuration.
* With a gruntfile-gtx you can define this partial plugin order as a macro that accepts shared parameters, and use this to generate the configuration options for the sub-chain of plugins.
* When you use the macro you give the instance an alias name and pass your custom fields. The macro then will generate the appropriate grunt configuration elements and alias the chain as a new task.
* Use these as-is or apply a selector query to make new aliases: this makes it easy to select a few specific tasks for debugging.

## Info

* All generated tasks and aliases are prefixed with `gtx`, like `gtx-select:myAlias`, `gtx-group:dev`. They run like any task created by `grunt.registerTask()`; for example run `grunt gtx-group:dev`.
* Use the `grunt -h` command to view the generated tasks.
* Transparent wrapper: your gruntfile is still a regular gruntfile. Only difference is you initialise `gruntfile-gtx` first and later call `gtx.init()` instead of `gtx.initConfig()`. 
* The extra API sugar (like `gtx.loadNpm()`) is optional, but is generally DRY-er then the regular versions.
* Where grunt accepts arrays of strings gtx will also accepts a single string to split on seperators: `gtx.alias('name', 'one, two, three')`.

## License

Copyright (c) 2013 Bart van der Schoor

Licensed under the MIT license.