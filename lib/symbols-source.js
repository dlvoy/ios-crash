(function () {

    var chalk = require('chalk');
    var execSync = require('child_process').execSync;
    var shellescape = require('shell-escape');
    var filepath = require('filepath');

    var Utils = require('./utils.js');

    //--------------------------------------------------------------------------

    var uuidRegEx = /UUID\:\s+([a-fA-F0-9-]+)\s+\(([a-zA-Z0-9]+)\)/mgi;
    var dsymBinRegEx = /.*\/Contents\/Resources\/DWARF\/.*/g;

    //--------------------------------------------------------------------------

    function SymbolsSource(dumpDir, program) {
        this.sources = {};
        this.source = false;
        this.dumpDir = dumpDir;
        this.program = program;
    }

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.filterUserArchives = function (username) {
        return Utils.walk('/Users/' + username + '/Library/Developer/Xcode/Archives', function (filename, stat) {
            return stat.isDirectory() && Utils.endsWith(filename, '.xcarchive');
        });
    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.filterLocalSymbols = function (relativeDir) {
        return Utils.walk(relativeDir, function (filename, stat) {
            return stat.isDirectory() && Utils.endsWith(filename, '.dSYM');
        });
    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.filterLocalApps = function (relativeDir) {
        return Utils.walk(relativeDir, function (filename, stat) {
            return stat.isDirectory() && Utils.endsWith(filename, '.app');
        });
    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.extractImageUUID = function (appSymbolBinary) {
        try {

            var stdout = execSync(shellescape(['dwarfdump', '--uuid', appSymbolBinary]), {stdio: [null, 'pipe', null]});
            while ((found = uuidRegEx.exec(stdout)) !== null) {
                var uuid = Utils.uuid(found[1]);
                var arch = found[2];
                this.sources[uuid] = {
                    "uuid": uuid,
                    "arch": arch,
                    "file": appSymbolBinary
                };
            }
            ;
        } catch (e) {
        }
    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.searchInSymbols = function (symbolDirs) {

        var self = this;
        symbolDirs.forEach(function (dir) {

            var appFiles = Utils.walk(dir, function (filename) {
                return filename.match(dsymBinRegEx);
            });

            appFiles.forEach(function (appSymbolBinary) {
                self.extractImageUUID(appSymbolBinary);
            });

        });

    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.searchInApp = function (appDirs, appInfo) {

        var self = this;
        appDirs.forEach(function (dir) {

            var path = filepath.create(dir).append(appInfo.name);
            if (path.exists()) {
                self.extractImageUUID(path.toString());
            }
            ;

        });

    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.matchApp = function (app) {
        this.source = false;
        if (typeof this.sources[app.uuid] !== "undefined") {
            if (this.sources[app.uuid].arch === app.arch) {
                this.source = this.sources[app.uuid];
            }
        }
        return this.source;
    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.trySymbols = function () {
        if (this.source === false) {
            if (this.program.verbose) {
                console.log(chalk.white("Searching in local .dSYM packages...\n"));
            }
            this.searchInSymbols(this.filterLocalSymbols(this.dumpDir));
            this.matchApp(this.program.appInfo);
        }
    };


    //--------------------------------------------------------------------------

    SymbolsSource.prototype.tryApps = function () {
        if (this.source === false) {
            if (this.program.verbose) {
                console.log(chalk.white("Searching in local .app packages...\n"));
            }
            this.searchInApp(this.filterLocalApps(this.dumpDir), this.program.appInfo);
            this.matchApp(this.program.appInfo);
        }
    };
    
    //--------------------------------------------------------------------------

    SymbolsSource.prototype.tryArchives = function () {
        if (this.source === false) {
            if (this.program.verbose) {
                console.log(chalk.white("Searching in luser .xcarchive packages...\n"));
            }
            this.searchInSymbols(this.filterUserArchives(this.program.username));
            this.matchApp(this.program.appInfo);
        }
    };

    //--------------------------------------------------------------------------

    SymbolsSource.prototype.symbolicate = function (dumpFile, appInfo) {
        return execSync(shellescape([
            'xcrun', 'atos',
            '-o', this.source.file,
            '-arch', appInfo.arch,
            '-l', appInfo.offset,
            '-f', dumpFile]), {stdio: [null, 'pipe', process.stderr]}).toString();
    };

    //--------------------------------------------------------------------------

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SymbolsSource;
    }

}());