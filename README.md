sfdx-coverage
=================

Calculate Salesforce code coverage levels.

Expects you to already have a default scratch org configured for the environment that already holds a copy of all of your code as well as having Lightning Testing Service v1.4 installed. Also expects [nyc](https://www.npmjs.com/package/nyc) to be installed and available from the command line.

To retrieve coverage you'll want to run a few commands:
1. `sfdx coverage:ltng:instrument -r force-app -d lib-cov` Instrument all of the Aura bundles in your application directory and place instrumented code into the `lib-cov` directory of your project. Also adds zero coverage files to the `.nyc-output` directory so you can report 0 coverage for anything not touched.
2. `sfdx force:mdapi:deploy -d lib-cov -w 15` push the instrumented code, and an adjustment to Lightning Testing Service, up to the default org
3. `sfdx coverage:ltng:cover -a TestApp.app` run LTS and collect coverage data, saving coverage information into `.nyc-output` directory
4. `nyc report` consume the generated data and report coverage levels.

[![Version](https://img.shields.io/npm/v/sfdx-coverage.svg)](https://npmjs.org/package/sfdx-coverage)
[![CircleCI](https://circleci.com/gh/aheber/sfdx-coverage/tree/master.svg?style=shield)](https://circleci.com/gh/aheber/sfdx-coverage/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/aheber/sfdx-coverage?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-coverage/branch/master)
[![Codecov](https://codecov.io/gh/aheber/sfdx-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/aheber/sfdx-coverage)
[![Greenkeeper](https://badges.greenkeeper.io/aheber/sfdx-coverage.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/aheber/sfdx-coverage/badge.svg)](https://snyk.io/test/github/aheber/sfdx-coverage)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-coverage.svg)](https://npmjs.org/package/sfdx-coverage)
[![License](https://img.shields.io/npm/l/sfdx-coverage.svg)](https://github.com/aheber/sfdx-coverage/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-coverage
$ sfdx-coverage COMMAND
running command...
$ sfdx-coverage (-v|--version|version)
sfdx-coverage/0.0.0 win32-x64 node-v8.9.4
$ sfdx-coverage --help [COMMAND]
USAGE
  $ sfdx-coverage COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx-coverage coverage:ltng:cover [FILE]`](#sfdx-coverage-coverageltngcover-file)
* [`sfdx-coverage coverage:ltng:instrument [FILE]`](#sfdx-coverage-coverageltnginstrument-file)

## `sfdx-coverage coverage:ltng:cover [FILE]`

Prints a greeting and your org id(s)!

```
USAGE
  $ sfdx-coverage coverage:ltng:cover [FILE]

OPTIONS
  -a, --appname=appname                           name of your Lightning test application
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234

  $ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [src\commands\coverage\ltng\cover.ts](https://github.com/aheber/sfdx-coverage/blob/v0.0.0/src\commands\coverage\ltng\cover.ts)_

## `sfdx-coverage coverage:ltng:instrument [FILE]`

Prints a greeting and your org id(s)!

```
USAGE
  $ sfdx-coverage coverage:ltng:instrument [FILE]

OPTIONS
  -d, --outputdir=outputdir                       (required) output path for instrumented files
  -r, --rootdir=rootdir                           (required) project root directory
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
  
  $ sfdx hello:org --name myname --targetusername myOrg@example.com
     Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [src\commands\coverage\ltng\instrument.ts](https://github.com/aheber/sfdx-coverage/blob/v0.0.0/src\commands\coverage\ltng\instrument.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
