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
			var notifications = el.getElementsByClassName('gb_na')[0];
			return parseInt(notifications && notifications.innerText) || 0;
		},
		mutationObserverOptions: {
			attributes: true,
			subtree: true
		}
	};

	observeComponents([new GooglePlusNotifications()]);
})();

