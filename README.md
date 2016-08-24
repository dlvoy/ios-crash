# iOS Crash Dump symbolicating tool

[![license](https://img.shields.io/github/license/dlvoy/ios-crash.svg)](https://github.com/dlvoy/ios-crash/blob/master/LICENSE)
[![NPM version](http://img.shields.io/npm/v/ios-crash.svg?style=flat)](https://www.npmjs.com/package/ios-crash)
[![Dependencies Status](http://img.shields.io/david/dlvoy/ios-crash.svg?style=flat)](https://david-dm.org/dlvoy/ios-crash)

**ios-crash** is command line tool to symbolicate iOS crash dump. It translates raw memory addresses in dump stack trace to method/file/line references, helpful while debugging.

## Background

Crash dump is snapshot from application state, created by iOS at the moment of crash.
It allows developers to further analyze the problem, and to find its source.

Unfortunately, distributed app binaries are 'stripped' - all development related informations (debug symbols) are removed. Because of that, crash dumps lacks important references (like: source code file names and line numbers), showing cryptic memory addresses instead.

To recover debug informations, we can reverse the process, and annotate crash dumps - this process is called symbolicating.

## Requirements

To symbolicate dump we need source of symbols - it can be not stripped app bundle (*.app), debug symbols bundle (*.dSYM) or XCode app archive (*.xcarchive).

This tool require also MacOS X system and installed XCode.

## Setup

* install [Node.JS](https://nodejs.org) (if not already installed)
* from command line execute:

```sh
$ npm install -g ios-crash 
``` 

## Usage

```sh
$ ios-crash [options] [path_to_crash_dump_file]
``` 

For full list of supported options execute:
```sh
$ ios-crash -h
``` 

This tool will parse specified dump file, detect app parameters (name, UUID and architecture) and search matching debug symbols source.

It first search for dSYM, app and xcarchive in dump file directory, then search for xcarchive in default Archivers directory of current user.

Symbolicated dump is written to the console or (if configured) to specified output file.

## Options

All options are *optional*. When not specified, they are *ignored* or have *default value*.
Boolean options are *true* if flag is present, *false* otherwise.

Option                                   | Type        
---                                      | :---:  
[`-o`, `--output`](#option-output)       | `File path`            
[`-v`, `--verbose`](#option-verbose)     | `Boolean`    
[`-h`, `--help`](#option-help)           | `Boolean`   
[`-V`, `--version`](#option-version)     | `Boolean`   

### Option output

If set, specifies output file to witch resulting, symbolicated dump will be saved.
If not provided (default), results are written to standard output stream (stdout).

### Option verbose

If set, details of processing is logged into console.

### Option help

Displays all options with short description.

### Option version

Displays version of application (match NPM/Git version number).