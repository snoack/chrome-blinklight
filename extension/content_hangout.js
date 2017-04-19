(function() {
  if (document.location.hash != '#e') // only roster
    return;

  if (document.referrer.indexOf('https://mail.google.com/mail/') != 0)
  if (document.referrer.indexOf('https://plus.google.com/') != 0)
    return;

  var Hangout = function() {
    Component.apply(this, arguments);
  };
  Hangout.prototype = {
    __proto__: Component.prototype,
    name: 'hangout',
    findElement: function() {
      return document.getElementsByClassName('Ln')[0];
    },
    count: function(el) {
      return el.getElementsByClassName('ee').length;
    },
    mutationObserverOptions: {
      attributes: true,
      subtree: true
    }
  };

  observeComponents([new Hangout()]);
})();
