(function () {

    var fileToProcess = false;
    var appDir = false;

    var chalk = require('chalk');
    var program = require('commander');
    var filepath = require('filepath');

    var ProcessCrashDump = require('./process-crash-dump.js');
    var SymbolsSource = require('./symbols-source.js');

    var isMacOSX = /^darwin/.test(process.platform);

    require('pkginfo')(module, 'version');

    exports.run = function () {

        if (!isMacOSX) {
            console.log(chalk.red("Works only on Mac!"));
            process.exit();
        }

        program
                .version(module.exports.version)
                .usage('[options] <crashDumpFile> [appDir]')
                .option('-v, --verbose', 'Be verbose and log all steps to console', false)
                .option('-o, --output <value>', 'Save symbolicated dump log to specified file (instead of stdout)', false)
                .action(function (crashDumpFile, appDirOpt) {
                    fileToProcess = crashDumpFile;
                    if (appDirOpt) {
                        appDir = appDirOpt;
                    }
                })
                .parse(process.argv);


        //----------------------------------------------------------------------

        program.fileToProcess = fileToProcess;
        program.appDir = appDir;
        program.version = module.exports.version;
        program.username = process.env['USER'];

        //----------------------------------------------------------------------

        if (!program.fileToProcess) {

            console.log(chalk.underline.yellow("Please specify iOS Crash Dump file to process"));
            program.outputHelp();
            process.exit();

        } else {

            var file = filepath.create(program.fileToProcess);

            if (!file.exists()) {
                console.log(chalk.yellow("Specified input iOS Crash Dump file does not exists! ") + chalk.white(program.fileToProcess));
                process.exit();
            }

            if (program.verbose) {
                console.log(chalk.yellow("Processing file: ") + chalk.white(program.fileToProcess));
                console.log();
            }

            program.appInfo = new ProcessCrashDump(program.fileToProcess).app;
            if (program.appInfo.offset !== false) {
                if (program.verbose) {
                    console.log(chalk.yellow("Detected App details: "));
                    console.log(program.appInfo);
                    console.log();
                }
            } else {
                console.log(chalk.red("App not found!"));
                process.exit();
            }

            program.source = new SymbolsSource(file.dir().toString(), program);

            program.source.trySymbols();
            program.source.tryApps();
            program.source.tryArchives();

            if (program.source.source !== false) {
                
                if (program.verbose) {
                    console.log(chalk.yellow("Found matching symbols source: "));
                    console.log(program.source.source);
                    console.log();
                }

                var symbolicated = program.source.symbolicate(program.fileToProcess, program.appInfo);

                if (!((program.output === false) || (program.output === 0))) {
                    var path = filepath.create(program.output);
                    path.write(symbolicated, {sync: true});
                    if (program.verbose) {
                        console.log(chalk.green("Symbolicated dump saved to: ") + chalk.white(program.output));
                    }
                } else {
                    if (program.verbose) {
                        console.log(chalk.green("Symbolicated error dump: "));
                    }
                    console.log(symbolicated);
                }

            } else {
                console.log(chalk.red("Symbols (dSYM, app, Archive) for UUID <" + program.appInfo.uuid + "> not found!"));
                process.exit();
            }
        }
    };

}).call(this);