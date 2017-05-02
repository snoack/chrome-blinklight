const PINNED = 1;
const URGENT = 2;

Blinklight = function() {
  this.tabs = {};
  this.ledControl = new LedControl();

  chrome.tabs.query({pinned: true}, this.onInitialPinnedTabs.bind(this));
  chrome.tabs.onCreated.addListener(this.onCreated.bind(this));
  chrome.tabs.onUpdated.addListener(this.onUpdated.bind(this));
  chrome.tabs.onRemoved.addListener(this.onRemoved.bind(this));
  chrome.webNavigation.onCommitted.addListener(this.onCommitted.bind(this));
  chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
};
Blinklight.prototype = {
  injectScript(tabId) {
    chrome.tabs.executeScript(tabId, {file: 'content.js'});
  },
  initPinnedTab(tabId) {
    this.injectScript(tabId);
    this.tabs[tabId] = PINNED;
  },
  onInitialPinnedTabs(tabs) {
    for (i = 0; i < tabs.length; i++)
      this.initPinnedTab(tabs[i].id);
  },
  onCreated(tab) {
    if (tab.pinned)
      this.tabs[tab.id] = PINNED;
  },
  checkClear() {
    for (var tabId in this.tabs)
      if (this.tabs[tabId] & URGENT)
        return;
    this.ledControl.clear();
  },
  onUpdated(tabId, change) {
    if ("pinned" in change) {
      if (tabId in this.tabs) {
        if (change.pinned)
          this.tabs[tabId] |= PINNED;
        else {
          var flags = this.tabs[tabId];
          this.tabs[tabId] = 0;
          if (flags & URGENT)
            this.checkClear();
        }
      } else if (change.pinned)
        this.initPinnedTab(tabId);
    }
  },
  onRemoved(tabId) {
    var flags = this.tabs[tabId];
    delete this.tabs[tabId];
    if (flags & URGENT)
      this.checkClear();
  },
  onCommitted(details) {
    if (details.frameId == 0) {
      if (this.tabs[details.tabId] & PINNED)
        this.injectScript(details.tabId);
      else
        delete this.tabs[details.tabId];
    }
  },
  onMessage(message, sender, sendResponse) {
    if (message == "get-leds") {
      this.ledControl.getLeds(sendResponse);
      return true;
    }

    if (message == "get-last-error") {
      this.ledControl.getLastError(sendResponse);
      return true;
    }

    if (this.tabs[sender.tab.id] & PINNED) {
      switch (message) {
        case "notify":
          this.tabs[sender.tab.id] |= URGENT;
          this.ledControl.notify();
          break;

        case "clear":
          this.tabs[sender.tab.id] &= ~URGENT;
          this.checkClear();
          break;
      }
    }
  }
};

blinklight = new Blinklight();
