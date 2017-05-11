function getDebLink(arch) {
  var version = chrome.runtime.getManifest().version;
  if (arch == "x86-32")
    arch = "i386";
  else if (arch == "x86-64")
    arch = "amd64";
  else if (navigator.platform.includes("aarch64"))
    arch = "arm64";
  else if (arch == "arm")
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

function getLeds() {
  chrome.runtime.sendMessage("get-leds", function(leds) {
    if (!leds) {
      document.documentElement.dataset.view = "connection-failed";
      setTimeout(getLeds, 1000);
    } else if (leds.length > 0) {
      document.documentElement.dataset.view = "settings";
      initSettings(leds);
    } else {
      document.documentElement.dataset.view = "no-leds";
    }
  });
}

chrome.runtime.getPlatformInfo(function(info) {
  if (info.os != "linux")
    document.documentElement.dataset.view = "os-not-supported";
  else
    getLeds();
  document.getElementById("deb-link").href = getDebLink(info.arch);
});

document.addEventListener("change", function(event) {
  chrome.storage.local.set({[event.target.name]: event.target.value});
  checkLedError();
}, true);
