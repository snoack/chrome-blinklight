(function() {
	var ledControl = document.querySelector('embed[type="application/x-led-control"]').LedControl();

	var form = document.forms[0];
	var ledSelect = form.elements.namedItem('led');
	var behaviorRadios = form.elements.namedItem('behavior');

	var instructions = document.getElementById('instructions');
	var commands = instructions.getElementsByTagName('code')[0];

	var updateInstructions = function(led) {
		instructions.classList.add('hidden');
		commands.innerHTML = '';

		if (!led || !form.querySelector('[name=behavior]:checked'))
			return;

		if (!led.canControl) {
			['brightness', 'trigger'].forEach(function(file) {
				var cmd = document.createElement('span');
				cmd.innerText = "chmod a+rw /sys/class/leds/" + led.led + "/" + file;
				commands.appendChild(cmd);
			});

			instructions.classList.remove('hidden');
		}

		if (form.querySelector('[name=behavior][value=blink-permanant]').checked)
		if (led.availableTriggers.indexOf('timer') == -1) {
			var cmd = document.createElement('span');
			cmd.innerText = 'modprobe ledtrig_timer';
			commands.appendChild(cmd);
			instructions.classList.remove('hidden');
		}
	};

	var updateUI = function(settings) {
		if (settings.led)
			ledSelect.value = settings.led;

		if (settings.behavior)
			form.querySelector('[name=behavior][value=' + settings.behavior + ']').checked = true;

		updateInstructions(ledSelect.value && ledControl.getLed(ledSelect.value));
	};

	ledControl.getAllLeds().forEach(function(led) {
		var opt = document.createElement('option');
		opt.innerText = opt.value = led.led;

		ledSelect.appendChild(opt)
		ledSelect.value = '';
		ledSelect.addEventListener('change', function() {
			if (ledSelect.selectedOptions[0] == opt) {
				chrome.storage.local.set({led: led.led});
				updateInstructions(led);
			}
		}, false);
	});

	for (var i = 0; i < behaviorRadios.length; i++)
		behaviorRadios[i].addEventListener('change', function(event) {
			var led;

			if (!event.target.checked)
				return;

			if (ledSelect.value && (led = ledControl.getLed(ledSelect.value)))
				updateInstructions(led);

			chrome.storage.local.set({behavior: event.target.value});
		}, false);

	chrome.storage.local.get(['led', 'behavior'], function(settings) {
		updateUI(settings);

		chrome.storage.onChanged.addListener(function(changes) {
			var settings = {};

			for (var k in changes)
				settings[k] = changes[k].newValue;

			updateUI(settings);
		});
	});
})();
