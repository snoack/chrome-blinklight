(function() {
	var IRCCloud = function() {
		Component.apply(this, arguments);
	};
	IRCCloud.prototype = {
		__proto__: Component.prototype,
		findElement: function() {
			return document.getElementById('buffers');
		},
		isUrgent: function(el) {
			var badges = el.getElementsByClassName('badge');

			for (var i = 0; i < badges.length; i++)
				if (badges[i].innerHTML)
					return true;

			return false;
		},
		mutationObserverOptions: {
			childList: true,
			subtree: true
		}
	};

	observeComponents([new IRCCloud()]);
})();

