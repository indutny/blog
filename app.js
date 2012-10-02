var express = require('express'),
    io = require('socket.io'),
    jade = require('jade'),
    path = require('path'),
    http = require('http'),
    sticky = require('sticky-session'),
    app = express();

sticky(function() {
  var app = express(),
      server = http.createServer(app);

  app.use(express.static(path.resolve(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(app.router);

  app.engine('jade', jade.__express);

  // Add routes
  require('./app/routes').add(app);

  io = io.listen(server);

  app.io = io;

  return server;
}).listen(process.env.SERVER_PORT || 8080, function() {
  console.log('Server started on %d', process.env.SERVER_PORT || 8080);
});
