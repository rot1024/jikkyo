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
      var element = document.createElement("div");
      var root = element.createShadowRoot();
      var template = doc.getElementById("preference");
      root.appendChild(document.importNode(template.content, true));
      return element;
    }

    initPreferenceView(e, p) {
      if (!p.twutter) return;
      e.shadowRoot.querySelector("#twitter-ck").value = p.twitter.consumerKey;
      e.shadowRoot.querySelector("#twitter-cs").value = p.twitter.consumerSecret;
      e.shadowRoot.querySelector("#twitter-at").value = p.twitter.accessToken;
      e.shadowRoot.querySelector("#twitter-as").value = p.twitter.accessSecret;
    }

    savePreferenceView(e, p) {
      if (!p.twitter) p.twitter = {};
      p.twitter.consumerKey = e.shadowRoot.querySelector("#twitter-ck").value;
      p.twitter.consumerSecret = e.shadowRoot.querySelector("#twitter-cs").value;
      p.twitter.accessToken = e.shadowRoot.querySelector("#twitter-at").value;
      p.twitter.accessSecret = e.shadowRoot.querySelector("#twitter-as").value;
    }

  }

  window.jikkyo.TwitterMode = document.registerElement("jikkyo-mode-twitter", {
    prototype: TwitterMode.prototype
  });

})();
