/**
 * utils for free-socket
 * Created by XGHeaven on 2015/5/15.
 */

var pathItemReg = /:\w*/gi;

var url = require('url');

function pathToReg(path) {
    if (!path || typeof path !== 'string') { return false; }
    // name stack
    var name = [],
        // repeat flag
        repeat = false,
        reg = null,

        pathRegString = path.replace(pathItemReg, function(pattern, index, raw) {
            if (!repeat) {
                if (name.indexOf(pattern.slice(1)) !== -1) {
                    repeat = true;
                } else {
                    name.push(pattern.slice(1));
                }
            }
            return '(\\w*)';
        });

    if (repeat) { return false; }

    try {
        reg = new RegExp('^' + pathRegString + '$');
    }catch(e) {
        return false;
    }

    // analysis name in path and create reg
    return {
        name: name,
        reg: reg
    }
}

function handlePath(path, pathObj) {
    var i = 0, result = {},
        match = path.match(pathObj.reg);

    if (!match || ((match=match.slice(1)) && match.length !== pathObj.name.length)) {
        return false;
    }

    for (;i<match.length;i++) {
        result[pathObj.name[i]] = match[i];
    }

    return result;
}

function hash() {
    return new Date().getTime().toString().slice(6) + parseInt(Math.random() * 99);
}

exports.extend = function(obj) {
    var i = 1,k;
    for (;i<arguments.length;i++) {
        for (k in arguments[i]) {
            obj[k] = arguments[i][k];
        }
    }
    return obj;
};

exports.parseUrl = function(cfg, path) {
    // cfg is a object with host and port method
    // path is a string relative
    
};

exports.pathToReg = pathToReg;
exports.handlePath = handlePath;
exports.hash = hash;