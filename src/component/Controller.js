(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
  var TwitterComment = require("./util/TwitterComment");
  var doc = document.currentScript.ownerDocument;

  var Time = class {

    get hour() {
      return this._h;
    }

    get minute() {
      return this._m;
    }

    get second() {
      return this._s;
    }

    get totalMillisecond() {
      return this._total;
    }

    set totalMillisecond(v) {
      var ts, tm;
      this._total = v;
      ts = ~~(this._total / 1000);
      this._s = ts % 60;
      tm = ~~(ts / 60);
      this._m = tm % 60;
      this._h = ~~(tm / 60);
    }

    constructor() {
      this._total = this._ms = this._s = this._m = this._h = 0;
    }

    toString() {
      return (this._h >= 100 ? this._h : ("0" + this._h).slice(-2)) + ":" +
        ("0" + this._m).slice(-2) + ":" +
        ("0" + this._s).slice(-2);
    }

  };

  var Controller = class extends HTMLElement {

    hide() {
      if (this._isFixed) return;
      this.shadowRoot.getElementById("container").classList.add("hidden");
    }

    show() {
      this.shadowRoot.getElementById("container").classList.remove("hidden");
    }

    toggle() {
      if (this.isShown) this.hide();
      else this.show();
    }

    get isShown() {
      return !this.shadowRoot.getElementById("container").classList.contains("hidden");
    }

    get isAlwaysOnTop() {
      return this._alwaysOnTop;
    }

    set isAlwaysOnTop(v) {
      this._alwaysOnTop = v;
      var btn = this.shadowRoot.getElementById("btn-alwaysontop");
      if (v) btn.classList.add("on");
      else btn.classList.remove("on");
      win.setAlwaysOnTop(v);
    }

    get isFixed() {
      return this._isFixed;
    }

    set isFixed(v) {
      this._isFixed = !!v;
      if (v) this.show();
    }

    get mode() {
      return this._mode;
    }

    set mode(v) {
      if (v === this._mode) return;

      var fileMode = this.shadowRoot.getElementById("mode-file");
      var twitterMode = this.shadowRoot.getElementById("mode-twitter");

      if (v === 0) {
        fileMode.classList.remove("hidden");
        twitterMode.classList.add("hidden");
      } else if (v === 1) {
        fileMode.classList.add("hidden");
        twitterMode.classList.remove("hidden");
      }

      if (this._adapter && this._adapter.playing) {
        this._adapter.stop();
        this.refresh();
      }

      this._mode = v;
    }

    get adapter() {
      return this._adapter;
    }

    set adapter(v) {
      if (this._adapter === v) return;
      if (this._adapter) {
        this._adapter.off(this._adapterCb);
      }
      if (v) {
        this._adapter = v;
        this._adapter.on(this._adapterCb);
        this.refresh();
      }
    }

    get pref() {
      return this._pref;
    }

    set pref(v) {
      this._pref = v;
      this.loadPref();
    }

    loadPref() {
      var p = this._pref;
      if (!p) return;

      this.isAlwaysOnTop = p.controller.alwaysOnTop || false;
      this.isFixed = p.controller.fixed || false;
      this.shadowRoot.getElementById("twitter-track").value = p.controller.track || "";
      this.mode = p.controller.mode || 0;
    }

    savePref() {
      var p = this._pref;
      if (!p) return;

      p.controller.alwaysOnTop = this.isAlwaysOnTop;
      p.controller.fixed = this.isFixed;
      p.controller.track = this.shadowRoot.getElementById("twitter-track").value;
      p.controller.mode = this.mode;

      p.save();
    }

    refresh() {
      if (!this._adapter) return;
      this._range.max = this._adapter.length;
      this._range.value = this._adapter.position;
      this._time.totalMillisecond = this._adapter.position;
      this._pos.textContent = this._time.toString();
      if (this._adapter.playing) {
        this._playBtn.classList.add("controller-btn-pause");
      } else {
        this._playBtn.classList.remove("controller-btn-pause");
      }
    }

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));
      root.addEventListener("click", e => e.stopPropagation());

      this._adapter = null;
      this._alwaysOnTop = false;
      this._isFixed = false;
      this._mode = 0;

      this._playBtn = root.getElementById("file-play");
      this._range = root.querySelector("input[type=range]");
      this._rangeBg = root.querySelector(".range-bg");
      this._pos = root.getElementById("file-pos");

      var alwaysontopBtn = root.getElementById("btn-alwaysontop");
      var menuBtn = root.getElementById("btn-menu");

      this._time = new Time();

      this._adapterCb = ((name, val) => {
        if (name === "position") {
          this._range.value = val;
          this._time.totalMillisecond = val;
          this._pos.textContent = this._time.toString();
          if (this._adapter.length <= val) {
            this._playBtn.classList.remove("controller-btn-pause");
          }
        } else if (name === "length") {
          this._range.max = val;
        }
      }).bind(this);

      var playingBuf = false;

      this._range.addEventListener("mousedown", (() => {
        if (this._adapter.playing) {
          playingBuf = true;
          this._adapter.stop();
        }
      }).bind(this));

      this._range.addEventListener("mouseup", (() => {
        if (playingBuf) {
          this._adapter.start();
          playingBuf = false;
        }
      }).bind(this));

      this._range.addEventListener("input", (() => {
        this._adapter.position = parseInt(this._range.value);
        if (!this._adapter.playing) this._adapter.render();
        this._time.totalMillisecond = this._range.value;
        this._pos.textContent = this._time.toString();
      }).bind(this));

      this._rangeBg.addEventListener("click", (e => {
        var rect = this._rangeBg.getBoundingClientRect();
        var pos = (e.clientX - rect.left) / rect.width;
        this._adapter.position = ~~(pos * this._adapter.length);
        this.refresh();
        if (!this._adapter.playing) this._adapter.render();
      }).bind(this));

      this._playBtn.addEventListener("click", (() => {
        if (!this._adapter.playing) {
          if (this._adapter.length === 0) return;
          this._adapter.realtime = false;
          if (this._adapter.position === this._adapter.length) {
            this._adapter.position = 0;
            this.refresh();
          }
          this._playBtn.classList.add("controller-btn-pause");
          this._adapter.start();
        } else {
          this._playBtn.classList.remove("controller-btn-pause");
          this._adapter.stop();
        }
      }).bind(this));

      alwaysontopBtn.addEventListener("click", (() => {
        this.isAlwaysOnTop = !this.isAlwaysOnTop;
        this.savePref();
      }).bind(this));

      // file mode

      var fileInput = root.getElementById("file"),
          fileOpenBtn = root.getElementById("file-open"),
          NicoComment = require("./util/NicoComment");

      fileOpenBtn.addEventListener("click", (() => {
        var adapter = this._adapter;
        fileInput.addEventListener("change", () => {
          if (!this || !this.value) return;
          var path = this.value;

          var nico = new NicoComment();
          nico.readFromFile(path).then(result => {
            adapter.clearComment();
            adapter.addComment(result);
          });

          fileInput.value = "";
        });
        fileInput.click();
      }).bind(this));

      // twitter mode

      var twitterRec = root.getElementById("twitter-rec"),
          twitterTrack = root.getElementById("twitter-track"),
          twitterConnect = root.getElementById("twitter-connect"),
          twitter = new TwitterComment();

      twitterTrack.addEventListener("blur", (() => this.savePref()).bind(this));

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

      // menu

      var fileMode = root.getElementById("mode-file");
      var twitterMode = root.getElementById("mode-twitter");
      var menu = document.createElement("jikkyo-menu");

      var item1 = new window.JikkyoMenu.Menuitem({
        label: "ファイル モード",
        checked: true
      });

      var item2 = new window.JikkyoMenu.Menuitem({
        label: "Twitter モード"
      });

      item1.click = (() => {
        if (item1.checked) return;

        item1.checked = true;
        item2.checked = false;

        if (twitter.isStreaming) {
          twitter.destroyStream();
          twitterRec.classList.add("disabled");
          twitterTrack.removeAttribute("disabled");
          twitterConnect.classList.remove("on");
        }

        this.mode = 0;
        this.savePref();
      }).bind(this);

      item2.click = (() => {
        if (item2.checked) return;

        item1.checked = false;
        item2.checked = true;

        this.mode = 1;
        this.savePref();
      }).bind(this);

      menu.add(item1);
      menu.add(item2);
      menu.add({ type: "separator" });

      var menuFixedItem = new window.JikkyoMenu.Menuitem({
        label: "コントロールバーを固定",
        checkable: true,
        click: (item => {
          this.isFixed = item.checked;
          this.savePref();
        }).bind(this)
      });

      menu.add(menuFixedItem);
      menu.add({ type: "separator" });
      menu.add({
        label: "設定",
        click() {
          document.querySelector("jikkyo-preference-dialog").show();
        }
      });

      menuBtn.addEventListener("click", (() => {
        item1.checked = item2.checked = false;
        if (this._mode === 0) item1.checked = true;
        else if (this._mode === 1) item2.checked = true;

        menuFixedItem.checked = this._isFixed;
        var rect = menuBtn.getBoundingClientRect();
        menu.show(rect.right, rect.top);
      }).bind(this));

    }

  };

  window.JikkyoController = document.registerElement("jikkyo-controller", {
    prototype: Controller.prototype
  });

})();
