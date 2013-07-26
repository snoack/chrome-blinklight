(new MutationObserver(function() {
	chrome.runtime.sendMessage(true);
})).observe(
	document.getElementsByTagName('title')[0],
	{
		characterData: true,
		childList: true,
		subtree: true
	}
);
