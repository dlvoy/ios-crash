(function () {

    var fs = require('fs');
    
    //--------------------------------------------------------------------------
    
    var walk = function (dir, fileFilter) {
        var results = [];
        var list = fs.readdirSync(dir);

        list.forEach(function (file) {
            file = dir + '/' + file;
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(walk(file, fileFilter));
                if (fileFilter(file, stat)) {
                    results.push(file);
                }
            } else {
                if (fileFilter(file, stat)) {
                    results.push(file);
                }
            }
        });
        return results;
    };
    
    //--------------------------------------------------------------------------
    
    var endsWith = function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };
    
    //--------------------------------------------------------------------------
    
    var uuid = function(rawUUID) {
        return rawUUID.replace(/-/g, "").toLowerCase();
    };
    
   
    //--------------------------------------------------------------------------
    
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.walk = walk;
        module.exports.endsWith = endsWith;
        module.exports.uuid = uuid;
    }

}());

