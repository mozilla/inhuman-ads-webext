/* globals catcher, callBackground, getSettings */

/* 
 * This is a content script added to all screenshots.firefox.com &
 * inhumanads.com pages, and allows the sites to communicate with the
 * add-on
 */

"use strict";

this.main = (function() {
  window.onload = function(e){
    function addSendShotButton() {
      // check if expire widget is present (as proxy for whether user took this screenshot)
      if (document.getElementsByClassName('expire-widget').length != 1)
        return;

      var new_button = document.createElement('a');
      new_button.setAttribute('id', 'inhuman-ads-send');
      new_button.setAttribute('href', '#');
      new_button.setAttribute('class', 'button primary');
      new_button.textContent = 'Send to Inhuman Ads';
      new_button.style = 'margin-left: 1em;';
      new_button.onclick = function(event) {
        event.preventDefault();
        var [foo, id, site] = document.location.pathname.split('/');
        getSettings().then((settings) => {
          location = settings.serverUrl + "submit/?action=submit" +
            "&shot-id=" + encodeURIComponent(id) +
            "&shot-site=" + encodeURIComponent(site);
        });
      };

      var actions = document.querySelector(".shot-alt-actions");
      actions.appendChild(new_button);
    }

    function proxyPageEvent(pageEvent, backgroundEvent) {
      document.addEventListener(pageEvent, function(e) {
        var callerId = e.detail;
        catcher.watchPromise(callBackground(backgroundEvent, {}).then((resp) => {
          var eventId = callerId + '-failure';
          if (resp.success)
            eventId = callerId + '-success';
          document.dispatchEvent(new CustomEvent(eventId));
        }).catch((e) => {
          console.log('event dispatch failed: ' + e);
        }));
      });
    }

    function setup() {
      // Add a hidden element we track to prevent modifying the page twice

      catcher.watchPromise(callBackground("addonVersion").then((version) => {
        var e = document.createElement('input');
        e.setAttribute('id', 'inhuman-ads-version');
        e.setAttribute('type', 'hidden');
        e.setAttribute('value', version);
        document.documentElement.appendChild(e);
      }));

      switch (document.location.host) {
      case "screenshots.firefox.com":
        addSendShotButton();
        break;
      }
    }
    if (!document.getElementById('inhuman-ads-version'))
      setup();
  };
})();
null;
