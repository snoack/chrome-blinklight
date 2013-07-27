(function() {
	var Inbox = function() {
		Component.apply(this, arguments);
	};
	Inbox.prototype = {
		__proto__: Component.prototype,
		name: 'inbox',
		findElement: function() {
			return document.querySelector('a.J-Ke[href$="#inbox"]');
		},
		isUrgent: function(el) {
			return / \(\d+\)/.test(el.innerText);
		},
		mutationObserverOptions: {
			childList: true,
			subtree: true
		},
		getMutationObserverTarget: function(el) {
			var target = el;

			while (true) {
				if (target.classList.contains('TK'))
					return target;
				target = target.parentNode;
			}
		},
		prepareElementForMutationObserverCallback: function() {
			return this.findElement();
		}
	};

	var GTalk = function() {
		Component.apply(this, arguments);
	};
	GTalk.prototype = {
		__proto__: Component.prototype,
		name: 'gtalk',
		findElement: function() {
			return document.getElementsByClassName('aj3')[0];
		},
		isUrgent: function(el) {
			return el.getElementsByClassName('vE').length > 0;
		},
		mutationObserverOptions: {
			attributes: true,
			subtree: true
		}
	};

	observeComponents([new Inbox(), new GTalk()]);
})();
