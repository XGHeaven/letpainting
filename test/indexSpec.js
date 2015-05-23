/**
 * Created by XGHeaven on 2015/5/16.
 */


var expect = require('chai').expect,
    socket = require('./createSocket').socket,
    server = require('./createSocket').server,
    ws = null;

describe('test Socket server', function() {
    it('to start 3000 port server', function(done) {
        server.listen(3000, function() {
            ws = require('./connSocket');
            done();
        });
    });

    it('ws should be connect socket from port 3000', function(done) {
        ws.onopen = function() {
            expect(ws.readyState).to.equal(ws.OPEN);
            done();
        }
    });
});

describe('test post data', function () {
    it('to post name:1 data', function (done) {
        socket.post('path', function (param, data) {
            expect(data).to.deep.equal({name: 1});
            done();
        });
        ws.sd('post', 'path', {name: 1});
    })
});

//ws.sd('post','path',{name:1});

var ws = new WebSocket(server, {
    transfer: {
        post: {
            host: 'localhost',
            port: '80'
        },
        get: {
            host: 'localhost',
            port: '8080'
        },
        listen: {
            url: 'listen'
        }
    }
});

ws.on('ready', function(ws, data) {
    console.log(data);
});

ws.post('name', function(ws, parma, data) {
    console.log(arguments);
});

ws.get('name', function(ws, param, data) {
    console.log(arguments);
});

ws.on('listen', function(ws, data) {
    console.log(data);
});

ws.on('open', function(ws, data) {
    console.log(data);
});

ws.on('close', function(ws, data) {
    console.log(data);
});

ws.get('user/info/:id', function(ws, param, data) {
    consoe.log(arguments);
});

ws.broadcast('path/to/num', data);