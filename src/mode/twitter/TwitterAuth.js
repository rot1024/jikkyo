/* eslint { strict: [2, "global"], "key-spacing": 0 } */
"use strict";

const oauth = require("oauth");

class TwitterAuth {
  constructor(options) {
    options = options || {};
    this.consumerKey = options.consumerKey;
    this.consumerSecret = options.consumerSecret;
    this.requestURL = options.requestURL || "https://api.twitter.com/oauth/request_token";
    this.accessURL = options.requestURL || "https://api.twitter.com/oauth/access_token";
    this.oAuthURL = options.oAuthURL || "https://api.twitter.com/oauth";
  }

  getAuthorizeURL() {
    const deferred = Promise.defer();

    const client = new oauth.OAuth(
      this.requestURL,
      this.accessURL,
      this.consumerKey,
      this.consumerSecret,
      "1.0",
      null,
      "HMAC-SHA1"
    );

    client.getOAuthRequestToken(((err, oAuthToken, oAuthTokenSecret) => {
      if (err) deferred.reject(err);

      this.oAuthToken = oAuthToken;
      this.oAuthTokenSecret = oAuthTokenSecret;

      deferred.resolve(`${this.oAuthURL}/authorize?oauth_token=${oAuthToken}`);
    }).bind(this));

    return deferred.promise;
  }

  getAccessToken(oauthVerifier) {
    const deferred = Promise.defer();

    const client = new oauth.OAuth(
      this.requestURL,
      this.accessURL,
      this.consumerKey,
      this.consumerSecret,
      "1.0",
      null,
      "HMAC-SHA1"
    );

    client.getOAuthAccessToken(
      this.oAuthToken,
      this.oAuthTokenSecret,
      oauthVerifier,
      (err, oAuthAccessToken, oAuthAccessTokenSecret) => {
        if (err) deferred.reject(err);
        deferred.resolve({
          accessToken: oAuthAccessToken,
          accessTokenSecret: oAuthAccessTokenSecret
        });
      }
    );

    return deferred.promise;
  }
}

module.exports = TwitterAuth;
