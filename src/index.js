/**
 * Created by XGHeaven on 2015/5/16.
 */

var utils = require('./utils'),
    WebSocket = require('faye-websocket'),
    rawSend = WebSocket.prototype.send,
    // 100 200 300 400
    // 100 user verify error
    // 101 user repeat
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

WebSocket.prototype.send = function(data) {
    if (typeof data === 'object') {
        rawSend.call(this, JSON.stringify(data));
    } else {
        rawSend.call(this, data);
    }
    return this;
};

WebSocket.prototype.reply = function(path, data, msg) {
    var reply = {
        $data: data,
        $path: path,
        $id: msg.$id,
        $method: 'reply'
    };
    this.send(reply);

    return this;
};

WebSocket.prototype.give = function(path, data) {
    var give = {
        $data: data,
        $path: path,
        $method: 'listen'
    };

    this.send(give);

    return this;
};

WebSocket.prototype.error = function(error, data) {
    this.send({
        $method: 'error',
        $type: error,
        $data: data
    });

    return this;
};

function freeSocket(server, config) {

    var me = {
        // 0-init 1-opening 2-opened 3-verify 4-ready 5-closing 6-closed
        on: on,
        //config: config,
        create: create,
        post: post,
        get: get,
        //send: send,
        broadcast: broadcast,
        user: user
    };

    // events callback cache
    var evtCallbacks = {
        open: [function(){me.status = SIGN.OPEN}],
        message: [msgRouter],
        close: [closeSocket],
        error: [],
        ready: [function(){me.status = SIGN.READY;}]
    };

    // socket cache
    var sockets = {};

    // Routers
    var msgRouters = {
        get: {},
        post: [],
        listent: {}
    };

    // default config
    var configs = {
        userVerify: false
    };
    utils.extend(configs, config);

    var user = {
        count: function () { return Object.keys(sockets).length; },
        list: function() { return Object.keys(sockets); }
    };

    function on(name, callback, content) {
        if (name in evtCallbacks) evtCallbacks[name].push(callback);
        return this;
    }

    function register(method, path, callback) {
        var pathRegObj = utils.pathToReg(path);
        pathRegObj.callback = callback;
        msgRouters[method].push(pathRegObj);
    }

    // create a path
    function create(path, callback){
        register('listen', path, callback);
        return this;
    }

    function post(path, callback) {
        register('post', path, callback);
        return this;
    }

    function get(path, callback) {
        register('get', path, callback);
        return this;
    }

    function matchPath() {
        var i = 0,
            match = null;

        for (;i<msgRouters[this.$method].length;i++) {
            if (match = utils.handlePath(this.$path, msgRouters[this.$method][i])) {
                return msgRouters[this.$method][i].callback.call(this, match, this.$data);
            }
        }

        return false;
    }

    function closeSocket(evt){
        delete sockets[evt.target.socketID];
    }

    function send(socketID, path, data) {

        if (!(socketID in sockets)) return false;

        var reply = {
            $data: data,
            $path: path,
            $method: 'listen'
        };

        ws.send(JSON.stringify(reply));

        return true;
    }

    function broadcast(path, data) {
        var k,ws;

        for (k in sockets) {
            ws = sockets[k];
            ws.give(path, data);
        }

        return this;
    }

    function msgVerify(msg) {
        var id;
        if (configs.userVerify) {
            id = configs.userVerify.call(this, msg.$data, sockets);
        }

        console.log(id);

        if (id && !(id in sockets)) {
            this.send({
                $method: 'event',
                $type: 'verify',
                $data: true
            });
            sockets[this.socketID = id.toString()] = this;
            me.status = SIGN.VERIFY;
        } else {
            this.send({
                $method: 'event',
                $type: 'verify',
                $data: false
            })
        }
    }

    function invokeEvent(evtName, evt) {
        var i = 0,
            callbacks = evtCallbacks[evtName] || [];
        for (; i<callbacks.length; i++) {
            callbacks[i].call(me, evt);
        }
    }

    function innerEventRouter(msg) {
        switch (msg.$type) {
            case 'verify':
                ws.socketID === undefined && msgVerify.call(this,msg);
                break;
            case 'ready':
                invokeEvent('ready', msg.$data);
                break;
        }
    }

    function msgRouter(evt) {
        var returnData = null,
            ws = evt.target;
        // if data isn't json
        try {
            var msg = JSON.parse(evt.data);
        } catch(e) {
            // call user custom router
            customMsgRouter();
        }

        switch (me.status) {
            case SIGN.INIT:
                break;
            case SIGN.OPENING:
                break;
            case SIGN.OPEN:
                if (configs.userVerify && msg.$method !== 'event' && msg.$type !== 'verify') {
                    ws.error(SIGN,NEEDVERIFY);
                    return;
                }
                break;
            case SIGN.VERIFY:
                if (msg.$method !== 'event' && msg.$type !== 'ready') {
                    ws.error(SIGN.NEEDREADY);
                    return;
                }
                break;
            case SIGN.READY:
                break;
            case SIGN.CLOSING:
                break;
            case SIGN.CLOSED:
                break;
            default:
                break;
        }

        if (msg.$method) {
            switch(msg.$method) {
                case 'error':
                    break;
                case 'event':
                    innerEventRouter(msg);
                    break;
                case 'post':
                case 'get':
                    if (ws.socketID) returnData = matchPath.call(msg);
                    else {
                        ws.error(SIGN.NEEDVERIFY);
                        return;
                    }
                    break;
                case 'listen':
                default:
                    break;
            }

            if (returnData) {
                evt.target.reply(msg.$path, returnData, msg);
            }
        } else {
            customMsgRouter();
        }
    }

    function evtRouter(evt) {
        //var type = evt.type;

        //if (evtCallbaks) {
        //    events[type].forEach(function(callback) {
        //        callback.call(me, evt);
        //    });
        //}

        invokeEvent(evt.type, evt);
    }

    function customMsgRouter(){}

    server.on('upgrade', function(request, socket, body) {
        if (WebSocket.isWebSocket(request)) {
            var ws = new WebSocket(request, socket, body);

            console.log(ws);

            ws.on('open', evtRouter);
            ws.on('message', evtRouter);
            ws.on('close', evtRouter);
            ws.on('error', evtRouter);

            if (typeof configs.userVerify !== 'function') {
                sockets[ws.socketID = utils.hash()] = ws;
                console.log('have a id');
            }
        }
    });

    return me;
}

module.exports = freeSocket;