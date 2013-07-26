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

var Blinklight = function() {
	this.pinnedTabs = {};
	this.injectedTabs = {};
	this.ledControl = this.getLedControl();

	chrome.tabs.query({pinned: true}, this.onInitialTabs.bind(this));
	chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
};
Blinklight.prototype = {
	getLedControl: function() {
		var plugin = document.createElement("embed");
		plugin.setAttribute("type", "application/x-thinkpad-led-control");
		document.documentElement.appendChild(plugin);
		return plugin.ThinkpadLedControl();
	},
	add: function(tab) {
		this.pinnedTabs[tab.id] = {urgent: false};

		if (tab.status == 'complete' && !(tab.id in this.injectedTabs))
			this.injectScript(tab.id);
	},
	remove: function(id) {
		if (id in this.pinnedTabs) {
			this.setUrgent(id, false);
			delete this.pinnedTabs[id];
		}
	},
	injectScript: function(id) {
		chrome.tabs.executeScript(id, {file: 'content_generic.js'});
		this.injectedTabs[id] = null;
	},
	setUrgent: function(id, value) {
		var pinnedTab = this.pinnedTabs[id];

		if (pinnedTab.urgent == value)
			return;

		pinnedTab.urgent = value;

		if (value) {
			this.ledControl.controlLed(0, 'blink');
			return;
		}

		for (var id in this.pinnedTabs)
			if (this.pinnedTabs[id].urgent)
				return;

		this.ledControl.controlLed(0, 'on');
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
		if (tab.pinned)
			this.add(tab);
	},
	onUpdated: function(id, info, tab) {
		if (info.status == 'loading')
			delete this.injectedTabs[id];

		if (info.status == 'complete' && id in this.pinnedTabs)
			this.injectScript(id);

		if ('pinned' in info)
			if (info.pinned)
				this.add(tab);
			else {
				this.remove(id);
			}
	},
	onRemoved: function(id) {
		this.remove(id);
		delete this.injectedTabs[id];
	},
	onActivated: function(info) {
		if (!(info.tabId in this.pinnedTabs))
			return;
		if (!this.pinnedTabs[info.tabId].urgent)
			return;

		visibleWindows.getAll(function(windows) {
			if (windows.indexOf(info.windowId) != -1)
				this.setUrgent(info.tabId, false);
		}.bind(this));
	},
	onMessage: function(msg, sender) {
		if (!(sender.tab.id in this.pinnedTabs))
			return;

		if (!sender.tab.active) {
			this.setUrgent(sender.tab.id, true);
			return;
		}

		visibleWindows.getAll(function(windows, onAdded) {
			if (windows.indexOf(sender.tab.windowId) != -1)
				return;

			this.setUrgent(sender.tab.id, true);

			if (this.onVisibleWindowsAdded)
				return;

			this.onVisibleWindowsAdded = function(windows) {
				chrome.tabs.query({pinned: true, active: true}, function(tabs) {
					var removeListener = true;

					for (var i = 0; i < tabs.length; i++) {
						if (windows.indexOf(tabs[i].windowId) != -1)
							this.setUrgent(tabs[i].id, false);
						else if (this.pinnedTabs[tabs[i].id].urgent)
							removeListener = false;
					}

					if (removeListener) {
						onAdded.removeListener(this.onVisibleWindowsAdded);
						delete this.onVisibleWindowsAdded;
					}
				}.bind(this));
			}.bind(this);
			onAdded.addListener(this.onVisibleWindowsAdded);
		}.bind(this));
	}
};
var blinklight = new Blinklight();
