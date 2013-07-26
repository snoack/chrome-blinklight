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
var visibleWindows = new VisibleWindows();

var Tab = function(blinklight, tab) {
	this.blinklight = blinklight;
	this.id = tab.id;
	this.urgent = false;
};
Tab.prototype = {
	_scheduleLedUpdate: function() {
		if (this._ledUpdateScheduled)
			return;

		setTimeout(function() {
			var urgent = false;

			for (var id in this.blinklight.tabs)
				if (this.blinklight.tabs[id].urgent) {
					urgent = true;
					break;
				}

			this.blinklight.ledControl.controlLed(0, urgent ? 'blink' : 'on');
			this._ledUpdateScheduled = false;
		}.bind(this), 0);

		this._ledUpdateScheduled = true;
	},
	setUrgent: function(value) {
		if (this.urgent == value)
			return;

		this.urgent = value;
		this._scheduleLedUpdate();
	}
};

var PinnedTab = function(tab) {
	Tab.apply(this, arguments);

	if (tab.status == 'complete' && !(tab.id in this.blinklight.injectedTabs))
		this.blinklight.injectScript(tab.id);
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

			if (this.blinklight.onVisibleWindowsAdded)
				return;

			this.blinklight.onVisibleWindowsAdded = function(windows) {
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
						onAdded.removeListener(this.blinklight.onVisibleWindowsAdded);
						delete this.blinklight.onVisibleWindowsAdded;
					}
				}.bind(this));
			}.bind(this);
			onAdded.addListener(this.blinklight.onVisibleWindowsAdded);
		}.bind(this));
	}
};

var IRCCloudTab = function() {
	Tab.apply(this, arguments);
};
IRCCloudTab.prototype = {
	__proto__: Tab.prototype,
	onComplete: function() {},
	onActivated: function() {},
	onMessage: function(msg, sender) {
		this.setUrgent(msg);
	}
};

var Blinklight = function() {
	this.tabs = {};
	this.injectedTabs = {};
	this.ledControl = this.getLedControl();

	chrome.tabs.query({}, this.onInitialTabs.bind(this));
	chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
};
Blinklight.prototype = {
	getLedControl: function() {
		var plugin = document.createElement("embed");
		plugin.setAttribute("type", "application/x-thinkpad-led-control");
		document.documentElement.appendChild(plugin);
		return plugin.ThinkpadLedControl();
	},
	add: function(tab, urgent) {
		var tab;

		if (tab.url.indexOf('https://www.irccloud.com/') == 0)
			tab = new IRCCloudTab(this, tab);
		else if (tab.pinned)
			tab = new PinnedTab(this, tab);
		else
			return;

		if (typeof urgent != 'undefined')
			tab.setUrgent(urgent);

		this.tabs[tab.id] = tab;
	},
	remove: function(id) {
		if (id in this.tabs) {
			this.tabs[id].setUrgent(false);
			delete this.tabs[id];
		}
	},
	injectScript: function(id) {
		chrome.tabs.executeScript(id, {file: 'content_generic.js'});
		this.injectedTabs[id] = null;
	},
	onInitialTabs: function(tabs) {
		for (var i = 0; i < tabs.length; i++)
			this.add(tabs[i]);

		chrome.tabs.onCreated.addListener(this.onCreated.bind(this));
		chrome.tabs.onUpdated.addListener(this.onUpdated.bind(this));
		chrome.tabs.onRemoved.addListener(this.onRemoved.bind(this));
		chrome.tabs.onActivated.addListener(this.onActivated.bind(this));
	},
	onCreated: function(tab) {
		this.add(tab);
	},
	onUpdated: function(id, info, tab) {
		if (info.status == 'loading')
			delete this.injectedTabs[id];

		if (info.status == 'complete' && id in this.tabs)
			this.tabs[id].onComplete();

		if ('pinned' in info || 'url' in info) {
			var urgent = (this.tabs[id] || {}).urgent;

			this.remove(id);
			this.add(tab, urgent);
		}
	},
	onRemoved: function(id) {
		this.remove(id);
		delete this.injectedTabs[id];
	},
	onActivated: function(info) {
		if (info.tabId in this.tabs)
			this.tabs[info.tabId].onActivated(info);
	},
	onMessage: function(msg, sender) {
		if (sender.tab.id in this.tabs)
			this.tabs[sender.tab.id].onMessage(msg, sender);
	}
};
var blinklight = new Blinklight();
