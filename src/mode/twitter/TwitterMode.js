(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;
  var TwitterComment = require("./mode/twitter/TwitterComment");

  class TwitterMode extends window.jikkyo.Mode {

    createdCallback() {
      super.createdCallback();

      this.label = "Twitter モード";
      this.preferenceLabel = "Twitter";

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
        if (err) console.error(err);
      }).bind(this));

      twitterRec.addEventListener("click", (() => {
        if (twitterRec.classList.contains("diasbled")) return;
      }).bind(this));

      twitterTrack.addEventListener("blur", (() => {
        this.savePref();
      }).bind(this));

      twitterConnect.addEventListener("click", (() => {
        if (twitterConnect.classList.contains("diasbled")) return;

        if (twitterConnect.classList.contains("on")) {
          twitter.destroyStream();
          twitterConnect.classList.remove("on");
        twitterTrack.removeAttribute("disabled");
          return;
        }

        twitter.auth({
          consumer_key: this._pref.twitter.consumerKey,
          consumer_secret: this._pref.twitter.consumerSecret,
          access_token_key: this._pref.twitter.accessToken,
          access_token_secret: this._pref.twitter.accessSecret
        });
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

        resetModal = () => {
          pin.value = "";
          loading.classList.remove("hidden");
          authContent.classList.add("hidden");
        };

        cancel.addEventListener("click", () => {
          modal.hide();
        });

        ok.addEventListener("click", () => {
          modal.hide();
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
          p.twitter.screenname = "";
          p.save();
        });
      }

      return element;
    }

    initPreferenceView(e) {
      var p = this.preference,
          r = e.shadowRoot,
          t = p.twitter;

      if (!t) t = p.twitter = {
        screenname: "",
        advanced: false,
        consumerKey: "",
        consumerSecret: "",
        accessToken: "",
        accessSecret: "",
        _accessToken: "",
        _accessSecret: ""
      };

      if (t.screenname) {
        r.querySelector("#twitter-unauthed").classList.add("form-hidden");
        r.querySelector("#twitter-authed").classList.remove("form-hidden");
      } else {
        r.querySelector("#twitter-unauthed").classList.remove("form-hidden");
        r.querySelector("#twitter-authed").classList.add("form-hidden");
      }

      r.querySelector("#twitter-screenname").textContent = t.screenname;
      r.querySelector("#twitter-advanced").checked = t.advanced;
      r.querySelector("#twitter-ck").value = t.consumerKey;
      r.querySelector("#twitter-cs").value = t.consumerSecret;
      r.querySelector("#twitter-at").value = t.accessToken;
      r.querySelector("#twitter-as").value = t.accessSecret;

      r.querySelector("jikkyo-modal").hide();
    }

    savePreferenceView(e) {
      var p = this.preference,
          r = e.shadowRoot;
      if (!p.twitter) p.twitter = {};
      p.twitter.advanced = r.querySelector("#twitter-advanced").checked;
      p.twitter.consumerKey = r.querySelector("#twitter-ck").value;
      p.twitter.consumerSecret = r.querySelector("#twitter-cs").value;
      p.twitter.accessToken = r.querySelector("#twitter-at").value;
      p.twitter.accessSecret = r.querySelector("#twitter-as").value;
    }

  }

  window.jikkyo.TwitterMode = document.registerElement("jikkyo-mode-twitter", {
    prototype: TwitterMode.prototype
  });

})();
