sfdx-coverage
=================

# THIS IS ALPHA LEVEL, STILL FIGURING THINGS OUT, YOU HAVE BEEN WARNED

[![Version](https://img.shields.io/npm/v/sfdx-coverage.svg)](https://npmjs.org/package/sfdx-coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/aheber/sfdx-coverage/badge.svg)](https://snyk.io/test/github/aheber/sfdx-coverage)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-coverage.svg)](https://npmjs.org/package/sfdx-coverage)
[![License](https://img.shields.io/npm/l/sfdx-coverage.svg)](https://github.com/aheber/sfdx-coverage/blob/master/package.json)

<!--
[![CircleCI](https://circleci.com/gh/aheber/sfdx-coverage/tree/master.svg?style=shield)](https://circleci.com/gh/aheber/sfdx-coverage/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/aheber/sfdx-coverage?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-coverage/branch/master)
[![Codecov](https://codecov.io/gh/aheber/sfdx-coverage/branch/master/graph/badge.svg)](https://codecov.io/gh/aheber/sfdx-coverage)
[![Greenkeeper](https://badges.greenkeeper.io/aheber/sfdx-coverage.svg)](https://greenkeeper.io/)
-->

<!-- toc -->
* [THIS IS ALPHA LEVEL, STILL FIGURING THINGS OUT, YOU HAVE BEEN WARNED](#this-is-alpha-level-still-figuring-things-out-you-have-been-warned)
<!-- tocstop -->
<!-- install -->
<!-- usage -->


### Install the package in development mode:
1. Clone this repository to your machine
2. Navigate to the directory
3. Type `sfdx plugins:link` to register the plugin


### Calculate Salesforce code coverage levels.

Expects you to already have a default scratch org configured for the environment that already holds a copy of all of your code as well as having Lightning Testing Service v1.4 installed. Also expects [nyc](https://www.npmjs.com/package/nyc) to be installed and available from the command line.

To retrieve coverage you'll want to run a few commands:
1. `sfdx coverage:ltng:instrument -r force-app -d lib-cov` Instrument all of the Aura bundles in your application directory and place instrumented code into the `lib-cov` directory of your project. Also adds baseline coverage files to the `.nyc-output` directory so you can report 0 coverage for anything not touched.
2. `sfdx force:mdapi:deploy -d lib-cov -w 15` push the instrumented code, and an adjustment to Lightning Testing Service, up to the default org
3. `sfdx coverage:ltng:cover -a TestApp.app` run LTS and collect coverage data, saving coverage information into `.nyc-output` directory
4. `nyc report` consume the generated data and report coverage levels.


<!-- 
NOT LISTED ON NPM AT THIS TIME
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
-->
<!-- usagestop -->
<!-- commands -->
* [`sfdx-coverage coverage:ltng:cover`](#sfdx-coverage-coverageltngcover)
* [`sfdx-coverage coverage:ltng:instrument`](#sfdx-coverage-coverageltnginstrument)

## `sfdx-coverage coverage:ltng:cover`

should be used as a replacement for force:lightning:test:run that also retrieves coverage information

```
USAGE
  $ sfdx-coverage coverage:ltng:cover

OPTIONS
  -a, --appname=appname                           appname
  -d, --outputdir=outputdir                       outputdir
  -f, --configfile=configfile                     configfile
  -o, --leavebrowseropen=leavebrowseropen         leavebrowseropen
  -r, --resultformat=resultformat                 [default: human] resultformat
  -t, --timeout=timeout                           [default: 60000] timeout
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx coverage:ltng:cover -a TestApp.app --configfile config/lts.json
```

_See code: [src\commands\coverage\ltng\cover.ts](https://github.com/aheber/sfdx-coverage/blob/v0.0.0/src\commands\coverage\ltng\cover.ts)_

## `sfdx-coverage coverage:ltng:instrument`

Uses istanbul to instrument your aura bundles inside of an SFDX project directory with some special sauce to make them Lightning compatible. Must still be uploaded to Salesforce.

```
USAGE
  $ sfdx-coverage coverage:ltng:instrument

OPTIONS
  -d, --outputdir=outputdir                       (required) output path for instrumented files
  -r, --rootdir=rootdir                           (required) project root directory
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  $ sfdx coverage:ltng:instrument -r force-app -d lib-cov
```

_See code: [src\commands\coverage\ltng\instrument.ts](https://github.com/aheber/sfdx-coverage/blob/v0.0.0/src\commands\coverage\ltng\instrument.ts)_
<!-- commandsstop -->