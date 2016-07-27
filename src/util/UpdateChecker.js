/* eslint { strict: [2, "global"] } */
"use strict";

const fs = require("fs");
const https = require("https");

class UpdateChecker {
  constructor(options) {
    // TODO: Object.assign & Default parameters
    options = options || {};

    this.options = {
      user: options.user,
      repos: options.repos,
      api: options.api || "api.github.com"
    };

    this.current = null;
    this.latest = null;
  }

  getCurrent() {
    if (this.current !== null) return Promise.resolve(this.current);

    return new Promise(((resolve, reject) => {
      fs.readFile("package.json", ((err, data) => {
        if (err) {
          reject(err);
          return;
        }

        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          reject(e);
          return;
        }

        this.current = json;
        resolve(json);
      }).bind(this));
    }).bind(this));
  }

  getLatest() {
    if (this.latest !== null) return Promise.resolve(this.latest);

    return new Promise(((resolve, reject) => {
      const options = {
        hostname: this.options.api,
        path: `/repos/${this.options.user}/${this.options.repos}/releases/latest`,
        headers: { "user-agent": "UpdateChecker" }
      };

      https.get(options, (res => {
        if (res.statusCode !== 200) {
          reject(new Error("Status code is " + res.statusCode));
          return;
        }

        let data = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", (() => {
          let json;
          try {
            json = JSON.parse(data);
          } catch (e) {
            reject(e);
          }

          this.latest = json;
          resolve(json);
        }).bind(this));

        res.on("error", err => {
          reject(err);
        });
      }).bind(this));
    }).bind(this));
  }

  getCurrentVersion() {
    return this.getCurrent().then(current => {
      if (!current.hasOwnProperty("version")) return "";

      return current.version;
    });
  }

  getLatestVersion() {
    return this.getLatest().then(latest => {
      if (!latest.hasOwnProperty("tag_name")) return "";

      let version = latest.tag_name;

      if (version[0] === "v") {
        version = version.slice(1);
      }

      return version;
    });
  }

  getCurrentUrl() {
    return this.getCurrent().then(current => {
      if (!current.hasOwnProperty("repository")) return "";
      if (!current.repository.hasOwnProperty("url")) return "";

      return current.repository.url;
    });
  }

  getLatestUrl() {
    return this.getLatest().then(latest => {
      if (!latest.hasOwnProperty("html_url")) return "";

      return latest.html_url;
    });
  }

  check() {
    return Promise.all([
      this.getCurrentVersion(),
      this.getLatestVersion()
    ]).then((versions => {
      const current = versions[0];
      const latest = versions[1];

      if (current === latest) return null;

      return Promise.all([
        this.getCurrentUrl(),
        this.getLatestUrl()
      ]).then(urls => {
        return {
          current: {
            version: current,
            url: urls[0]
          },
          latest: {
            version: latest,
            url: urls[1]
          }
        };
      });
    }).bind(this));
  }
}

module.exports = UpdateChecker;
