(function() {
	var LedBehavior = function(led) {
		this._led = led;
		this._previousTrigger = led.trigger;
		this._previousBrightness = led.brightness;
	}
	LedBehavior.prototype = {
		restore: function() {
			this._led.trigger = this._previousTrigger;
			this._led.brightness = this._previousBrightness;
		},
		resume: function() {
			this.notify();
		}
	};

	var LightPermanent = function() {
		LedBehavior.apply(this, arguments);
	};
	LightPermanent.prototype = {
		__proto__: LedBehavior.prototype,
		notify: function() {
			this._led.trigger = 'none';
			this._led.brightness = 255;
		},
		clear: function() {
			this._led.trigger = 'none';
			this._led.brightness = 0;
		}
	};

	var BlinkPermanent = function() {
		LedBehavior.apply(this, arguments);
	};
	BlinkPermanent.prototype = {
		__proto__: LedBehavior.prototype,
		notify: function() {
			this._led.trigger = 'timer';
		},
		clear: function() {
			this._led.trigger = 'none';

			if (this._previousTrigger == 'none')
				this._led.brightness = this._previousBrightness;
			else
				this._led.brightness = 0;
		}
	};

	var BlinkOnce = function() {
		LedBehavior.apply(this, arguments);
		this._counter = 0;
	}
	BlinkOnce.prototype = {
		__proto__: LedBehavior.prototype,
		_blink: function() {
			this._led.brightness = this._previousBrightness == 0 ? 255 : 0;

			this._timeout = setTimeout(function() {
				this._led.brightness = this._previousBrightness;

				if (--this._counter > 0)
					this._timeout = setTimeout(this._blink.bind(this), 200);
				else
					delete this._timeout;
			}.bind(this), 500);
		},
		notify: function() {
			if (this._counter++ == 0)
				this._blink();
		},
		clear: function() {},
		resume: function() {},
		restore: function() {
			clearTimeout(this._timeout);
			delete this._timeout;
			this._counter = 0;

			LedBehavior.prototype.restore.call(this);
		}
	};

	LedBehaviorManager = function() {
		this._urgent = false;

		var plugin = document.createElement("embed");
		plugin.setAttribute("type", "application/x-led-control");
		document.body.appendChild(plugin);

		if (!('LedControl' in plugin)) {
			this._showOptions();
			return;
		}

		this._ledControl = plugin.LedControl();
		chrome.storage.local.get(['led', 'behavior'], this._onSettingsRetrieved.bind(this));
	}
	LedBehaviorManager.prototype = {
		_showOptions: function() {
			var optionsUrl = chrome.extension.getURL('options.html');

			chrome.tabs.query({url: optionsUrl}, function(tabs) {
				if (tabs.length > 0)
					chrome.tabs.update(tabs[0].id, {active: true});
				else
					chrome.tabs.create({url: optionsUrl, active: true});
			});
		},
		_initLedBehavior: function() {
			if (this._timeout) {
				clearTimeout(this._timeout);
				delete this._timeout;
			}

			if (this._ledBehavior) {
				this._ledBehavior.restore();
				delete this._ledBehavior;
			}

			var led;

			if (!this._settings.led || !(led = this._ledControl.getLed(this._settings.led))) {
				this._showOptions();
				return;
			}

			if (!led.canControl) {
				this._showOptions();
				this._deferInitLedBehavior();
				return;
			}

			var ctor;

			switch (this._settings.behavior) {
				case 'light-permanent':
					ctor = LightPermanent;
					break;
				case 'blink-permanant':
					if (led.availableTriggers.indexOf('timer') == -1) {
						this._showOptions();
						this._deferInitLedBehavior();
						return;
					}

					ctor = BlinkPermanent;
					break;
				case 'blink-once':
					ctor = BlinkOnce;
					break;
				default:
					this._showOptions();
					return;
			}

			this._ledBehavior = new ctor(led);

			if (this._urgent)
				this._ledBehavior.resume();
			else
				this._ledBehavior.clear();
		},
		_deferInitLedBehavior: function() {
			this._timeout = setTimeout(function () {
				this._showOptions = function() {};
				this._initLedBehavior();

				delete this._showOptions;
			}.bind(this), 1000);
		},
		_onSettingsRetrieved: function(settings) {
			this._settings = settings;
			this._initLedBehavior();

			chrome.storage.onChanged.addListener(this._onSettingsChanged.bind(this));
		},
		_onSettingsChanged: function(changes) {
			for (var k in changes)
				this._settings[k] = changes[k].newValue;
			this._initLedBehavior();
		},
		notify: function() {
			this._urgent = true;

			if (this._ledBehavior)
				this._ledBehavior.notify();
		},
		clear: function() {
			this._urgent = false;

			if (this._ledBehavior)
				this._ledBehavior.clear();
		}
	};
})();
