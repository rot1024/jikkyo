"use strict";

var fs = require("fs"),
    https = require("https");

var UpdateChecker = {
  getLatestVersion: () => {
    var deferred = Promise.defer();

    https.get("https://api.github.com/repos/rot1024/jikkyo/releases/latest", res => {
      if (res.statusCode !== 200)
        return deferred.reject("status code is " + res.statusCode);
      res.on("data", data => {
        try {
          var json = JSON.parse(data);
          if (!("tag_name" in json))
            return deferred.reject("release not found");
          var name = json.tag_name;
          if (name[0] === "v")
            name = name.slice(1);
          deferred.resolve(name);
        } catch(e) {
          deferred.reject(e);
        }
      });
    }).on("error", e => deferred.reject(e));

    return deferred.promise;
  }
};

try {
  var packagejson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  if (packagejson.version)
    UpdateChecker.currentVersion = packagejson.version;
  if (packagejson.homepage)
    UpdateChecker.homepageURL = packagejson.homepage;
  if (packagejson.repository && packagejson.repository.url)
    UpdateChecker.repositoryURL = packagejson.repository.url;
} catch(e) {
  UpdateChecker.currentVersion = "";
  UpdateChecker.homepageURL = "";
  UpdateChecker.repositoryURL = "";
}

module.exports = UpdateChecker;
