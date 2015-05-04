(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;
  var NicoComment = require("./mode/file/NicoComment");
  var Time = require("./util/Time");

  class FileMode extends window.jikkyo.Mode {

    createdCallback() {
      super.createdCallback();

      this.label = "ファイル モード";
      this.preferenceLabel = "ファイル";

      var root = this.createShadowRoot();
      var template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));

      this._time = new Time();

      var fileInput = root.getElementById("file"),
          fileOpenBtn = root.getElementById("file-open");

      this._playBtn = root.getElementById("file-play");
      this._range = root.querySelector("input[type=range]");
      this._rangeBg = root.querySelector(".range-bg");
      this._pos = root.getElementById("file-pos");

      this._adapter.on(((name, val) => {
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
      }).bind(this));

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
    }

    show() {
      super.show();
    }

    hide() {
      super.hide();
    }

    refresh() {
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

    getPreferenceView() {
      var element = document.createElement("div");
      var root = element.createShadowRoot();
      var template = doc.getElementById("preference");
      root.appendChild(document.importNode(template.content, true));
      return element;
    }

    initPreferenceView() {
    }

    savePreferenceView() {
    }

  }

  window.jikkyo.FileMode = document.registerElement("jikkyo-mode-file", {
    prototype: FileMode.prototype
  });

})();
