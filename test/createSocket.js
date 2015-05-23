/**
 * Created by XGHeaven on 2015/5/16.
 */

var fresSocket = require('../src/index'),
    http = require('http'),
    server = http.createServer(),

    socket = new fresSocket(server);

//server.listen(3000);

//socket.on('connect', function(){
//    console.log('connect a user');
//});

//socket.post('path', function(){
//    console.log('createSocket file path', arguments);
//    return {name:2}
//});

//setInterval(function(){
//    socket.broadcast('path', new Date());
//    console.log('broadcase');
//},2000);

exports.socket = socket;
exports.server = server;
