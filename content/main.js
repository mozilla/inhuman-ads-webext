/* globals catcher, callBackground, buildSettings */

/* 
 * This is a content script added to all screenshots.firefox.com &
 * inhumanads.com pages, and allows the sites to communicate with the
 * add-on
 */

"use strict";

this.main = (function() {
  function addSendShotButton() {
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

  function addUpdatePostButton() {
    $("#screenshot-meta-form").submit(function(e) {
      e.preventDefault();

      var data = {}
      $.each(this.elements, function(i, v){
        var input = $(v);
        if ("checkbox" == input.prop('type'))
          data[input.attr("name")] = input.prop('checked');
        else        
          data[input.attr("name")] = input.val();
        delete data["undefined"];
      });

      catcher.watchPromise(callBackground("updateShot", data).then((info) => {
        location = buildSettings.inhumanHomeUrl;
      }).catch((e) => {
        alert('fail: ' + e);
      }));
    });
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
        alert(e);
      }));
    });
  }

  function setup() {
    // Add a hidden element we track to prevent modifying the page twice
    var e = document.createElement('span');
    e.setAttribute('id', 'inhuman-ads-setup');
    e.style = 'display: none;';
    document.documentElement.appendChild(e);

    switch (document.location.host) {
    case "screenshots.firefox.com":
      addSendShotButton();
      break;
    case "inhumanads.com":
    case "inhuman.sandmill.org":
    case "localhost:8888":
      addUpdatePostButton();
      proxyPageEvent("inhumanRequestLogin", "requestLogin");
      break;
    }
  }

  if (!document.getElementById('inhuman-ads-setup'))
    setup();

})();
null;
