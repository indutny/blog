(function() {
  // Redirect to https
  if (document.location.protocol === 'http:') {
    document.location.href = document.location.href.replace(/http:/, 'https:');
    return;
  }
  var socket = io.connect();

  var ids = [];

  // Listen for each post's update
  $('.post .rate').each(function(i, rate) {
    rate = $(rate);
    var front = rate.find('.front'),
        back = rate.find('.back'),
        id = rate.data('id'),
        nonce = null;

    $.getJSON('/rate/' + id, function(data) {
      front.text('+' + data.rate.rate);
      nonce = data.rate.nonce;
    });

    socket.on('rating:' + id, function(info) {
      front.text('+' + parseFloat(info.rate));
    });

    back.click(function(e) {
      e.preventDefault();

      if (typeof Worker === 'undefined') {
        alert('Your browser doesn\'t support web workers. You can\'t vote');
        return;
      }

      rate.addClass('voting');
      var loader = '.';
      function tick() {
        back.text(loader);
        loader += '.';
        if (loader.length > 4) loader = '.';
      }
      var interval = setInterval(tick, 800);
      tick();

      var w = new Worker('/js/worker.js');
      w.addEventListener('message', function(e) {
        if (typeof _gaq !== 'undefined') {
          _gaq.push(['_trackEvent', 'Posts', 'Vote']);
        }

        $.ajax({
          type: 'POST',
          url: '/rate/' + id,
          data: JSON.stringify({ nonce: nonce, answer: e.data }),
          dataType: 'json',
          headers: {
            'Content-Type': 'application/json'
          },
          success: function() {
            clearInterval(interval);
            rate.removeClass('can-vote');
            rate.removeClass('voting');
          }
        });
      });

      w.postMessage(nonce);
    });
  });
})();
