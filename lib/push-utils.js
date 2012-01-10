var onCompleteBody = function (fn) {
    return function (res) {
        var body = "";
        res.setEncoding ("utf8");
        res.on ("data", function (chunk) {
            body += chunk;
        });
        res.on ("end", function () {
            fn(res.statusCode, body, res.headers);
        });
    };
};

var reRequire = function (moduleName) {
    var requireString = moduleName;
    if (moduleName[0] == ".") moduleName = moduleName.slice (1);
    if (moduleName[0] == "/") moduleName = moduleName.slice (1);
    var module;
    for (module in require.cache) {
        if (require.cache.hasOwnProperty(module)) {
            if (module.search(moduleName) !== -1) {
                delete require.cache[module];
            }
        }
    };
    return require(requireString);
};

exports.onCompleteBody = onCompleteBody;
exports.reRequire = reRequire;