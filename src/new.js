/**
 * Created by XGHeaven on 2015/5/23.
 */


// remember you task is compatible ajax and websocket
// so you must can transfer cookie and header and other http header

var WebSocket = require('./wrapperSocket'),
    utils = require('./utils'),
    request = require('request'),
    url = require('url'),
    SIGN = {
        INIT: 0,
        OPENING: 1,
        OPEN: 2,
        VERIFY: 3,
        READY: 4,
        CLOSING: 5,
        CLOSED:6,
        NEEDVERIFY: 103,
        NEEDREADY: 104
    };


function freeSocket(server, config) {
    var me = {
        listen: listen,
        on: on,
        get: get,
        post: post,
        broadcast: broadcast
    };

    var evtCallbacks = {
        open: []
    };

    var msgCallbacks = {
        post: [],
        get: []
    };

    var cfg = {
        // start server with own nodejs to compatible the old website
        server: false,
        default: {
            url: {
                protocol: 'http:'
            }
        }
    };

    var sockets = {};

    utils.extend(cfg, config);

    // resolve path
    if (cfg.transfer && cfg.transfer.get && !cfg.transfer.get.href) {
        cfg.transfer.get.href = url.format(utils.extend({},cfg.default.url,cfg.transfer.get));
    }
    if (cfg.transfer && cfg.transfer.post && !cfg.transfer.post.href) {
        cfg.transfer.post.href = url.format(utils.extend({},cfg.default.url,cfg.transfer.post));
    }

    // create server
    //if (cfg.server) {
        //server.createServer(function(req,res) {
        //    body(req, res, {}, function(err, body) {
        //        console.log(body);
        //    });
        //});
    //}


    // imitate listen method by socket
    function listen(port, callback) {
        server.listen(port, callback);
    }

    function on(evt, callback) {
        if (evtCallbacks.hasOwnProperty(evt)) {
            evtCallbacks[evt].push(callback);
        } else {
            evtCallbacks[evt] = [];
            evtCallbacks[evt].push(callback);
        }

        return this;
    }

    function get(path, callback) {
        register('get', path, callback);
        return this;
    }

    function post(path, callback) {
        register('post', path, callback);
        return this;
    }

    function broadcast(path, data) {
        var k;

        for (k in sockets) {
            sockets[k].push(path, data);
        }

        return this;
    }

    // create socket to bind server
    server.on('upgrade', function(req, socket, body) {
        if (WebSocket.isWebSocket(req)) {
            var ws = new WebSocket(req, socket, body);

            ws.on('open', rawEvtRouter);
            ws.on('message', rawEvtRouter);
            ws.on('close', rawEvtRouter);
            ws.on('error', rawEvtRouter);

            ws.status = SIGN.OPENING;
            ws.msgStash = [];
        }
    });

    // inner function

    // raw WebSokcet Event Router
    function rawEvtRouter(evt) {
        var ws = evt.target;

        switch (evt.type) {
            case 'error':
                break;
            case 'open':
                break;
            case 'message':
                msgRouter.call(me, evt);
                break;
            case 'close':
                // set status and delete connection
                ws.status = ws.SIGN.CLOSED;
                delete sockets[ws.socketID];
                break;
            default:
                break;
        }
    }

    function msgRouter(evt) {
        var ws = evt.target, msg = null;

        try {
            msg = JSON.parse(evt.data);
        } catch(e) {
            ws.error(msg, SIGN.NO);
            return false;
        }

        // filter message
        switch (ws.status) {
            case SIGN.OPENING:
                if (msg.$type !== 'open') {
                    ws.error(msg, SIGN.NOOPEN);
                    return false;
                }
                break;

            default:
                if (msg.$method === 'open') {
                    ws.error(msg, SIGN.OPENED);
                    return false;
                }
        }

        switch (msg.$method) {
            case 'error':
                break;
            case 'event':
                evtRouter.call(me, evt, msg);
                break;
            case 'get':
                getMethodRouter.call(me, evt, msg);
                break;
            case 'post':
                getMethodRouter.call(me, evt, msg);
                break;
            case 'listen':
                break;
            default:
                break;
        }
    }

    // custom event router
    function evtRouter(evt, msg) {
        var ws = evt.target,
            data;

        switch (msg.$type) {
            case 'open':
                data = invokeEvent('open', ws, msg.$data);
                if (data !== undefined) {
                    ws.socketID = data.toString();
                } else {
                    ws.socketID = utils.hash();
                }
                sockets[ws.socketID] = ws;
                ws.status = ws.SIGN.OPEN;
                break;
            default:
                invokeEvent(msg.$type, ws, msg.$data);
        }

        return false;
    }

    // could accept many param and transfer the n-1 to callback
    function invokeEvent(evtName) {
        var params = Array.prototype.slice.call(arguments, 1),
            callbacks, i, data;

        if (evtCallbacks.hasOwnProperty(evtName)) {
            callbacks = evtCallbacks[evtName];
            for (i=0; i<callbacks.length; i++) {
                data = callbacks[i].apply(me, params);
            }
        } else {
            return false;
        }

        return data;
    }

    function register(method, path, callback) {
        var pathRegObj = utils.pathToReg(path);
        pathRegObj.callback = callback;
        msgCallbacks[method].push(pathRegObj);
    }

    function getMethodRouter(evt, msg) {
        var path = msg.$path,
            type = msg.$method,
            ws = evt.target,
            pathInfo, replyData, typeCfg;

        if (pathInfo = matchPath(type, path)) {
            // invoke with ws, params, data
            replyData = pathInfo.callback.call(me, evt.target, pathInfo.params, msg.$data);
            if (replyData) {
                ws.reply(msg, replyData);
            }
        } else {
            if (cfg.transfer[type]) {
                typeCfg = cfg.transfer[type];
            } else {
                ws.error(msg, 404);
            }

            request[type]({
                url: url.resolve(type.cfg.href, path),
                form: msg.$data
            }, function(err, header, body) {
                if (err) {
                    ws.error(msg, 404);
                }
                try {
                    body = JSON.parse(body);
                } catch(e) { }

                ws.reply(msg, body);
            });
        }


        return true;
    }

    // match message path and return object include id in array and callback and params
    function matchPath(type, path) {
        var i = 0,
            match = null,
            callback = msgCallbacks[type];

        for (;i<callback.length;i++) {
            if (match = utils.handlePath(path, callback[i])) {
                return {
                    id: i,
                    params: match,
                    callback: callback[i].callback
                }
            }
        }

        return false;
    }

    return me;
}

module.exports = freeSocket;
