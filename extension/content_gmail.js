(function() {
  var Inbox = function() {
    Component.apply(this, arguments);
  };
  Inbox.prototype = {
    __proto__: Component.prototype,
    name: 'inbox',
    findElement: function() {
      return document.querySelector('a.J-Ke[href$="#inbox"]');
    },
    count: function(el) {
      return parseInt((el.innerText.match(/\((\d+)\)/) || [null, 0])[1]);
    },
    mutationObserverOptions: {
      childList: true,
      subtree: true
    },
    getMutationObserverTarget: function(el) {
      var target = el;

      while (true) {
        if (target.classList.contains('TK'))
          return target;
        target = target.parentNode;
      }
    },
    prepareElementForMutationObserverCallback: function() {
      return this.findElement();
    }
  };

  var GTalk = function() {
    Component.apply(this, arguments);
  };
  GTalk.prototype = {
    __proto__: Component.prototype,
    name: 'gtalk',
    findElement: function() {
      return document.getElementsByClassName('aj3')[0];
    },
    count: function(el) {
      return el.getElementsByClassName('vE').length;
    },
    mutationObserverOptions: {
      attributes: true,
      subtree: true
    }
  };

  observeComponents([new Inbox(), new GTalk()]);
})();
