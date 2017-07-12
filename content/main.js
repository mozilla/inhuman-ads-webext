/* globals catcher, callBackground */
/** This is a content script added to all screenshots.firefox.com pages, and allows the site to
    communicate with the add-on */

"use strict";

this.main = (function() {
  function addButton() {
    var new_button = document.createElement('a');
    new_button.setAttribute('id', 'inhuman-ads-send');
    new_button.setAttribute('href', '#');
    new_button.setAttribute('class', 'button primary');
    new_button.textContent = 'Send to Inhuman Ads';
    new_button.style = 'margin-left: 1em;';
    new_button.onclick = function(event) {
      event.preventDefault();
      var [foo, id, site] = document.location.pathname.split('/');
      catcher.watchPromise(callBackground("uploadAd", {shotId: id, shotDomain: site}).then((info) => {
        // navigate to edit page
        location = info.editUrl;
      }).catch((e) => {
        alert(e);
      }));
      
    };

    var actions = document.querySelector(".shot-alt-actions");
    actions.appendChild(new_button);
  }
  if (!document.getElementById('inhuman-ads-send')) {
    addButton();
  }
})();
null;
