var spdy = require('spdy'),
    express = require('express'),
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

vhosts.unshift({
  re: /^(www\.)?indutny.com(:\d+)?$/,
  handler: function(res, res) {
    res.writeHead(301, {
      Location: 'https://blog.indutny.com/'
    });
    res.end('Redirecting you to https://blog.indutny.com/');
  }
});

var server = spdy.createServer({ plain: true, ssl: false }, app);

app.use(function(req, res, next) {
  if (req.headers.host === 'blog.indutny.com') {
    res.setHeader('Strict-Transport-Security',
                  'max-age=31536000; includeSubDomains');
  }
  next();
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
io.disable('log');

app.io = io;

function wrap(event) {
  var def = server.listeners(event)[0];
  server.removeAllListeners(event);
  if (!def)
    return;

  server.on(event, function(req, a1, a2, a3) {
    var host = req.headers.host;
    if (host) {
      for (var i = 0; i < vhosts.length; i++) {
        var entry = vhosts[i];
        if (host.match(entry.re)) {
          entry.handler.emit(event, req, a1, a2, a3);
          return;
        }
      }
    }

    def.call(this, req, a1, a2, a3);
  });
};
wrap('request');
wrap('upgrade');

server.listen(process.env.SERVER_PORT || 8080, function() {
  var addr = this.address();
  console.log('Server started on %s:%d', addr.address, addr.port);
});
