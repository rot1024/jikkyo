(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
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

    get adapter() {
      return this._adapter;
    }

    set adapter(v) {
      if (this._adapter === v) return;
      if (this._adapter) {
        this._adapter.off(this._adapterCb);
      }
      this._adapter = v;
      this._adapter.on(this._adapterCb);
      this.refresh();
    }

    refresh() {
      if (!this._adapter) return;
      this._range.max = this._adapter.length;
      this._range.value = this._adapter.position;
      this._time.totalMillisecond = this._adapter.position;
      this._pos.textContent = this._time.toString();
    }

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));
      root.addEventListener("click", e => e.stopPropagation());

      this._adapter = null;
      this._alwaysOnTop = false;

      this._playBtn = root.querySelector(".play");
      this._range = root.querySelector("input[type=range]");
      this._pos = root.querySelector(".pos");
      this._rangeBg = root.querySelector(".range-bg");
      this._alwaysontopBtn = root.querySelector(".alwaysontop");
      this._menuBtn = root.querySelector(".menu");

      this._time = new Time();

      this._adapterCb = ((name, val) => {
        if (name === "position") {
          this._range.value = val;
          this._time.totalMillisecond = val;
          this._pos.textContent = this._time.toString();
          if (this._adapter.length <= val) {
            this._playBtn.classList.remove("pause");
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
        this._adapter.position = this._range.value;
        if (!this._adapter.playing) this._adapter.draw();
        this._time.totalMillisecond = this._range.value;
        this._pos.textContent = this._time.toString();
      }).bind(this));

      this._rangeBg.addEventListener("click", (e => {
        var rect = this._rangeBg.getBoundingClientRect();
        var pos = (e.clientX - rect.left) / rect.width;
        this._adapter.position = ~~(pos * this._adapter.length);
        this.refresh();
        if (!this._adapter.playing) this._adapter.draw();
      }).bind(this));

      this._playBtn.addEventListener("click", (() => {
        if (!this._adapter.playing) {
          if (this._adapter.length === 0) return;
          if (this._adapter.position === this._adapter.length) {
            this._adapter.position = 0;
            this.refresh();
          }
          this._playBtn.classList.add("pause");
          this._adapter.start();
        } else {
          this._playBtn.classList.remove("pause");
          this._adapter.stop();
        }
      }).bind(this));

      this._alwaysontopBtn.addEventListener("click", (() => {
        const on = this._alwaysontop = !this._alwaysontop;
        const cl = this._alwaysontopBtn.classList;
        if (on && !cl.contains("on")) cl.add("on");
        else if (!on && cl.contains("on")) cl.remove("on");
        win.setAlwaysOnTop(on);
      }).bind(this));
    }

  };

  window.JikkyoController = document.registerElement("jikkyo-controller", {
    prototype: Controller.prototype
  });

})();
