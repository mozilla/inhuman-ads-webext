/* globals log */
/* globals communication, auth, buildSettings */

"use strict";

this.main = (function() {
  let exports = {};
  
  communication.register("uploadAd", catcher.watchFunction((sender, options) => {
      log.warn("HELLO");
    let { shotId, shotDomain } = options;
    return auth.authHeaders().then((headers) => {
      headers["content-type"] = "application/json";
      let body = JSON.stringify({shotId: shotId});
      return fetch(buildSettings.inhumanAjaxUrl, {
        method: "PUT",
        mode: "cors",
        headers,
        body
      });
    }).then((resp) => {
      if (!resp.ok) {
        let exc = new Error(`Response failed with status ${resp.status}`);
        exc.popupMessage = "REQUEST_ERROR";
        throw exc;
      } else {
      }
    }, (error) => {
      // FIXME: I'm not sure what exceptions we can expect
      error.popupMessage = "CONNECTION_ERROR";
      throw error;
    });
  }));

  return exports;
})();
null;
