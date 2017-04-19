(function() {
  var VisibleWindows = function() {
    this._listeners = [];
    this._visibleWindows = [];
    this._pause_counter = 1;
  };
  VisibleWindows.prototype = {
    _resume: function() {
      if (--this._pause_counter != 0)
        return;

      this._interval = setInterval(this._discoverVisibleWindows.bind(this), 500);
    },
    _pause: function() {
      if (++this._pause_counter != 1)
        return;

      clearInterval(this._interval);
      delete this._interval;
    },
    _discoverVisibleWindows: function (callback) {
      chrome.windows.getAll(function(windows) {
        var visibleWindows = [];
        var visibleWindowAdded = false;

        for (var i = 0; i < windows.length; i++) {
          if (windows[i].state == 'minimized')
            continue;

          if (this._visibleWindows.indexOf(windows[i].id) == -1)
            visibleWindowAdded = true;

          visibleWindows.push(windows[i].id);
        }

        this._visibleWindows = visibleWindows;

        if (callback)
          callback();

        if (visibleWindowAdded)
          for (var i = 0; i < this._listeners.length; i++)
            this._listeners[i](visibleWindows);
      }.bind(this));
    },
    _addListener: function(listener) {
      this._listeners.push(listener);
      if (this._listeners.length == 1)
        this._resume();
    },
    _removeListener: function(listener) {
      this._listeners.splice(this._listeners.indexOf(listener), 1);
      if (this._listeners.length == 0)
        this._pause();
    },
    getAll: function(callback) {
      this._pause();

      this._discoverVisibleWindows(function() {
        callback(this._visibleWindows, {
          addListener: this._addListener.bind(this),
          removeListener: this._removeListener.bind(this)
        });

        this._resume();
      }.bind(this));
    }
  };

  visibleWindows = new VisibleWindows();
})();
