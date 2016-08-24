(function () {

    var fs = require('fs');
    var Utils = require('./utils.js');

    function ProcessCrashDump(filePath) {

        this.app = {
            name: false,
            uuid: false,
            offset: false,
            arch: false
        };

        if (filePath) {
            this.process(filePath);
        }
    }

    //--------------------------------------------------------------------------

    ProcessCrashDump.prototype.processMeta = function (fileCnt) {
        var fileCntEx = fileCnt.split("\n");
        var meta = JSON.parse(fileCntEx[0]);
        this.app.name = meta.app_name;
        this.app.uuid = Utils.uuid(meta.slice_uuid);
    };

    //--------------------------------------------------------------------------

    ProcessCrashDump.prototype.findBinaryImage = function (fileCnt) {
        var binImgEx = fileCnt.split("Binary Images:");
        var re = /(0x[a-fA-F0-9]+)\s+-\s+0x[a-fA-F0-9]+\s+(\S+)\s+(\S+)\s+\<([a-fA-F0-9]+)\> /gi;

        while ((found = re.exec(binImgEx[1])) !== null) {
            var foundOffset = found[1];
            var foundImage = found[2];
            var foundArch = found[3];
            var foundUUID = found[4];

            if ((foundImage === this.app.name) && (foundUUID === this.app.uuid)) {
                this.app.offset = foundOffset;
                this.app.arch = foundArch;
            }
        }
    };

    //--------------------------------------------------------------------------

    ProcessCrashDump.prototype.process = function (fileToRead) {
        var fileCnt = fs.readFileSync(fileToRead).toString();
        this.processMeta(fileCnt);
        this.findBinaryImage(fileCnt);
        return this.app;
    };

    //--------------------------------------------------------------------------

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ProcessCrashDump;
    }

}());