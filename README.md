# gruntfile-gtx

> Turbo, spoilers and a sunroof for your Gruntfile. 

Gruntfile-gtx is a [Grunt](http://www.gruntjs.com) enhancement wrapper to make gruntfile task management more dynamic and powerful. Defining complex plugin and task setups while keeping your Gruntfile DRY.

:warning: The project is under construction so use with care. The current state was mutated organically and lacks unit tests. This will be refactored and improved as we go.

:bangbang: Code not be published yet!

## Features

* Transparently streamline the gruntfile api.
* Use macros to generate chains of related plugin tasks.
* Use tags to group and select similar targets.
* Create new aliases by filtering tasks on various fields.

The most powerful feature is the macro definition that is used to define chains of targets for different plugins that together define a sub build-process. Using this makes it easy to share parameters like identifiers, (partial) paths etc to create different instances of the macro. 

## Macro use-case

Assume you have a project split into modules where each module can also be build and tested separately. 

* This requires running a plugin chain of the module source. For example: clean, lint, compile, test, compress, generate docs etc.
* In a regular gruntfile this will mean maintaining a grunt config object that repeats configuration data in different places: it requires to duplicate fields like paths and identifiers to each target configuration. This boring but not DRY.
* With gruntfile-gtx you can define this partial plugin order as a macro that accepts shared parameters, generates the configuration and adds as an alias.
* When you use the macro you give the instance an alias name and pass your custom fields. The macro then will generate the appropriate grunt configuration elements and alias the chain as a new task.
* Use these as-is or apply a selector query to make new aliases: for example select a few specific tasks for debugging. It can be used like any other alias. Call it from command line, link it from your IDE.

## Info

* All generated aliases are prefixed with `gtx`, like `gtx-select:myAlias`, `gtx-group:dev`. They run like any task created by `grunt.registerTask()`. For example run `$ grunt gtx-group:dev`.
* Use the `grunt -h` command to view the generated tasks.
* Gtx works as a open facade: your gruntfile is still a regular gruntfile. Only difference is you import `gruntfile-gtx` and instead of `grunt.initConfig()` call `gtx.finalise()` to generate the config and apply aliases. 
* The extra API sugar like `gtx.loadNpm()` is optional, but is generally DRY-er then the regular versions: where grunt originally accepts arrays of strings gtx's version will also accepts a single string to split on seperators: `gtx.alias('name', 'one, two, three')`.

## License

Copyright (c) 2013 Bart van der Schoor

Licensed under the MIT license.