/* globals log */
/* globals communication, auth, buildSettings */

"use strict";

this.main = (function() {
  let exports = {};

  communication.register("uploadAd", catcher.watchFunction((sender, options) => {
    let { shotId, shotDomain } = options;
    return auth.authHeaders().then((headers) => {
      headers["content-type"] = "application/json";
      let body = JSON.stringify({
        shotId: shotId,
        shotDomain: shotDomain
      });
      return fetch(buildSettings.inhumanAjaxUrl + "?action=inhuman_add_screenshot", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers,
        body
      });
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
  }));

  browser.runtime.onMessage.addListener((req, sender, sendResponse) => {
    return communication.onMessage(req, sender, sendResponse);
  });

  return exports;
})();
null;
