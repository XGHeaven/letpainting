/**
 * Created by XGHeaven on 2015/5/23.
 */

// warpper WebSokcet to my project

var WebSocket = require('faye-websocket'),
    utils = require('./utils');

var rawSend = WebSocket.prototype.send;

WebSocket.prototype.SIGN = {
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

WebSocket.prototype.reply = function(msg, data) {
    msg.$data = data;
    this.send(msg);

    return this;
};

WebSocket.prototype.error = function(msg, error) {
    msg.$method = 'error';
    msg.$data = error;
    this.send(msg);

    return this;
};

WebSocket.prototype.push = function(path, data) {
    var i = 0, pushData;

    console.log(this.status);
    if (this.status < this.SIGN.OPEN) {
        this.msgStash.push({
            $method: 'listen',
            $path: path,
            $id: utils.hash(),
            $data: data
        });
    } else if (this.status === this.SIGN.OPEN) {
        while (pushData = this.msgStash.shift()) {
            this.send(pushData);
        }
        this.send({
            $method: 'listen',
            $path: path,
            $id: utils.hash(),
            $data: data
        });
    }

    return this;
};

module.exports = WebSocket;
