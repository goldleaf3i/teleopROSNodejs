var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const config = require('./config');
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var server;
var serverMode;
// LAUNCH WITH DEBUG=http,tmt,bells,app,socketio nodemon

/**
 * Create HTTP or HTTPS server.
 */

if(config.HttpsKeyFile && config.HttpsCertFile){
    const https = require('https');
    const fs = require('fs');
    server    = https.createServer({
        key: fs.readFileSync(config.HttpsKeyFile),
        cert: fs.readFileSync(config.HttpsCertFile),
    },app);
    serverMode ='https';
}
else{
    logger.warn('No HTTPS certificates provided, starting in HTTP mode');
    const http = require('http');
    server = http.createServer(app);
    serverMode = 'http';
}

var io = require('socket.io').listen(server);
// 100hz
var frequency = 10;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const rosnodejs = require('rosnodejs');
const twist_msgs = rosnodejs.require('geometry_msgs').msg;
var publisher;
rosnodejs.initNode('movecare_teleop')
.then((rosnode) => {
  publisher  = rosnode.advertise('/cmd_vel', twist_msgs.Twist);
});

function ROSHandler() 
  {
  var vct_linear = new twist_msgs.Vector3();
  var vct_angular = new twist_msgs.Vector3();
  var msg = new twist_msgs.Twist();
  var started = false;
  this.setMessage = function(linear,angular,scale,rescale_linear){
    vct_linear.x = linear * scale * rescale_linear;
    vct_linear.y = 0; 
    vct_linear.z = 0;
    vct_angular.x = 0;
    vct_angular.y = 0; 
    vct_angular.z = angular * scale;
    msg.linear = vct_linear;
    msg.angular = vct_angular;
  }

  this.start = function () {
    if (!started) 
      {
        started = true;
        sendMessage();
    }
  }

  this.stop = function() {
    started = false;
  }

  var sendMessage = function() {
    console.log(Date.now());
    publisher.publish(msg);
    if (started)
      setTimeout(function(){sendMessage()}, frequency);
  }

  return this;
};

var ros_wrapper = new ROSHandler(publisher);
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('STARTEND',function(data){
    console.log("START-END");
    console.log(data);
    ros_wrapper.setMessage(0,0,0,1);
    ros_wrapper.stop();
  });
  socket.on('DIRECTION',function(data){
    console.log("DIRECTION");
    console.log(data);
  });
  socket.on('MOVE',function(data){
    console.log("MOVE");
    //console.log(data);
    var linear = Math.sin(data.angle.radian);
    var angular = -Math.cos(data.angle.radian);
    var scale = data.force / 2;
    ros_wrapper.setMessage(linear,angular,scale,0.5);
    ros_wrapper.start();
  });
});
var easyrtc = require("easyrtc");           // EasyRTC external module

var easyrtcServer = easyrtc.listen(app, io);

module.exports = { app: app, server: server};
