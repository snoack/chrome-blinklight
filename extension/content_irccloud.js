(function() {
	var IRCCloud = function() {
		Component.apply(this, arguments);
	};
	IRCCloud.prototype = {
		__proto__: Component.prototype,
		findElement: function() {
			return document.getElementById('buffers');
		},
		count: function(el) {
			var badges = el.getElementsByClassName('badge');
			var n = 0;

			for (var i = 0; i < badges.length; i++)
				n += parseInt(badges[i].innerText) || 0;

			return n;
		},
		mutationObserverOptions: {
			childList: true,
			subtree: true
		}
	};

	observeComponents([new IRCCloud()]);
})();

