module.exports = (() => {
  "use strict";

  const EventEmitter = require("events").EventEmitter;
  const util = require("util");
  const Twit = require("twit");

  class TwitterComment {

    constructor() {
      this.twitter = null;
      this._event = new EventEmitter();
      this._stream = null;
      this._streamType = "";
      this._streaming = false;
      this.textNg = [];
      this.userNg = [];
      this.sourceNg = [];
      this.options = {
        excludeMention: true,
        excludeRetweet: true,
        excludeHashtag: true,
        excludeUrl: true,
        applyThemeColor: true
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
      this.twitter = new Twit({
        consumer_key: auth.consumer_key,
        consumer_secret: auth.consumer_secret,
        access_token: auth.access_token_key,
        access_token_secret: auth.access_token_secret
      });
    }

    userStream() {
      this.destroyStream();
      this._streamType = "user";
      this._streaming = true;
      this._registerStreamCallback(
        this.twitter.stream("user", {}));
    }

    filterStream(track) {
      this.destroyStream();
      this._streamType = "filter";
      this._streaming = true;
      this._registerStreamCallback(
        this.twitter.stream("statuses/filter", { track }));
    }

    destroyStream() {
      if (!this._streaming) return;
      this._stream.stop();
      this._stream = null;
      this._streamType = "";
      this._streaming = false;
    }

    _registerStreamCallback(stream) {
      const table = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">"
      };

      let streamStartAt, streaming = false;

      const setup = (() => {
        if (streaming) return;
        streaming = true;
        streamStartAt = Date.now();
        this._event.emit("stream");
      }).bind(this);

      const destroy = (err => {
        this.destroyStream();
        streaming = false;
        this._event.emit("error", err);
      }).bind(this);

      this._stream = stream;

      stream.on("connect", () => {
        console.log("connect");
        setup();
      });

      stream.on("disconnect", () => {
        console.log("disconnect");
        destroy();
      });

      stream.on("reconnect", () => {
        console.log("reconnect");
      });

      stream.on("tweet", (tweet => {
        function getKey(obj, args) {
          return args.reduce((obj2, current) => {
            if (obj2 === void 0) return void 0;
            return obj2[current];
          }, obj);
        }

        if (!tweet || !tweet.text || this.options.excludeRetweet && tweet.retweeted) return;

        if (this.userNg.some(ng => {
          if (ng === null) return false;
          if (util.isRegExp(ng))
            return ng.test(tweet.user.screen_name);
          return tweet.user.screen_name === ng;
        })) return;

        if (this.textNg.some(ng => {
          if (ng === null) return false;
          if (util.isRegExp(ng))
            return ng.test(tweet.text);
          return tweet.text.indexOf(ng) >= 0;
        })) return;

        const sourceMatch = tweet.source.match(/<a.*?>(.*?)<\/a>/);
        const source = sourceMatch && sourceMatch[1] ? sourceMatch[1] : tweet.source;
        if (this.sourceNg.some(ng => {
          if (ng === null) return false;
          if (util.isRegExp(ng))
            return ng.test(source);
          return source.indexOf(ng) >= 0;
        })) return;

        const mentionsLength = getKey(tweet, ["entities", "user_mentions", "length"]) || 0;
        if (this.options.excludeMention && mentionsLength > 0) return;

        let text = tweet.text;

        const hashtagsLength = getKey(tweet, ["entities", "hashtags", "length"]) || 0;
        if (this.options.excludeHashtag && hashtagsLength > 0) {
          tweet.entities.hashtags.forEach(hashtag => {
            text = text.replace("#" + hashtag.text, "");
          });
        }

        const mediaLength = getKey(tweet, ["entities", "media", "length"]) || 0;
        if (this.options.excludeUrl && mediaLength > 0) {
          tweet.entities.media.forEach(url => {
            text = text.replace(url.url, "");
          });
        }

        const urlsLength = getKey(tweet, ["entities", "urls", "length"]) || 0;
        if (this.options.excludeUrl && urlsLength > 0) {
          tweet.entities.urls.forEach(url => {
            text = text.replace(url.url, "");
          });
        }

        text = text.replace(/&(amp|lt|gt);/g, m => table[m]);

        text = text.trim();

        let color = "";

        const linkColor = getKey(tweet, ["user", "profile_link_color"]);
        if (this.options.applyThemeColor && linkColor !== void 0 && linkColor !== "0084B4") {
          color = "#" + tweet.user.profile_link_color;
        }

        const size = "";
        const position = "";
        const date = Date.parse(tweet.created_at);
        const vpos = date - streamStartAt;
        // const date = (tweet.id >> 22) + 1288834974657;

        this._event.emit("chat", {
          text,
          color,
          size,
          position,
          vpos,
          data: {
            userId: tweet.user.id_str,
            screenName: tweet.user.screen_name,
            source,
            date: Math.round(date / 1000),
            datem: date
          }
        });

      }).bind(this));

      stream.on("error", error => {
        destroy(error);
      });
    }

  }

  return TwitterComment;

})();
