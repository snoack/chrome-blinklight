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
		isUrgent: function(el) {
			var notifications = el.getElementsByClassName('gb_na')[0];
			return !!+(notifications && notifications.innerText);
		},
		mutationObserverOptions: {
			attributes: true,
			subtree: true
		}
	};

	observeComponents([new GooglePlusNotifications()]);
})();

