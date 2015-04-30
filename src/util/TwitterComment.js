module.exports = (() => {
  "use strict";

  var EventEmitter = require("events").EventEmitter,
      Twitter = require("twitter");

  class TwitterComment {

    constructor() {
      this.twitter = null;
      this._event = new EventEmitter();
      this._stream = null;
      this._streamType = "";
      this._streaming = false;
      this.options = {
        excludeMention: true,
        excludeRetweet: true,
        excludeHashtag: true,
        excludeUrl: true
      };
    }

    get isStreaming() {
      return this._streaming;
    }

    on() {
      this._event.on.apply(this._event, arguments);
    }

    once() {
      this._event.once.apply(this._event, arguments);
    }

    off() {
      this._event.off.apply(this._event, arguments);
    }

    auth(auth) {
      this.twitter = new Twitter({
        consumer_key: auth.consumer_key,
        consumer_secret: auth.consumer_secret,
        access_token_key: auth.access_token_key,
        access_token_secret: auth.access_token_secret
      });
    }

    userStream() {
      this.destroyStream();
      this._streamType = "user";
      this._streaming = true;
      this.twitter.stream("user", {}, this._streamCb.bind(this));
    }

    filterStream(track) {
      this.destroyStream();
      this._streamType = "filter";
      this._streaming = true;
      this.twitter.stream("statuses/filter", { track: track }, this._streamCb.bind(this));
    }

    destroyStream() {
      if (!this._streaming) return;
      this._stream.destroy();
      this._stream = null;
      this._streamType = "";
      this._streaming = false;
    }

    _streamCb(stream) {
      var streamStartAt;

      var setup = (() => {
        streamStartAt = Date.now();
        this._event.emit("stream");
      }).bind(this);

      var destroy = (err => {
        this.destroyStream();
        this._event.emit("error", err);
      }).bind(this);

      this._stream = stream;

      stream.on("data", (tweet => {

        if (tweet.friends && this._streamType === "user") {
          setup();
          return;
        }

        if (tweet.disconnect) {
          destroy();
          return;
        }

        if (!tweet || !tweet.text ||
          this.options.excludeRetweet && tweet.retweeted) return;

        if (this.options.excludeMention &&
            tweet.entities &&
            tweet.entities.user_mentions &&
            tweet.entities.user_mentions.length > 0) return;

        var text = tweet.text;

        if (this.options.excludeHashtag &&
            tweet.entities &&
            tweet.entities.hashtags &&
            tweet.entities.hashtags.length > 0) {
          tweet.entities.hashtags.forEach(hashtag => {
            text = text.replace("#" + hashtag.text, "");
          });
        }

        if (this.options.excludeUrl &&
            tweet.entities &&
            tweet.entities.media &&
            tweet.entities.media.length > 0) {
          tweet.entities.media.forEach(url => {
            text = text.replace(url.url, "");
          });
        }

        if (this.options.excludeUrl &&
            tweet.entities &&
            tweet.entities.urls &&
            tweet.entities.urls.length > 0) {
          tweet.entities.urls.forEach(url => {
            text = text.replace(url.url, "");
          });
        }

        text = text.trim();

        const color = void(0);
        const size = void(0);
        const position = void(0);
        const vpos = Date.parse(tweet.created_at) - streamStartAt;

        this._event.emit("chat", {
          text: text,
          color: color,
          size: size,
          position: position,
          vpos: vpos
        });
      }).bind(this));

      stream.on("error", error => {
        destroy(error);
      });

      if (this._streamType !== "user") {
        setup();
      }

    }

  }

  return TwitterComment;

})();
