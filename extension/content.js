(function() {
  var titles;

  var observer = new MutationObserver(function() {
    if (!titles.has(document.title)) {
      titles.add(document.title);
      chrome.runtime.sendMessage("notify");
    }
  });

  function observe() {
    var element = document.querySelector('title');
    if (element) {
      titles = new Set([document.title]);
      observer.observe(element, {characterData: true, childList: true});
    }
  }

  document.addEventListener("visibilitychange", function() {
    if (document.hidden)
      observe();
    else {
      if (titles.size > 1)
        chrome.runtime.sendMessage("clear");

      titles = null;
      observer.disconnect();
    }
  });

  if (document.hidden)
    observe();
})();
