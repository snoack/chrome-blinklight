function getDebLink() {
  var version = chrome.runtime.getManifest().version;
  var arch = "i386";
  if (navigator.platform.includes("x86_64"))
    arch = "amd64";
  else if (navigator.platform.includes("aarch64"))
    arch = "arm64";
  else if (navigator.platform.includes("armv"))
    arch = "armhf";
  return "https://launchpad.net/~s.noack/+archive/ubuntu/ppa/+files/chrome-blinklight_" + version + "_" + arch + ".deb";
}

function checkLedError() {
  chrome.runtime.sendMessage("get-last-error", function(error) {
    document.getElementById("led").dataset.error = error;
  });
}

function initSettings(leds) {
  var ledRadios = document.getElementById("leds");
  var ledTemplate = document.getElementById("template-led");

  leds.sort();
  for (var i = 0; i < leds.length; i++) {
    var led = leds[i];
    var clone = document.importNode(ledTemplate.content, true);

    clone.querySelector("input").value = led;
    clone.querySelector("span").textContent = led;

    ledRadios.appendChild(clone);
  }

  chrome.storage.local.get(["led", "trigger"], function(options) {
    for (var option in options) {
      var input = document.querySelector("input[name='" + option + "'][value='" + options[option] + "']");
      if (input)
        input.checked = true;
    }

    if ("led" in options)
      checkLedError();
  });
}

function init() {
  chrome.runtime.sendMessage("get-leds", function(leds) {
    if (leds) {
      if (leds.length > 0) {
        initSettings(leds);
        document.documentElement.dataset.view = "settings";
      } else
        document.documentElement.dataset.view = "no-leds";
    }
    else if (!/^Linux\b/.test(navigator.platform) || /\bCrOS\b/.test(navigator.userAgent))
      document.documentElement.dataset.view = "os-not-supported";
    else {
      document.documentElement.dataset.view = "connection-failed";
      setTimeout(init, 1000);
    }
  });
}

init();

document.addEventListener("change", function(event) {
  chrome.storage.local.set({[event.target.name]: event.target.value});
  checkLedError();
}, true);

document.getElementById("deb-link").href = getDebLink();
