var fs = require('fs'),
    assert = require('assert'),
    async = require('async'),
    path = require('path'),
    crypto = require('crypto'),
    client = require('redis').createClient(),
    marked = require('marked'),
    rss = require('rss'),
    highlight = require('highlight.js');

var posts = [];
var map = {},
    slugMap = {};

var dir = path.resolve(__dirname, '..', 'posts'),
    files = fs.readdirSync(dir);

function loadPost(filename, callback) {
  var slug = filename.replace(/\.md$/, ''),
      fullpath = path.resolve(dir, filename),
      content = fs.readFileSync(fullpath).toString(),
      title = content.match(/^# (.*)$/m),
      body = content.replace(/^# (.*)$/m, ''),
      stat = fs.statSync(fullpath);

  if (title)
    title = title[1];
  else
    title = '...';

  if (!callback)
    callback = function() {};

  marked(body, {
    highlight: function(code, lang, callback) {
      if (lang === 'javascript')
        callback(null, highlight.highlight(lang, code).value);
      else
        callback(null, highlight.highlightAuto(code).value);
    }
  }, function(err, rendered) {
    if (err)
      return callback(err);

    var post = {
      id: slug.replace(/\..*$/, ''),
      num: 0,
      slug: slug,
      title: title,
      ctime: stat.mtime,
      created_at: stat.mtime.toDateString(),
      content: rendered
    };
    post.num = parseInt(post.id, 16);

    // Remove stale version of post
    posts = posts.filter(function(p) {
      return p.id !== post.id;
    });

    // Replace post
    map[post.id] = post;
    slugMap[post.slug] = post;
    posts.push(post);

    // Sort posts (newer first, older last)
    posts = posts.sort(function(a, b) {
      return b.num > a.num ? 1 : b.num < a.num ? -1 :
             b.id > a.id ? 1 : b.id < a.id ? -1 : 0;
    });

    callback(null, post);
  });
}

async.each(files, function(filename, cb) {
  loadPost(filename, cb);

  if (process.env.NODE_ENV !== 'production') {
    fs.watch(path.resolve(dir, filename), loadPost.bind(null, filename, null));
  }
}, generateRSS);

exports.list = function list(callback) {
  callback(null, posts.slice());
};

exports.get = function get(id, callback) {
  if (map.hasOwnProperty(id)) {
    return callback(null, map[id]);
  }

  if (slugMap.hasOwnProperty(id)) {
    return callback(null, slugMap[id]);
  }

  return callback(new Error('Post ' + id  + ' not found'));
};

exports.getRating = function getRating(id, callback) {
  client.get('rate:' + id, function(err, rate) {
    if (err) return callback(err);

    var nonce = crypto.randomBytes(16).toString('hex');
    callback(null, {
      rate: rate || 0,
      nonce: nonce
    });
    client.set(nonce, 1, function() {});
  })
};

exports.updateRate = function updateRate(id, data, callback) {
  client.get(data.nonce, function(err, val) {
    if (val != 1) return callback(new Error('Incorrect nonce'));

    var hash = crypto.createHash('sha1')
                     .update(data.nonce + ':' + data.answer)
                     .digest('hex');

    if (!/000000/.test(hash)) {
      return callback(new Error('Incorrect answer'));
    }
    client.del(data.nonce, function() {});
    client.incr('rate:' + id, function(err, rate) {
      if (err) return callback(err);

      callback(null, rate);
    });
  });
};

function generateRSS() {
  var feed = new rss({
    title: 'Fedor Indutny\'s blog',
    description: 'Node.js, Compilers, Bears, Security',
    feed_url: 'https://blog.indutny.com/rss.xml',
    site_url: 'https://blog.indutny.com/',
    author: 'Fedor Indutny',
    copyright: '2014 Fedor Indutny',
    language: 'en',
    ttl: '60'
  });

  posts.forEach(function(post) {
    feed.item({
      title: post.title,
      description: post.content,
      url: 'https://blog.indutny.com/' + post.slug,
      date: post.ctime
    });
  });

  fs.writeFileSync(path.resolve(__dirname, '..', 'public', 'rss.xml'),
                   feed.xml());
}
