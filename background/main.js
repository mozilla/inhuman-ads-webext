/* globals log */
/* globals communication, auth, getSettings */

"use strict";

this.main = (function() {
  let exports = {};

  communication.register("uploadAd", catcher.watchFunction((sender, options) => {
    let { shotId, shotDomain } = options;
    return Promise.all([auth.authHeaders(), getSettings()]).then(([headers, settings]) => {
      headers["content-type"] = "application/json";
      let body = JSON.stringify({
        shotId: shotId,
        shotDomain: shotDomain
      });
      let url = settings.serverUrl + settings.ajaxPath + "?action=inhuman_add_screenshot";
      return fetch(url, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers,
        body
      }).then((resp) => {
        if (!resp.ok) {
          let exc = new Error(`Response failed with status ${resp.status}`);
          exc.popupMessage = "REQUEST_ERROR";
          throw exc;
        } else {
          return resp.json();
        }
      }, (error) => {
        // FIXME: I'm not sure what exceptions we can expect
        error.popupMessage = "CONNECTION_ERROR";
        throw error;
      });
    });
  }));

  communication.register("updateShot", catcher.watchFunction((sender, data) => {
    Promise.all([auth.authHeaders(), getSettings()]).then(([headers, settings]) => {
      headers["content-type"] = "application/json";
      let body = JSON.stringify(data);
      let url = settings.serverUrl + settings.ajaxPath + "?action=inhuman_update_screenshot"
      return fetch(url, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers,
        body
      }).then((resp) => {
        if (!resp.ok) {
          let exc = new Error(`Response failed with status ${resp.status}`);
          exc.popupMessage = "REQUEST_ERROR";
          throw exc;
        } else {
          return resp.json();
        }
      }, (error) => {
        // FIXME: I'm not sure what exceptions we can expect
        error.popupMessage = "CONNECTION_ERROR";
        throw error;
      });
    });
  }));

  browser.runtime.onMessage.addListener((req, sender, sendResponse) => {
    return communication.onMessage(req, sender, sendResponse);
  });

  return exports;
})();
null;
