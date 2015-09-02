/* globals Kefir */
(() => {
  "use strict";

  var fs = require("fs"),
      path = require("path"),
      tsubuani = require("./mode/file/tsubuani"),
      filenameSanitizer = require("./util/FilenameSanitizer"),
      nicoComment = require("./mode/file/NicoComment"),
      Time = require("./util/Time");

  var doc = document.currentScript.ownerDocument;

  class FileMode extends window.jikkyo.Mode {

    createdCallback() {
      super.createdCallback();

      this.label = "ファイル モード";
      this.preferenceLabel = "ファイル";
      this.preferenceName = "file";
      this.droppable = true;

      var root = this.createShadowRoot();
      var template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));

      this._time = new Time();
      this._isOpen = false;
      this._HeatmapList = [
        {color: [  0,   0,   0, 255], ratio: 0.00},
        {color: [  0, 255,   0, 255], ratio: 0.50},
        {color: [255,   0,   0, 255], ratio: 1.00}
      ];

      var fileInput = root.getElementById("file"),
          fileOpenBtn = root.getElementById("file-open");

      this._playBtn = root.getElementById("file-play");
      this._range = root.querySelector("input[type=range]");
      this._rangeBg = root.getElementById("file-slider-bg");
      this._pos = root.getElementById("file-pos");
      this._menuBtn = root.getElementById("file-menu");
      this._modal = document.querySelector("jikkyo-modal");

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
          that._openFromFile(this.value);
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

      // tsubuani

      var modal = document.querySelector("jikkyo-modal");
      var tsubuaniElement = document.createElement("div");
      var tsubuaniRoot = tsubuaniElement.createShadowRoot();
      tsubuaniRoot.appendChild(
        document.importNode(doc.getElementById("tsubuani").content, true));

      this._tsubuaniDialogSaveCheckedChanged = c => this.preference.file.tsubuaniSave = c;

      this._initTsubuaniDialog(tsubuaniRoot, modal);

      // Menu

      var menu = document.createElement("jikkyo-menu");
      var menuBtn = this._menuBtn;

      menu.add({
        label: "つぶあにから実況を取得",
        click: (() => {
          modal.emptyContent();
          modal.appendContent(tsubuaniElement);
          modal.relative = true;
          modal.top = modal.left = modal.right = modal.bottom = 50;
          this._tsubuaniDialogSaveChecked(this.preference.file.tsubuaniSave);
          modal.show();
        }).bind(this)
      });

      menuBtn.addEventListener("click", () => {
        var rect = menuBtn.getBoundingClientRect();
        menu.show(rect.right, rect.top);
      });

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

    applyPreference(p) {
      super.applyPreference(p);
      this._drawSeekbarBackground();
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

      this._rangeBg.style.display = !this.preference.file.heatmap ? "none" : null;
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

      var tpath = r.querySelector("#file-tsubuani-path");
      var filename = r.querySelector("#file-tsubuani-filename");
      var filenameFull = r.querySelector("#file-tsubuani-filename-full");
      var file = r.querySelector("#file-file");

      r.querySelector("#file-heatmap").checked = t.heatmap;
      r.querySelector("#file-auto-coloring").checked = t.autoColoring;
      r.querySelector("#file-comment-big-size").value = t.bigSize;
      r.querySelector("#file-comment-small-size").value = t.smallSize;
      tpath.value = t.tsubuaniPath;
      filename.value = t.tsubuaniFilename;
      filenameFull.value = t.tsubuaniFilenameFull;

      file.addEventListener("change", () => {
        if (!this.value) return;
        tpath.value = this.value;
      });

      r.querySelector("#file-tsubuani-refer").addEventListener("click", () => {
        file.setAttribute("nwworkingdir", tpath.value);
        file.click();
      });

      filename.addEventListener("blur", () => {
        filename.value = filenameSanitizer(filename.value);
      });

      filenameFull.addEventListener("blur", () => {
        filenameFull.value = filenameSanitizer(filenameFull.value);
      });
    }

    savePreferenceView(e) {
      super.savePreferenceView();

      var p = this.preference,
          r = e.shadowRoot,
          t = p.file;

      t.heatmap = r.querySelector("#file-heatmap").checked;
      t.autoColoring = r.querySelector("#file-auto-coloring").checked;
      t.bigSize = r.querySelector("#file-comment-big-size").value;
      t.smallSize = r.querySelector("#file-comment-small-size").value;
      t.tsubuaniPath = r.querySelector("#file-tsubuani-path").value;
      t.tsubuaniFilename = r.querySelector("#file-tsubuani-filename").value;
      t.tsubuaniFilenameFull = r.querySelector("#file-tsubuani-filename-full").value;
    }

    initPreference() {
      return {
        heatmap: true,
        autoColoring: false,
        bigSize: "150%",
        smallSize: "50%",
        tsubuaniPath: process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
        tsubuaniFilename: "${title} 第${episode2}話「${subtitle}」.xml",
        tsubuaniFilenameFull: "${title} 第${episode2}話「${subtitle}」_full.xml",
        tsubuaniSave: true
      };
    }

    drop(file) {
      this._openFromFile(file);
    }

    _open(data, margin) {
      function hashCode(str) {
        var hash = 0, i, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        return hash;
      }

      function toHex(num) {
        return ("0" + Number(num).toString(16)).slice(-2);
      }

      if (this._adapter.playing) {
        this._playBtn.classList.remove("controller-btn-pause");
        this._adapter.stop();
      }

      var size = {
        big: this.preference.file.bigSize,
        small: this.preference.file.smallSize
      };
      var autoColoring = this.preference.file.autoColoring;

      margin = margin >= 0 ? margin : data.reduce((m, chat, i) => {
        for (; chat.vpos % m !== 0; ) m /= 10;
        return m;
      }, 100);

      var ac = autoColoring && !data.some(c => c.color);

      var comment = data.map(datum => {
        var chat = {
          text: datum.text,
          vpos: 10 * (datum.vpos +
            (margin === 0 ? 0 : Math.floor(Math.random() * margin)))
        };

        if (datum.size in size)
          chat.size = size[datum.size];

        if (datum.position)
          chat.position = datum.position;

        if (datum.color)
          chat.color = datum.color;

        if (ac && !chat.color) {
          let id = datum.user_id;
          let hash;

          if (!id)
            hash = Math.random() * 0xFFFFFF;
          else if (/^[0-9]+$/.test(id))
            hash = parseInt(id);
          else
            hash = hashCode(id);

          let r = (hash & 0xFF0000) >> 16;
          let g = (hash & 0x00FF00) >> 8;
          let b = hash & 0x0000FF;

          chat.color = "#" + toHex(r) + toHex(g) + toHex(b);
        }

        return chat;
      });

      this._isOpen = true;
      this._adapter.clearComment();
      this._adapter.addComment(comment);
      this._adapter.render();
      this._range.removeAttribute("disabled");
      this._playBtn.classList.remove("disabled");
      this._drawSeekbarBackground();
      if ("gc" in window) window.gc();
    }

    _openFromFile(cpath) {
      this._modal.use("loading");
      this._modal.show();
      nicoComment.readFromFile(cpath).then((result => {
        this._open(result);
        this._modal.hide();
      }).bind(this), err => {
        console.error(err);
        this._modal.use("alert", "パースエラーのためファイルを読み込めませんでした。");
      });
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
      var ratio = Math.min((value - minimum) / (maximum - minimum), 1);

      var color;
      this._HeatmapList.reduce((prev, item) => {
        if (prev === null) return null;
        if (ratio > item.ratio) return item;

        var colorRatio = (ratio - prev.ratio) / (item.ratio - prev.ratio);

        color = [
          Math.floor(item.color[0] * colorRatio + prev.color[0] * (1 - colorRatio)),
          Math.floor(item.color[1] * colorRatio + prev.color[1] * (1 - colorRatio)),
          Math.floor(item.color[2] * colorRatio + prev.color[2] * (1 - colorRatio)),
          Math.floor(item.color[3] * colorRatio + prev.color[3] * (1 - colorRatio))
        ];

        return null;
      });

      return color;
    }

    _drawSeekbarBackground() {
      if (!this._isOpen) return;

      const r = this._rangeBg,
            ctx = r.getContext("2d"),
            range = 8;

      var img = ctx.getImageData(0, 0, r.width, r.height);
      var influence = this.adapter.getInfluence(r.width);

      influence = influence.map((d, i) => {
        var arr = influence.slice(Math.max(0, i - range), Math.min(influence.length, i + range + 1));
        return arr.reduce((prev, current) => prev + current, 0) / arr.length;
      });

      var max = influence.reduce((prev, current) => {
        return current > prev ? current : prev;
      }, 10);

      influence.map((d, i) => {
        img.data.set(this._getHeatmapColor(0, max * 0.8, d), i * 4);
      }, this);

      ctx.putImageData(img, 0, 0);
    }

    _initTsubuaniDialog(root, modal) {
      var tmodal = root.getElementById("tsubuani-modal"),
          title = root.getElementById("tsubuani-title"),
          episode = root.getElementById("tsubuani-episode"),
          list = root.getElementById("tsubuani-list"),
          save = root.getElementById("tsubuani-save"),
          search = root.getElementById("tsubuani-search"),
          quick = root.getElementById("tsubuani-quick"),
          full = root.getElementById("tsubuani-full"),
          selectedAnime = null,
          that = this;

      this._tsubuaniDialogSaveChecked = c => save.checked = c;

      function beforeFetch() {
        if (!selectedAnime) return false;
        if (save.checked && !that.preference.file.tsubuaniPath) {
          tmodal.use("alert", "つぶあに保存先ディレクトリが設定されていません。");
          tmodal.show();
          return false;
        }
        if (save.checked && !that.preference.file.tsubuaniFilename) {
          tmodal.use("alert", "つぶあにファイル名が設定されていません。");
          tmodal.show();
          return false;
        }
        return true;
      }

      function afterFetch(comment, atitle, aepisode, asubtitle, afull) {
        tmodal.use("loading");

        if (save.checked) {
          fs.writeFileSync(path.join(
            that.preference.file.tsubuaniPath,
            tsubuani.getFilename(
              afull ? that.preference.file.tsubuaniFilenameFull : that.preference.file.tsubuaniFilename,
              atitle,
              aepisode,
              asubtitle
            )
          ), tsubuani.toXml(comment), "utf8");
        }

        that._open(comment/*, 100*/);
        tmodal.hide();
        modal.hide();
      }

      function errorFetch(e) {
        if (e === "canceled") {
          tmodal.hide();
        } else if (e === "status_code_wrong")
          tmodal.use("alert", "つぶあにに接続できませんでした。");
        else if (e === "episode_not_found")
          tmodal.use("alert", "存在しないエピソードです。話数が正しいかどうか確認して下さい。");
        else if (e === "not_broadcasted")
          tmodal.use("alert", "このエピソードはまだ放送されていないようです。");
        else if (e === "not_available")
          tmodal.use("alert", "放送が終わったばかりで、まだつぶあに側でツイートの集計処理が終わっていないようです。しばらく待ってから再度試してみてください。");
        else {
          console.log("tsubuani fetch comment error");
          console.log(e.stack || e);
          tmodal.use("alert", "取得中にエラーが発生しました。");
        }
      }

      function selectAnime(index) {
        var ok = index >= 0;
        quick.disabled = full.disabled = !ok;
        selectedAnime = ok ? {
          title: list.options[index].textContent,
          id: list.options[index].value
        } : null;
      }

      root.getElementById("ok").addEventListener("click", () => modal.hide());

      search.addEventListener("click", () => {
        tmodal.use("loading");
        tmodal.show();
        tsubuani.search(title.value).then(data => {
          if (data.length === 0) {
            tmodal.use("alert", "アニメが見つかりませんでした。検索ワードを変更して再度お試し下さい。");
            return;
          }
          list.innerHTML = "";
          data.forEach(anime => {
            var option = document.createElement("option");
            option.textContent = anime.name;
            option.value = anime.id;
            list.appendChild(option);
          });
          list.selectedIndex = 0;
          selectAnime(0);
          tmodal.hide();
        }).catch(e => {
          console.log("tsubuani search error");
          console.log(e.stack || e);
          tmodal.use("alert", "つぶあにに接続できませんでした。");
        });
      });

      quick.addEventListener("click", () => {
        if (!beforeFetch()) return;

        tmodal.use("loading");
        tmodal.show();

        tsubuani.fetchComment(selectedAnime.id, episode.value).then(result => {
          afterFetch(result.comment, selectedAnime.title, episode.value, result.subtitle);
        }).catch(errorFetch);
      });

      full.addEventListener("click", () => {
        function toFixed(number, precision) {
          var multiplier = Math.pow(10, precision);
          return Math.round(number * multiplier) / multiplier;
        }

        if (!beforeFetch()) return;

        var msg = "取得中です。しばらくお待ち下さい...<br>";

        var cb = tmodal.use("progress-cancelable", msg + "　", () => {
          tsubuani.cancelFetchFullComment();
        });
        tmodal.show();

        tsubuani.fetchFullComment(selectedAnime.id, episode.value, (c, s) => {
          cb(toFixed(c / s * 100, 2), msg + `全 ${s} 件中 ${c} 件を取得しました。`);
        }).then(result => {
          afterFetch(result.comment, selectedAnime.title, episode.value, result.subtitle, true);
        }).catch(errorFetch);
      });

      save.addEventListener("change", () => {
        that._tsubuaniDialogSaveCheckedChanged(save.checked);
      });

      Kefir.fromEvents(title, "keyup")
        .map(e => ({
          ok: title.value.length > 0,
          enterKey: e.keyCode === 13
        }))
        .onValue(e => {
          search.disabled = !e.ok;
          if (e.enterKey) search.click();
        });

      Kefir.fromEvents(list, "change")
        .map(e => e.target.selectedIndex)
        .onValue(e => selectAnime(e));

    }

  }

  window.jikkyo.FileMode = document.registerElement("jikkyo-mode-file", {
    prototype: FileMode.prototype
  });

})();
