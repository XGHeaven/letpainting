/**
 * Created by XGHeaven on 2015/5/17.
 */

var fresSocket = require('../src/new'),
    http = require('http'),
    body = require('body/any'),
    server = http.createServer(function(req, res) {
        body(req, res, {}, function(err, body) {
            console.log(err, body);
        });
        res.end();
    }),
    express = require('express'),
    app = express(),
    //express = require('express'),
    //app = express(),

    socket = new fresSocket(server, { });

server.listen(3000);

socket.on('open', function(ws, data){
    return data.id;
});

socket.on('ready', function(ws) {
    console.log(ws.socketID, 'ready');
    socket.restash(ws);
});

socket.post('name', function(ws, params, data) {
    return data;
});

socket.post('clear', function(ws, params, data) {
    socket.clearStash();
    socket.broadcast('clear');
});

socket.post('path/:id', function(ws, params, data) {
    socket.broadcastOther('path', {
        user: params.id,
        data: data
    }, ws, true);
    return data;
});

socket.on('close', function(ws) {
});

app.post('/')