(function() {
	var sidebar = document.getElementById('sidebar');

	if (!sidebar)
		return;

	var isAlreadyUrgent = false;
	var checkUrgent = function() {
		var badges = sidebar.getElementsByClassName('badge');
		var urgent = false;

		for (var i = 0; i < badges.length; i++)
			if (badges[i].innerHTML) {
				urgent = true;
				break;
			}

		if (isAlreadyUrgent != urgent) {
			chrome.runtime.sendMessage(urgent);
			isAlreadyUrgent = urgent;
		}
	};

	checkUrgent();

	(new MutationObserver(function(mutations) {
		checkUrgent();
	})).observe(sidebar, {
		childList: true,
		subtree: true
	});
})();

