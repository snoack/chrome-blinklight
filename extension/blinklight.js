Blinklight = function() {
	this.tabs = {};
	this.injectedTabs = {};
	this.ledBehaviorManager = new LedBehaviorManager();

	chrome.tabs.query({}, this.onInitialTabs.bind(this));
	chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
};
Blinklight.prototype = {
	updateTab: function(tab) {
		for (var i = 0; i < 2; i++) {
			var ctor = [SpecialTab, PinnedTab][i];

			if (!ctor.isCompatible(tab))
				continue;

			if (this.tabs[tab.id] instanceof ctor)
				return;

			this.removeTab(tab.id);
			this.tabs[tab.id] = new ctor(this, tab);
			return;
		}

		this.removeTab(tab.id);
	},
	removeTab: function(id) {
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
			this.updateTab(tabs[i]);

		chrome.tabs.onCreated.addListener(this.onCreated.bind(this));
		chrome.tabs.onUpdated.addListener(this.onUpdated.bind(this));
		chrome.tabs.onRemoved.addListener(this.onRemoved.bind(this));
		chrome.tabs.onActivated.addListener(this.onActivated.bind(this));
	},
	onCreated: function(tab) {
		this.updateTab(tab);
	},
	onUpdated: function(id, info, tab) {
		if (info.status == 'loading')
			delete this.injectedTabs[id];

		if (info.status == 'complete' && id in this.tabs)
			this.tabs[id].onComplete();

		if ('url' in info || 'pinned' in info)
			this.updateTab(tab);
	},
	onRemoved: function(id) {
		this.removeTab(id);
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

blinklight = new Blinklight();
