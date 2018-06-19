var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var http = require('http'); 
server = http.createServer(app);
var io = require('socket.io')(server);


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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

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

  this.sendMessage = function(linear,angular,scale){
    var vct_linear = new twist_msgs.Vector3();
    vct_linear.x = linear * scale;
    vct_linear.y = 0; 
    vct_linear.z = 0;
    var vct_angular = new twist_msgs.Vector3();
    vct_angular.x = 0;
    vct_angular.y = 0; 
    vct_angular.z = angular * scale;
    var msg = new twist_msgs.Twist();
    msg.linear = vct_linear;
    msg.angular = vct_angular;
    console.log(msg);
    publisher.publish(msg);

  return this
  };
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
    ros_wrapper.sendMessage(0,0,0);
  });
  socket.on('DIRECTION',function(data){
    console.log("DIRECTION");
    console.log(data);
  });
  socket.on('MOVE',function(data){
    console.log("MOVE");
    //console.log(data);
    var linear = Math.sin(data.angle.radian);
    var angular = Math.cos(data.angle.radian);
    var scale = data.force / 2;
    ros_wrapper.sendMessage(linear,angular,scale);
/*    var vct_linear = new twist_msgs.Vector3();
    vct_linear.x = linear * scale;
    vct_linear.y = 0; 
    vct_linear.z = 0;
    var vct_angular = new twist_msgs.Vector3();
    vct_angular.x = 0;
    vct_angular.y = 0; 
    vct_angular.z = angular * scale;
    var msg = new twist_msgs.Twist();
    msg.linear = vct_linear;
    msg.angular = vct_angular;
    console.log(msg);
    publisher.publish(msg);*/
  });
});


module.exports = { app: app, server: server};
