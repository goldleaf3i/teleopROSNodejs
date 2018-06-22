var socket = io();
var joystick = nipplejs.create({
    zone: document.getElementById('zone_joystick'),
    color: 'blue'
});

  joystick.on('start end', function(evt, data) {
    console.log(evt.type);
    console.log(data);
    socket.emit('STARTEND',data)
  }).on('move', function(evt, data) {
    console.log(data);
    socket.emit('MOVE',data)
  }).on('dir:up plain:up dir:left plain:left dir:down ' +
        'plain:down dir:right plain:right',
        function(evt, data) {
    console.log(evt.type);
    socket.emit('DIRECTION',data)
  }
       ).on('pressure', function(evt, data) {
    console.log({
      pressure: data
    });
  });