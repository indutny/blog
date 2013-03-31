var posts = require('./posts');

exports.add = function add(app) {
  app.get('/', function(req, res, next) {
    posts.list(function(err, posts) {
      if (err) return next(err);

      res.render('index.jade', {
        title: null,
        posts: posts
      });
    });
  });

  app.get('/:id', function(req, res, next) {
    posts.get(req.params.id, function(err, post) {
      if (err) return next(err);

      res.render('post.jade', {
        title: post.title,
        post: post
      });
    });
  });

  app.get('/rate/:id', function(req, res, next) {
    posts.get(req.params.id, function(err, post) {
      if (err) return next(err);

      posts.getRating(post.id, function(err, rate) {
        if (err) return next(err);

        res.json({
          id: post.id,
          rate: rate
        });
      });
    });
  });

  // TODO: Verify client's nonce
  app.post('/rate/:id', function(req, res, next) {
    posts.get(req.params.id, function(err, post) {
      if (err) return next(err);

      posts.updateRate(post.id, req.body, function(err, rate) {
        if (err) return next(err);

        // Send broadcast to clients
        app.io.sockets.emit('rating:' + req.params.id, {
          rate: rate
        });
        res.json({
          id: post.id,
          rate: rate
        });
      });
    });
  });
};
