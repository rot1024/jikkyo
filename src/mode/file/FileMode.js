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
      this.preferenceName = "file";

      var root = this.createShadowRoot();
      var template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));

      this._time = new Time();

      var fileInput = root.getElementById("file"),
          fileOpenBtn = root.getElementById("file-open");

      this._playBtn = root.getElementById("file-play");
      this._range = root.querySelector("input[type=range]");
      this._rangeBg = root.getElementById("file-slider-bg");
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
        this._adapter.position = parseInt(pos * this._adapter.length);
        this.refresh();
        if (!this._adapter.playing) this._adapter.render();
      }).bind(this));

      var play = (() => {
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
      }).bind(this);

      this._playBtn.addEventListener("click", play);

      {
        let that = this;
        fileInput.addEventListener("change", () => {
          if (!this || !this.value) return;
          var path = this.value;

          var nico = new NicoComment();
          nico.options.size.big = that.preference.file.bigSize;
          nico.options.size.small = that.preference.file.smallSize;
          nico.readFromFile(path).then(result => {
            that._adapter.clearComment();
            that._adapter.addComment(result);
            that._adapter.render();
            that._drawSeekbarBackground();
            that._range.removeAttribute("disabled");
            that._playBtn.classList.remove("disabled");
          });

          fileInput.value = "";
        });
      }

      var open = () => fileInput.click();

      this._seekForward = this._seekForward.bind(this);
      this._seekBackward = this._seekBackward.bind(this);
      this._seekForwardBit = this._seekForwardBit.bind(this);
      this._seekBackwardBit = this._seekBackwardBit.bind(this);
      this._seekToStart = this._seekToStart.bind(this);
      this._seekToEnd = this._seekToEnd.bind(this);

      fileOpenBtn.addEventListener("click", open);

      this.shortcutkeys = [
        { key: "ctrl+o", macKey: "command+o", label: "コメントファイルを開く", press: open },
        { key: "space", label: "再生/停止", press: play },
        { key: "right", label: "10秒進む", press: this._seekForward },
        { key: "left", label: "10秒戻る", press: this._seekBackward },
        { key: "shift+right", label: "1秒進む", press: this._seekForwardBit },
        { key: "shift+left", label: "1秒戻る", press: this._seekBackwardBit },
        { key: "home", label: "始めに戻る", press: this._seekToStart },
        { key: "end", label: "終わりまで進む", press: this._seekToEnd }
      ];
    }

    show() {
      super.show();
    }

    hide() {
      super.hide();
    }

    refresh() {
      super.refresh();
      this._range.max = this._adapter.length;
      this._range.value = this._adapter.position;
      this._time.totalMillisecond = this._adapter.position;
      this._pos.textContent = this._time.toString();
      if (this._adapter.playing) {
        this._playBtn.classList.add("controller-btn-pause");
      } else {
        this._playBtn.classList.remove("controller-btn-pause");
      }
      this._drawSeekbarBackground();
    }

    getPreferenceView() {
      var element = document.createElement("div");
      var root = element.createShadowRoot();
      var template = doc.getElementById("preference");
      root.appendChild(document.importNode(template.content, true));
      return element;
    }

    initPreferenceView(e) {
      super.initPreferenceView();

      var p = this.preference,
          r = e.shadowRoot,
          t = p.file;

      r.querySelector("#file-heatmap").checked = t.heatmap;
      r.querySelector("#file-comment-big-size").value = t.bigSize;
      r.querySelector("#file-comment-small-size").value = t.smallSize;
    }

    savePreferenceView(e) {
      super.savePreferenceView();

      var p = this.preference,
          r = e.shadowRoot,
          t = p.file;

      t.heatmap = r.querySelector("#file-heatmap").checked;
      t.bigSize = r.querySelector("#file-comment-big-size").value;
      t.smallSize = r.querySelector("#file-comment-small-size").value;
    }

    initPreference() {
      return {
        heatmap: true,
        bigSize: "150%",
        smallSize: "50%"
      };
    }

    _seekForward() {
      this._adapter.seekForward();
    }

    _seekBackward() {
      this._adapter.seekBackward();
    }

    _seekForwardBit() {
      this._adapter.seekForwardBit();
    }

    _seekBackwardBit() {
      this._adapter.seekBackwardBit();
    }

    _seekToStart() {
      this._adapter.seekToStart();
    }

    _seekToEnd() {
      this._adapter.seekToEnd();
    }

    _getHeatmapColor(minimum, maximum, value) {
      var ratio = (value - minimum) / (maximum - minimum);
      var b = Math.floor(Math.max(0, 255 * (1 - ratio * 2)));
      var r = Math.floor(Math.max(0, 255 * (ratio * 0.5)));
      var g = 255 - b - r;
      return [r, g, b, 255];
    }

    _drawSeekbarBackground() {
      if (!this.preference.file.heatmap) return;

      const r = this._rangeBg,
            ctx = r.getContext("2d");

      var img = ctx.getImageData(0, 0, r.width, r.height);
      var influence = this.adapter.getInfluence(r.width);

      influence.map((d, i) => {
        var hm = this._getHeatmapColor(0, 15, d);
        img.data.set(hm, i * 4);
      }, this);

      ctx.putImageData(img, 0, 0);
    }

  }


  window.jikkyo.FileMode = document.registerElement("jikkyo-mode-file", {
    prototype: FileMode.prototype
  });

})();
