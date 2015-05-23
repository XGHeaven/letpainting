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
    //express = require('express'),
    //app = express(),

    socket = new fresSocket(server, {
    });

server.listen(3000);

socket.on('open', function(ws, data){
    console.log('open',data);
    return data.id;
});

socket.post('name', function(ws, params, data) {
    console.log(data);
    return data;
});

socket.post('path/:id', function(ws, params, data) {
    socket.broadcast('path', {
        user: params.id,
        data: data
    });
    console.log(data);
    return data;
});

//socket.on('message', function(evt) {
//    console.log(evt.data);
//});

//socket.post('message/:user', function(match, data){
//    console.log('createSocket file path', arguments);
//    data.user = match.user;
//    socket.broadcast('message', data);
//    return data;
//});
//
//socket.on('open', function(evt) {
//    socket.broadcast('user/count', socket.user.count());
//    socket.broadcast('user/list', socket.user.list());
//});

//setInterval(function(){
//    socket.broadcast('path', new Date());
//    console.log('broadcase');
//},2000);
