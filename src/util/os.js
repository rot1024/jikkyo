(() => {
  "use strict";
  var r, p = process.platform;
  if (p === "win32" || p === "win64")
    r = "win";
  else if (p === "darwin")
    r = "mac";
  else
    r = "linux";
  module.exports = r;
})();
