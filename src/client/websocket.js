/**
 * Created by XGHeaven on 2015/5/16.
 */

+function(window) {
    var rawSend = WebSocket.prototype.send;

    WebSocket.prototype.send = function(data) {
        if (typeof data === 'object') {
            rawSend.call(this, JSON.stringify(data));
        } else {
            rawSend.call(this, data);
        }
        return this;
    };

    WebSocket.prototype.push = function(method, path, data, id) {
        var pushData = {
            $method: method,
            $path: path,
            $data: data,
            $id: id
        };

        this.send(pushData);

        return this;
    };

    function hash() {
        return new Date().getTime().toString().slice(6) + parseInt(Math.random()*99);
    }

    function extend(obj) {
        var i= 1, k;
        for (;i<arguments.length;i++) {
            for (k in arguments[i]) {
                obj[k] = arguments[i][k];
            }
        }
        return obj;
    }

    // key-value callbacks map
    function CallbackMap(){}
    CallbackMap.prototype.invoke = function(key) {
        if (key in this) {
            return this[key].apply(null, arguments.slice(1));
        }

        return false;
    };
    CallbackMap.prototype.invokeOnce = function(key) {
        var result = false;
        if (key in this) {
            result = this[key].apply(null, Array.prototype.slice.call(arguments, 1));
            delete this[key];
        }

        return result;
    };

    // array callbacks
    function CallbackCollection(){}
    CallbackCollection.prototype.invokeAll = function() {
        var i=0;
        for (;i<this.length;i++) {}
    };

    window.fws = function(url, config) {
        var msgCallbacks = new CallbackMap,
            listenCallback = new CallbackMap,

            ws = null,

            // event callback cache
            evtCallbacks = {
                open: [],
                close: [],
                error: []
            },
            cfg = {
                // can be object or function contain user info
                verify: false
            },
            me = {
                on: on,
                get: get,
                post: post,
                listen: listen,
                connect: connect,
                // 0-init 1-connecting 2-connected 3-verifying 4-ready 5-closing 6-closed
                status: 0
            };

        extend(cfg, config);

        //$this.on('open', function(evt) {
        //    // change status to connected
        //    $this.status = 2;
        //
        //    // if need user verify
        //    if (configs.verify) {
        //        verify(configs.verify);
        //    } else {
        //        $this.status = 4;
        //        invokeEvent('ready');
        //    }
        //});

        // TODO
        //$this.on('error', function(evt) {});

        //function verify(user) {
        //    if ($this.status > 3 || !user) return false;
        //
        //    $this.status = 3;
        //
        //    if (typeof user === 'function') {
        //        user = user.call($this);
        //    }
        //
        //    pushEvent('verify', user);
        //}

        //if (configs.userVerify) {
        //    $this.verify = false;
        //    $this.on('open', function(evt) {
        //        var userInfo = configs.userVerify;
        //        if (typeof configs.userVerify === 'function') {
        //            userInfo = configs.userVerify();
        //        }
        //        evt.target.send({
        //            $method: 'verify',
        //            $data: userInfo
        //        });
        //        pushEvent('verify', userInfo);
        //    });
        //}

        function pushMsg(method, path, data) {
            var id = hash(),
                pushData = {
                    $method: method,
                    $path: path,
                    $data: data,
                    $id: id
                };

            ws.send(pushData);

            return id;
        }

        function pushEvent(evtName, data) {
            var evtData = {
                $method: 'event',
                $type: evtName,
                $data: data
            };

            ws.send(evtData);
        }

        function invokeEvent(evtName) {
            var i = 0,
                params = Array.prototype.slice.call(arguments, 1),
                callbacks = evtCallbacks[evtName] || [];

            for (;i<callbacks.length;i++) {
                callbacks.call(me, params);
            }

            return true;
        }

        function msgVerify(msg) {
            if (msg.$id in msgCallback) {
                msgCallback[msg.$id].call($this, msg.$data);
            }
        }

        function customEvent(msg) {
            switch (msg.$type) {
                case 'verify':
                    if (msg.$data) {
                        //$this.status = 4;
                        if (typeof configs.verifyCallback.success === 'function') {
                            configs.verifyCallback.success.call($this, msg.$data);
                        }
                        //invokeEvent('ready');
                    } else {
                        //$this.status = 401;
                        if (typeof configs.verifyCallback.fail === 'function') {
                            configs.verifyCallback.fail.call($this, msg.$data);
                        }
                    }
                    break;
            }
        }

        function msgRouter(evt) {
            var msg = JSON.parse(evt.data),
                ws = evt.target,
                k, callback;

            console.log(msg);
            switch (msg.$method) {
                case 'event':
                    customEvent(msg);
                    break;
                case 'get':
                case 'post':
                    msgCallbacks.invokeOnce(msg.$id, msg.$data);
                    break;
                case 'listen':
                    for (k in listenCallback) {
                        k === msg.$path && listenCallback[k].call(this, msg.$data);
                    }
                    break;
            }
        }

        function post(path, data, callback) {
            var id = hash();

            !!callback && (msgCallbacks[id] = callback);
            ws.push('post', path, data, id);
        }

        function get(path, data, callback) {
            //if ($this.verify === false) return false;

            var id = hash();

            !!callback && (msgCallbacks[id] = callback);
            ws.push('get', path, data, id);
        }

        function listen(path, callback) {
            listenCallback[path] = callback;
        }

        function on(event, callback) {
            if (event in evtCallbacks) {
                evtCallbacks[event].push(callback);
            }

            return this;
        }

        function connect() {
            ws = new WebSocket(url);

            // change status to connecting

            // event loop
            ws.onmessage = ws.onclose = ws.onopen = ws.onerror = function(evt) {
                var type = evt.type, i;

                switch (type) {
                    case 'open':
                        this.send({
                            $method: 'event',
                            $type: 'open',
                            $data: typeof cfg.verify === 'object' ? cfg.verify : typeof cfg.verify === 'function' ? cfg.verify() : null
                        });
                        break;
                    case 'message':
                        msgRouter(evt);
                        break;
                    default:
                        break;
                }
            };

            return this;
        }

        return me;
    }
}(window);
