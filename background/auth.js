/* globals log */
/* globals main, makeUuid, catcher, communication, getSettings */

"use strict";

this.auth = (function() {
  let exports = {};

  let registrationInfo;
  let initialized = false;
  let authHeader = null;

  let registrationInfoFetched = catcher.watchPromise(browser.storage.local.get(["registrationInfo"]).then((result) => {
    if (result.registrationInfo) {
      registrationInfo = result.registrationInfo;
    } else {
      registrationInfo = generateRegistrationInfo();
      log.info("Generating new device authentication ID", registrationInfo);
      return browser.storage.local.set({registrationInfo});
    }
  }));

  exports.getDeviceId = function() {
    return registrationInfo && registrationInfo.deviceId;
  };

  function generateRegistrationInfo() {
    let info = {
      deviceId: `anon${makeUuid()}`,
      secret: makeUuid(),
      registered: false
    };
    return info;
  }

  function register() {
    return new Promise((resolve, reject) => {
      getSettings().then((settings) => {
        let registerUrl = settings.serverUrl + settings.ajaxPath + "?action=inhuman_register";
        let body = JSON.stringify({
          deviceId: registrationInfo.deviceId,
          secret: registrationInfo.secret
        });
        // TODO: replace xhr with Fetch #2261
        let req = new XMLHttpRequest();
        req.open("POST", registerUrl);
        req.setRequestHeader("content-type", "application/json");
        req.onload = catcher.watchFunction(() => {
          if (req.status == 200) {
            log.info("Registered login");
            initialized = true;
            saveAuthInfo(req.getResponseHeader('Set-Cookie'), JSON.parse(req.responseText));
            resolve(true);
          } else {
            log.warn("Error in response:", req.responseText);
            let exc = new Error("Bad response: " + req.status);
            exc.popupMessage = "LOGIN_ERROR";
            reject(exc);
          }
        });
        req.onerror = catcher.watchFunction(() => {
          let exc = new Error("Error contacting server");
          exc.popupMessage = "LOGIN_CONNECTION_ERROR";
          reject(exc);
        });
        req.send(body);
      });
    });
  }

  function login(options) {
    let { noRegister } = options || {};
    return new Promise((resolve, reject) => {
      getSettings().then((settings) => {
        let loginUrl = settings.serverUrl + settings.ajaxPath + "?action=inhuman_login";
        let body = JSON.stringify({
          action: "inhuman_login",
          deviceId: registrationInfo.deviceId,
          secret: registrationInfo.secret
        });
        // TODO: replace xhr with Fetch #2261
        let req = new XMLHttpRequest();
        req.open("POST", loginUrl);
        req.onload = catcher.watchFunction(() => {
          if (req.status == 404) {
            if (noRegister) {
              resolve(false);
            } else {
              resolve(register());
            }
          } else if (req.status >= 300) {
            log.warn("Error in response:", req.responseText);
            let exc = new Error("Could not log in: " + req.status);
            exc.popupMessage = "LOGIN_ERROR";
            reject(exc);
          } else if (req.status === 0) {
            let error = new Error("Could not log in, server unavailable");
            error.popupMessage = "LOGIN_CONNECTION_ERROR";
            reject(error);
          } else {
            // HTTP 200
            // FIXME: fails if response is malformed (e.g. server malfunction)
            initialized = true;
            let jsonResponse = JSON.parse(req.responseText);
            log.info("Screenshots logged in");
            saveAuthInfo(req.getResponseHeader('Set-Cookie'), jsonResponse);
            resolve(true);
          }
        });
        req.onerror = catcher.watchFunction(() => {
          let exc = new Error("Connection failed");
          exc.url = loginUrl;
          exc.popupMessage = "CONNECTION_ERROR";
          reject(exc);
        });
        req.setRequestHeader("content-type", "application/json");
        req.send(body);
      });
    })
  }

  function saveAuthInfo(cookieHeader, responseJson) {
    log.info("Cookie header: " + cookieHeader);
    if (responseJson.authHeader) {
      authHeader = responseJson.authHeader;
      if (!registrationInfo.registered) {
        registrationInfo.registered = true;
        catcher.watchPromise(browser.storage.local.set({registrationInfo}));
      }
    }
  }

  exports.getDeviceId = function() {
    return registrationInfo.deviceId;
  };

  exports.authHeaders = function() {
    log.info("authHeaders: initialized: " + initialized);
    let initPromise = Promise.resolve();
    if (!initialized) {
      initPromise = login();
    }
    return initPromise.then(() => {
      if (authHeader) {
        return {"x-inhuman-auth": authHeader};
      }
      log.warn("No auth header available");
      return {};
    });
  };

  communication.register("requestLogin", catcher.watchFunction((sender, data) => {
    return auth.authHeaders().then((headers) => {
      return {success: true};
    });
  }));

  communication.register("getAuthInfo", (sender, options) => {
    return registrationInfoFetched.then(() => {
      let info = registrationInfo;
      if (info.registered) {
        return login().then((result) => {
          return {deviceId: registrationInfo.deviceId};
        });
      }
      return info;
    });
  });

  return exports;
})();
