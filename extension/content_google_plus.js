(function() {
	var GooglePlusNotifications = function() {
		Component.apply(this, arguments);
	};
	GooglePlusNotifications.prototype = {
		__proto__: Component.prototype,
		name: 'notifications',
		findElement: function() {
			return document.getElementsByClassName('gbtn')[0];
		},
		count: function(el) {
			var notifications = el.getElementsByClassName('gb_da')[0];
			return parseInt(notifications && notifications.innerText) || 0;
		},
		mutationObserverOptions: {
			childList: true,
			characterData: true,
			subtree: true
		}
	};

	observeComponents([new GooglePlusNotifications()]);
})();

