LedControl = function() {
  this._port = null;
  this._led = null;
  this._ledReady = false;
  this._control = null;
  this._urgent = 0;
  this._lastError = Promise.resolve(null);

  chrome.storage.local.get(['led', 'trigger'], this._onSettingsRetrieved.bind(this));
  chrome.storage.onChanged.addListener(this._onSettingsChanged.bind(this));
};
LedControl.prototype = {
  _connect() {
    if (!this._port) {
      this._port = chrome.runtime.connectNative("org.snoack.blinklight");
      this._port.onDisconnect.addListener(function() {
        this._port = null;
        this._ledReady = false;
      }.bind(this));
    }
  },
  _recvMessage(callback)
  {
    var onMessage = function(message, port) {
      port.onMessage.removeListener(onMessage);
      port.onDisconnect.removeListener(onDisconnected);
      callback(message);
    }

    var onDisconnected = function(port) {
      port.onMessage.removeListener(onMessage);
      port.onDisconnect.removeListener(onDisconnected);
      callback(null);
    }

    this._port.onMessage.addListener(onMessage);
    this._port.onDisconnect.addListener(onDisconnected);
  },
  _setTrigger(trigger) {
    if (trigger == "on")
      this._control = ["off", "on"];
    else
      this._control = ["clear", trigger];
  },
  _initLed() {
    this._connect();
    this._port.postMessage({action: "set-led", led: this._led});
    this._ledReady = true;

    this._lastError = new Promise(function(resolve) {
      this._recvMessage(function(error) {
        resolve(error);

        if (error)
          this._ledReady = false;
      }.bind(this));
    }.bind(this));
  },
  _updateLed() {
    if (!this._control || !this._led)
      return;

    if (!this._ledReady)
      this._initLed();

    this._port.postMessage({action: "control-led",
                            control: this._control[this._urgent]});
  },
  _onSettingsRetrieved(settings) {
    if (settings.led) {
      this._led = settings.led;
      this._initLed();
    }

    if (settings.trigger) {
      this._setTrigger(settings.trigger);
      this._updateLed();
    }

    if (!settings.led || !settings.trigger)
      chrome.runtime.openOptionsPage();
  },
  _onSettingsChanged(changes) {
    if ("led" in changes) {
      this._led = changes.led.newValue;
      this._initLed();
    }

    if ("trigger" in changes)
      this._setTrigger(changes.trigger.newValue);

    this._updateLed();
  },
  notify() {
    this._urgent = 1;
    this._updateLed();
  },
  clear() {
    this._urgent = 0;
    this._updateLed();
  },
  getLeds(callback) {
    this._connect();
    this._port.postMessage({action: "get-leds"});
    this._recvMessage(callback);
  },
  getLastError(callback) {
    this._lastError.then(callback);
  }
};
