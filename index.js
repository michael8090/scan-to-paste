/**
 * Created by michael on 2015/1/22.
 */
var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

var port = 80;
server.listen(port);
console.log('server is listening on ' + port);

app.use(express.static(__dirname + '/bower_components'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/:id', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var map = {},
    lastId = 0;
io.on('connection', function (socket) {
    var id = lastId ++,
        peer = {
        socket: socket,
        id: id,
        peers: {
            id: true
        }
    };
    map[id] = peer;
    console.log('new peer ' + id + ' in!');

    socket.emit('got id', id);

    socket.on('disconnect', function () {
        map[id] = undefined;
        peer.peers[id] = undefined;
        console.log('peer ' + id + ' is out.');
    });

    socket.on('connect to', function (destId) {
        destId = parseInt(destId, 10);
        var destPeer = map[destId];
        if (!destPeer) {
            socket.emit('connect error', 'the destination peer is not accessible.');
            return ;
        }

        peer.peers[id] = undefined;
        destPeer.peers[id] = true;
        peer.peers = destPeer.peers;

        console.log(id + ' now is connected with ' + destId);
        socket.emit('connect success', destId);
    });
    socket.on('push', function (data) {
        var peers = peer.peers;
        Object.keys(peers).filter(function (id) {
            return peers[id] !== undefined;
        }).forEach(function (id) {
            var p = map[id],
                socket = p && p.socket;
            if (socket) {
                socket.emit('sync', data);
            }
        });
    });
});

