"use strict";

var fs = require("fs"),
    https = require("https");

var UpdateChecker = {
  getLatestVersion: () => {
    var deferred = Promise.defer();

    var options = {
      hostname: "api.github.com",
      path: "/repos/rot1024/jikkyo/releases/latest",
      headers: {
        "user-agent": "jikkyo"
      }
    };

    https.get(options, res => {
      if (res.statusCode !== 200)
        return deferred.reject("status code is " + res.statusCode);

      var arrData = [];

      res.on("data", data => {
        arrData.push(data);
      });

      res.on("end", () => {
        var data = Buffer.concat(arrData).toString("utf8");
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
