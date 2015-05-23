/**
 * Created by XGHeaven on 2015/5/16.
 */

var WebSocket = require('ws'),
    ws = new WebSocket('ws://localhost:3000');

ws.on('open', function() {
    console.log('connect');
});

ws.sd = function(method, path, data) {
    ws.send(JSON.stringify({
        $method: method,
        $path: path,
        $data: data,
        $id: new Date().getTime()
    }));
};

module.exports = ws;
