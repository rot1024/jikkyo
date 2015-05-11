(() => {
  "use strict";

  var gui = require('nw.gui'),
      TwitterComment = require("./mode/twitter/TwitterComment"),
      TwitterAuth = require("./mode/twitter/TwitterAuth"),
      constants = require("./constants"),
      doc = document.currentScript.ownerDocument;

  class TwitterMode extends window.jikkyo.Mode {

    createdCallback() {
      super.createdCallback();

      this.label = "Twitter モード";
      this.preferenceLabel = "Twitter";
      this.preferenceName = "twitter";

      var root = this.createShadowRoot();
      var template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));

      var twitter = new TwitterComment(),
          twitterRec = root.getElementById("twitter-rec"),
          twitterTrack = root.getElementById("twitter-track"),
          twitterConnect = root.getElementById("twitter-connect");

      this._twitter = twitter;
      this._twitterRec = twitterRec;
      this._twitterTrack = twitterTrack;
      this._twitterConnect = twitterConnect;

      twitter.on("stream", (() => {
        this._adapter.clearComment();
        this._adapter.realtime = true;
        this._adapter.start();
        twitterRec.classList.remove("disabled");
        twitterConnect.classList.remove("disabled");
        twitterConnect.classList.add("on");
      }).bind(this));

      twitter.on("chat", (chat => {
        chat.vpos = this._adapter.length;
        this._adapter.addChat(chat);
      }).bind(this));

      twitter.on("error", (err => {
        this._adapter.stop();
        this._adapter.realtime = false;
        twitterRec.classList.add("disabled");
        twitterConnect.classList.remove("disabled");
        twitterConnect.classList.remove("on");
        if (err) console.error(err);
      }).bind(this));

      twitterRec.addEventListener("click", (() => {
        if (twitterRec.classList.contains("diasbled")) return;
      }).bind(this));

      twitterTrack.addEventListener("blur", (() => {
        if (!this.preference) return;
        this.preference.twitter.track = twitterTrack.value;
        this.preference.save();
      }).bind(this));

      twitterConnect.addEventListener("click", (() => {
        if (twitterConnect.classList.contains("diasbled")) return;

        if (twitterConnect.classList.contains("on")) {
          twitter.destroyStream();
          twitterConnect.classList.remove("on");
        twitterTrack.removeAttribute("disabled");
          return;
        }

        var opts = {};

        if (this.preference.twitter.advanced) {
          if (!this.preference.twitter.consumerKey ||
             !this.preference.twitter.consumerSecret ||
             !this.preference.twitter.accessToken ||
             !this.preference.twitter.accessSecret) {
            window.alert("上級者向けモードに必要な情報が入力されていません。");
            return;
          }
          opts.consumer_key = this.preference.twitter.consumerKey;
          opts.consumer_secret = this.preference.twitter.consumerSecret;
          opts.access_token_key = this.preference.twitter.accessToken;
          opts.access_token_secret = this.preference.twitter.accessSecret;
        }
        else if (this.preference.twitter._accessToken) {
          opts.consumer_key = constants.twitter.consumerKey;
          opts.consumer_secret = constants.twitter.consumerSecret;
          opts.access_token_key = this.preference.twitter._accessToken;
          opts.access_token_secret = this.preference.twitter._accessSecret;
        }
        else {
          window.alert("Twitterアカウントが認証されていません。先に設定画面で認証してください。");
          return;
        }

        twitter.auth(opts);
        twitter.textNg = this._getNgList(this.preference.twitter.textNg);
        twitter.userNg = this._getNgList(this.preference.twitter.userNg);

        if (this.preference) {
          twitter.options = {
            excludeMention: this.preference.twitter.excludeMention,
            excludeRetweet: this.preference.twitter.excludeRetweet,
            excludeHashtag: this.preference.twitter.excludeHashtag,
            excludeUrl: this.preference.twitter.excludeUrl,
            applyThemeColor: this.preference.twitter.applyThemeColor
          };
        }

        twitterTrack.setAttribute("disabled", "disabled");
        twitterConnect.classList.add("disabled");
        if (twitterTrack.value) {
          twitter.filterStream(twitterTrack.value);
        } else {
          twitter.userStream();
        }
      }).bind(this));

    }

    show() {
      super.show();

      if (this.preference && this.preference.twitter && this.preference.twitter.track)
        this._twitterTrack.value = this.preference.twitter.track || "";
    }

    hide() {
      super.hide();

      if (this._twitter.isStreaming) {
        this._twitter.destroyStream();
        this._twitterRec.classList.add("disabled");
        this._twitterTrack.removeAttribute("disabled");
        this._twitterConnect.classList.remove("on");
      }

      this._adapter.clearComment();
    }

    getPreferenceView() {
      var p = this.preference;
      var element = document.createElement("div");
      var root = element.createShadowRoot();
      root.appendChild(document.importNode(
        doc.getElementById("preference").content, true));

      var unauthed = root.querySelector("#twitter-unauthed"),
          authed = root.querySelector("#twitter-authed"),
          modal = document.createElement("jikkyo-modal"),
          resetModal;

      {
        modal.width = 300;
        modal.height = 120;

        let content = document.importNode(doc.getElementById("modal-auth").content, true),
            pin = content.querySelector("#twitter-auth-pin"),
            cancel = content.querySelector("#twitter-auth-cancel"),
            ok = content.querySelector("#twitter-auth-ok"),
            loading = content.querySelector("#twitter-auth-loading"),
            authContent = content.querySelector("#twitter-auth-content");

        var auth;

        resetModal = () => {
          pin.value = "";
          loading.classList.remove("hidden");
          authContent.classList.add("hidden");

          auth = new TwitterAuth({
            consumerKey: constants.twitter.consumerKey,
            consumerSecret: constants.twitter.consumerSecret
          });

          auth.getAuthorizeURL().then(url => {
            gui.Shell.openExternal(url);
            loading.classList.add("hidden");
            authContent.classList.remove("hidden");
          }, err => {
            console.error("TwitterAuth#getAuthorizeURL failed", err);
            modal.hide();
            auth = null;
            window.alert("認証に失敗しました。ネットワーク接続を確認の上、再度試してみてください。");
          });
        };

        cancel.addEventListener("click", () => {
          modal.hide();
          auth = null;
        });

        ok.addEventListener("click", () => {
          if (!pin.value) return;

          loading.classList.remove("hidden");
          authContent.classList.add("hidden");

          auth.getAccessToken(pin.value).then(data => {
            if (!p) throw new Error("preference is null");
            p.twitter._accessToken = data.accessToken;
            p.twitter._accessSecret = data.accessTokenSecret;
            p.save();
            modal.hide();
            unauthed.classList.add("form-hidden");
            authed.classList.remove("form-hidden");
            auth = null;
          }, err => {
            console.error("TwitterAuth#getAccessToken failed", err);
            loading.classList.add("hidden");
            authContent.classList.remove("hidden");
            window.alert("認証に失敗しました。PINコードが正しくないようです。");
          }).catch(err => {
            console.error("TwitterAuth#getAccessToken failed", err);
            loading.classList.add("hidden");
            authContent.classList.remove("hidden");
          });
        });

        modal.appendContent(content);
        root.appendChild(modal);
      }

      {
        let authBtn = root.querySelector("#twitter-auth");
        authBtn.addEventListener("click", () => {
          resetModal();
          modal.show();
        });
      }

      {
        let unauthBtn = root.querySelector("#twitter-unauth");
        unauthBtn.addEventListener("click", () => {
          unauthed.classList.remove("form-hidden");
          authed.classList.add("form-hidden");
          p.twitter._accessToken = "";
          p.twitter._accessSecret = "";
          p.save();
        });
      }

      return element;
    }

    initPreferenceView(e) {
      super.initPreferenceView();

      var p = this.preference,
          r = e.shadowRoot,
          t = p.twitter;

      if (t._accessToken) {
        r.querySelector("#twitter-unauthed").classList.add("form-hidden");
        r.querySelector("#twitter-authed").classList.remove("form-hidden");
      } else {
        r.querySelector("#twitter-unauthed").classList.remove("form-hidden");
        r.querySelector("#twitter-authed").classList.add("form-hidden");
      }

      r.querySelector("#twitter-exclude-mention").checked = t.excludeMention;
      r.querySelector("#twitter-exclude-retweet").checked = t.excludeRetweet;
      r.querySelector("#twitter-exclude-hashtag").checked = t.excludeHashtag;
      r.querySelector("#twitter-exclude-url").checked = t.excludeUrl;
      r.querySelector("#twitter-apply-color").checked = t.applyThemeColor;

      r.querySelector("#twitter-ng-text").value = t.textNg;
      r.querySelector("#twitter-ng-user").value = t.userNg;

      r.querySelector("#twitter-advanced").checked = t.advanced;
      r.querySelector("#twitter-ck").value = t.consumerKey;
      r.querySelector("#twitter-cs").value = t.consumerSecret;
      r.querySelector("#twitter-at").value = t.accessToken;
      r.querySelector("#twitter-as").value = t.accessSecret;

      r.querySelector("jikkyo-modal").hide();
    }

    savePreferenceView(e) {
      super.savePreferenceView();

      var p = this.preference.twitter,
          r = e.shadowRoot;

      p.excludeMention = r.querySelector("#twitter-exclude-mention").checked;
      p.excludeRetweet = r.querySelector("#twitter-exclude-retweet").checked;
      p.excludeHashtag = r.querySelector("#twitter-exclude-hashtag").checked;
      p.excludeUrl = r.querySelector("#twitter-exclude-url").checked;
      p.applyThemeColor = r.querySelector("#twitter-apply-color").checked;

      p.textNg = r.querySelector("#twitter-ng-text").value;
      p.userNg = r.querySelector("#twitter-ng-user").value;

      p.advanced = r.querySelector("#twitter-advanced").checked;
      p.consumerKey = r.querySelector("#twitter-ck").value;
      p.consumerSecret = r.querySelector("#twitter-cs").value;
      p.accessToken = r.querySelector("#twitter-at").value;
      p.accessSecret = r.querySelector("#twitter-as").value;
    }

    initPreference() {
      return {
        advanced: false,
        consumerKey: "",
        consumerSecret: "",
        accessToken: "",
        accessSecret: "",
        _accessToken: "",
        _accessSecret: "",
        textNg: "",
        userNg: "",
        track: "",
        excludeMention: true,
        excludeRetweet: true,
        excludeHashtag: true,
        excludeUrl: true,
        applyThemeColor: true
      };
    }

    _getNgList(ng) {
      return ng.split("\n").map(n => {
        var m = n.match(/\/(.+)\/([igmy]*)/);
        var result;
        if (m) {
          try {
            result = new RegExp(m[1], m[2]);
          } catch(e) {
            result = null;
          }
        } else {
          result = n;
        }
        return result;
      });
    }

  }

  window.jikkyo.TwitterMode = document.registerElement("jikkyo-mode-twitter", {
    prototype: TwitterMode.prototype
  });

})();
