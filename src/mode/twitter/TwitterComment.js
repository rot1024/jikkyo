module.exports = (() => {
  "use strict";

  var EventEmitter = require("events").EventEmitter,
      util = require("util"),
      Twit = require("twit");

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
        this.twitter.stream("statuses/filter", { track: track }));
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
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>'
      };

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
        var getKey = (obj, args) => {
          return args.reduce((obj, current) => {
            if (obj === void(0)) return;
            return obj[current];
          }, obj);
        };

        if (!tweet || !tweet.text || this.options.excludeRetweet && tweet.retweeted) return;

        if (this.userNg.some(ng => {
          if (ng === null) return false;
          if (util.isRegExp(ng))
            return ng.test(tweet.user.screen_name);
          else
            return tweet.user.screen_name === ng;
        })) return;

        if (this.textNg.some(ng => {
          if (ng === null) return false;
          if (util.isRegExp(ng))
            return ng.test(tweet.text);
          else
            return tweet.text.indexOf(ng) >= 0;
        })) return;

        var sourceMatch = tweet.source.match(/<a.*?>(.*?)<\/a>/);
        var source = sourceMatch && sourceMatch[1] ? sourceMatch[1] : tweet.source;
        if (this.sourceNg.some(ng => {
          if (ng === null) return false;
          if (util.isRegExp(ng))
            return ng.test(source);
          else
            return source.indexOf(ng) >= 0;
        })) return;

        var mentions_length = getKey(tweet, ["entities", "user_mentions", "length"]) || 0;
        if (this.options.excludeMention && mentions_length > 0) return;

        var text = tweet.text;

        var hashtags_length = getKey(tweet, ["entities", "hashtags", "length"]) || 0;
        if (this.options.excludeHashtag && hashtags_length > 0) {
          tweet.entities.hashtags.forEach(hashtag => {
            text = text.replace("#" + hashtag.text, "");
          });
        }

        var media_length = getKey(tweet, ["entities", "media", "length"]) || 0;
        if (this.options.excludeUrl && media_length > 0) {
          tweet.entities.media.forEach(url => {
            text = text.replace(url.url, "");
          });
        }

        var urls_length = getKey(tweet, ["entities", "urls", "length"]) || 0;
        if (this.options.excludeUrl && urls_length > 0) {
          tweet.entities.urls.forEach(url => {
            text = text.replace(url.url, "");
          });
        }

        text = text.replace(/\&(amp|lt|gt);/g, m => table[m]);

        text = text.trim();

        var color = "";

        var link_color = getKey(tweet, ["user", "profile_link_color"]);
        if (this.options.applyThemeColor && link_color !== void(0) && link_color !== "0084B4") {
          color = "#" + tweet.user.profile_link_color;
        }

        const size = "";
        const position = "";
        const date = Date.parse(tweet.created_at);
        const vpos = date - streamStartAt;
        // const date = (tweet.id >> 22) + 1288834974657;

        this._event.emit("chat", {
          text: text,
          color: color,
          size: size,
          position: position,
          vpos: vpos,
          data: {
            userId: tweet.user.id_str,
            screenName: tweet.user.screen_name,
            source: source,
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
