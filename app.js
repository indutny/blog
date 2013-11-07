var express = require('express'),
    io = require('socket.io'),
    jade = require('jade'),
    path = require('path'),
    http = require('http'),
    gzip = require('crafity-gzip'),
    app = express(),
    config = require('./config.json');

var vhosts = Object.keys(config).map(function(host) {
  var base = host.replace(/([^a-z0-9])/g, '\\$1');
  return {
    re: new RegExp('^' + base + '(:\d+)?$', 'i'),
    handler: require(config[host])
  };
});

var server = http.createServer(function(req, res) {
  var host = req.headers.host;
  if (host) {
    for (var i = 0; i < vhosts.length; i++) {
      var entry = vhosts[i];
      if (host.match(entry.re)) {
        entry.handler(req, res);
        return;
      }
    }
  }

  app(req, res);
});

app.use(express.staticCache());
app.use(gzip.gzip({ matchType: /css|javascript|woff/ }));
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.bodyParser());
app.use(app.router);

app.engine('jade', jade.__express);

// Add routes
require('./app/routes').add(app);

io = io.listen(server);
io.enable('browser client minification');

app.io = io;

server.listen(process.env.SERVER_PORT || 8080, function() {
  var addr = this.address();
  console.log('Server started on %s:%d', addr.address, addr.port);
});
