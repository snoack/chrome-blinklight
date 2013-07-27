(function() {
	if (document.referrer.indexOf('https://mail.google.com/mail/') != 0)
	if (document.referrer.indexOf('https://plus.google.com/') != 0)
		return;

	var Hangout = function() {
		Component.apply(this, arguments);
	};
	Hangout.prototype = {
		__proto__: Component.prototype,
		name: 'hangout',
		findElement: function() {
			return document.getElementsByClassName('Ln')[0];
		},
		isUrgent: function(el) {
			return el.getElementsByClassName('ee').length > 0;
		},
		mutationObserverOptions: {
			attributes: true,
			subtree: true
		}
	};

	observeComponents([new Hangout()]);
})();
