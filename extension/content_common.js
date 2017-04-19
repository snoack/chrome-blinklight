Component = function() {
  this.n = 0;

  chrome.runtime.sendMessage({component: this.name, urgent: false});
};
Component.prototype = {
  name: null,
  observe: function(el) {
    this.check(el);

    (new MutationObserver(function() {
      this.check(this.prepareElementForMutationObserverCallback(el));
    }.bind(this))).observe(
      this.getMutationObserverTarget(el),
      this.mutationObserverOptions
    );
  },
  check: function(el) {
    var n = this.count(el);

    if (n == 0 && this.n != 0)
      chrome.runtime.sendMessage({component: this.name, urgent: false});

    for (var i = this.n; i < n; i++)
      chrome.runtime.sendMessage({component: this.name, urgent: true});

    this.n = n;
  },
  prepareElementForMutationObserverCallback: function(el) {
    return el;
  },
  getMutationObserverTarget: function(el) {
    return el;
  }
};

var observeComponents = (function() {
  var visitComponents = function(components) {
    for (var i = 0; i < components.length; i++) {
      var el = components[i].findElement();

      if (el) {
        components[i].observe(el);
        components.splice(i--, 1);
      }
    }
  };

  return (function(components) {
    visitComponents(components);

    if (components.length == 0)
      return;

    var mo = new MutationObserver(function() {
      visitComponents(components);

      if (components.length == 0)
        mo.disconnect();
    });

    mo.observe(document.body, {childList: true, subtree: true});
  });
})();
