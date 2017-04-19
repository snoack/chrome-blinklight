(function() {
  var Tab = function(blinklight, tab) {
    this.blinklight = blinklight;
    this.id = tab.id;
    this.urgent = false;
  };
  Tab.prototype = {
    setUrgent: function(value) {
      this.urgent = value;

      if (value) {
        this.blinklight.ledControl.notify();
        return;
      }

      for (var id in this.blinklight.tabs)
        if (this.blinklight.tabs[id].urgent)
          return;

      this.blinklight.ledControl.clear();
    }
  };


  var onVisibleWindowsAdded;

  PinnedTab = function(blinklight, tab) {
    Tab.apply(this, arguments);

    if (tab.status == 'complete' && !(tab.id in blinklight.injectedTabs))
      blinklight.injectScript(tab.id);
  };
  PinnedTab.isCompatible = function(tab) {
    return tab.pinned;
  };
  PinnedTab.prototype = {
    __proto__: Tab.prototype,
    onComplete: function() {
      this.blinklight.injectScript(this.id);
    },
    onActivated: function(info) {
      if (!this.urgent)
        return;

      visibleWindows.getAll(function(windows) {
        if (windows.indexOf(info.windowId) != -1)
          this.setUrgent(false);
      }.bind(this));
    },
    onMessage: function(msg, sender) {
      if (!sender.tab.active) {
        this.setUrgent(true);
        return;
      }

      visibleWindows.getAll(function(windows, onAdded) {
        if (windows.indexOf(sender.tab.windowId) != -1)
          return;

        this.setUrgent(true);

        if (onVisibleWindowsAdded)
          return;

        onVisibleWindowsAdded = function(windows) {
          chrome.tabs.query({active: true}, function(tabs) {
            var removeListener = true;

            for (var i = 0; i < tabs.length; i++) {
              var tab = this.blinklight.tabs[tabs[i].id];

              if (!(tab instanceof PinnedTab))
                continue;

              if (windows.indexOf(tabs[i].windowId) != -1) {
                tab.setUrgent(false);
                continue;
              }

              if (tab.urgent)
                removeListener = false;
            }

            if (removeListener) {
              onAdded.removeListener(onVisibleWindowsAdded);
              onVisibleWindowsAdded = null;
            }
          }.bind(this));
        }.bind(this);
        onAdded.addListener(onVisibleWindowsAdded);
      }.bind(this));
    }
  };


  SpecialTab = function(blinklight, tab) {
    Tab.apply(this, arguments);
    this._components = {};
  };
  SpecialTab.isCompatible = function(tab) {
    return /^https:\/\/(?:www.irccloud.com\/(?=$|[?#])|mail.google.com\/mail\/|plus.google.com\/)/.test(tab.url);
  };
  SpecialTab.prototype = {
    __proto__: Tab.prototype,
    onComplete: function() {},
    onActivated: function() {},
    onMessage: function(msg, sender) {
      this._components[msg.component] = msg.urgent;

      if (msg.urgent) {
        this.setUrgent(true);
        return;
      }

      for (var component in this._components)
        if (this._components[component])
          return;

      this.setUrgent(false);
    }
  };
})();
