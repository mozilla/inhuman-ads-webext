"use strict";

this.getSettings = (function() {

  var defaults = {
    serverUrl: 'https://inhumanads.com/',
    ajaxPath: 'wp-admin/admin-ajax.php',
    logLevel: 'debug'
  };

  return function getSettings() {
    return new Promise((resolve, reject) => {
      browser.storage.local.get().then((settings) => {
        for (var key in defaults) {
          if ('undefined' == typeof(settings[key]))
            settings[key] = defaults[key];
        }
        resolve(settings);
      });
    });
  };

})();
null;
