function saveOptions(e) {
  browser.storage.local.set({
    serverUrl: document.querySelector("#server-url").value
  });
  e.preventDefault();
}

function restoreOptions() {
  var gettingItem = browser.storage.local.get('serverUrl');
  gettingItem.then((res) => {
    document.querySelector("#server-url").value = res.serverUrl || '';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
