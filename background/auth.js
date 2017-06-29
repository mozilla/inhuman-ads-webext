/* globals log */
/* globals main, makeUuid, catcher, buildSettings, communication */

"use strict";

this.auth = (function() {
  let exports = {};

  let registrationInfo;
  let initialized = false;
  let authHeader = null;
  let sentryPublicDSN = null;
  let abTests = {};

  let registrationInfoFetched = catcher.watchPromise(browser.storage.local.get(["registrationInfo", "abTests"]).then((result) => {
    if (result.abTests) {
      abTests = result.abTests;
    }
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
      let registerUrl = buildSettings.inhumanAjaxUrl; //main.getBackend() + "/api/register";
      // TODO: replace xhr with Fetch #2261
      let req = new XMLHttpRequest();
      req.open("POST", registerUrl);
      req.setRequestHeader("content-type", "application/json");
      req.onload = catcher.watchFunction(() => {
        if (req.status == 200) {
          log.info("Registered login");
          initialized = true;
          saveAuthInfo(JSON.parse(req.responseText));
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
      req.send(JSON.stringify({
        deviceId: registrationInfo.deviceId,
        secret: registrationInfo.secret
      }));
    });
  }

  function login(options) {
    let { noRegister } = options || {};
    return new Promise((resolve, reject) => {
      log.warn("HELLO");
      let loginUrl = buildSettings.inhumanAjaxUrl; //main.getBackend() + "/api/login";
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
          initialized = true;
          let jsonResponse = JSON.parse(req.responseText);
          log.info("Screenshots logged in");
          saveAuthInfo(jsonResponse);
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
      req.send(JSON.stringify({
        deviceId: registrationInfo.deviceId,
        secret: registrationInfo.secret
      }));
    });
  }

  function saveAuthInfo(responseJson) {
    if (responseJson.sentryPublicDSN) {
      sentryPublicDSN = responseJson.sentryPublicDSN;
    }
    if (responseJson.authHeader) {
      authHeader = responseJson.authHeader;
      if (!registrationInfo.registered) {
        registrationInfo.registered = true;
        catcher.watchPromise(browser.storage.local.set({registrationInfo}));
      }
    }
    if (responseJson.abTests) {
      abTests = responseJson.abTests;
      catcher.watchPromise(browser.storage.local.set({abTests}));
    }
  }

  exports.getDeviceId = function() {
    return registrationInfo.deviceId;
  };

  exports.authHeaders = function() {
    let initPromise = Promise.resolve();
    if (!initialized) {
      initPromise = login();
    }
    return initPromise.then(() => {
      if (authHeader) {
        return {"x-screenshots-auth": authHeader};
      }
      log.warn("No auth header available");
      return {};
    });
  };

  exports.getSentryPublicDSN = function() {
    return sentryPublicDSN || buildSettings.defaultSentryDsn;
  };

  exports.getAbTests = function() {
    return abTests;
  };

  exports.isRegistered = function() {
    return registrationInfo.registered;
  };

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
