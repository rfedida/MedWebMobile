// Server
var express = require('express');
var path = require('path');
var routes = require('./routes/index');
var agamRoutes = require('./routes/agam'); 
var medRoutes = require('./routes/med');
var infrastructureRoutes = require('./routes/infrastructure');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var crud = require('./routes/crud');
var dgram = require('dgram');
var Buffer = require('buffer').Buffer;
var udpServer = dgram.createSocket('udp4');
var pjson = require('./package.json');
var bodyParser = require("body-parser");
var temp = require('./server/med/temp');
var mongo = require('./server/med/mongo');

var server = express();
server.use(function(req, res, next)
{
    var loginDetails = {};
    var isLoggedOn = true;
    console.log("req address : " + req.originalUrl);
    console.log("check if user logged on");
    if (isLoggedOn)
    {
        next();
    }
    else
    {
        res.status(401).send();
    }
});

server.use(bodyParser.json());
server.use(express.static(__dirname + '/public'));
server.use('/', routes);
server.use('/med', medRoutes);
server.use('/agam', agamRoutes);
server.use('/infrastructure', infrastructureRoutes);

server.use('/crud', crud);


// Listening to port 9000
var port = process.env.PORT || 9005;
server.listen(port, function() {
    console.log('Listening on ' + port);
});

// MongoDB part
var isOnline = false;

function connectToMongo () {
    mongoose.connect('mongodb://heroku_tskgxps7:kmhbi6i27rctgcmf045db4up4e@ds013574.mlab.com:13574/heroku_tskgxps7');
    // Getting the data from the db
    var db = mongoose.connection;
    db.on('error', function(err) {
        isOnline = false;
        console.log('Connection to mongo failed');
    });
    db.once('open', function(){
        isOnline = true;
        console.log("connect to mongo");
        
        // Update db according files
        if (!pjson.isWeb) {
            var tempUnits, tempPatients;
            temp.getTempPatients(function(data) {
                tempPatients = data;
            });
            temp.getTempUnits(function(data) {
                tempUnits = data;
            });
        }
    });
    db.on('close', function(){
        console.log("connection to mongo closed");
        isOnline = false;
    });
}

// Connect to mongoDB
if (pjson.isWeb) {
    connectToMongo();
} else {
    setInterval(function() {
        if (mongoose.connection.readyState != 1) {
            connectToMongo();
        }
    }, 3000);
}

// UDP Server
var patient = undefined;

udpServer.on('error', (err) => {
    console.log('UDP server error' + err);
});

udpServer.on('message', (msg, rinfo) => {
    patient = JSON.parse(msg.toString("utf8"));
    console.log(patient);
    sendToBracelet(patient);
});

udpServer.on('listening', () => {
    console.log("UDP server is listening");
});

udpServer.bind(9001);

function sendToBracelet(data) {
    return true;
}

var exports = {
    server: server,
    udpServer: udpServer,
    patient: patient,
    sendToBracelet: sendToBracelet,
    isOnline: isOnline
};

module.exports = exports;