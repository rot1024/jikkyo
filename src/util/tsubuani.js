/* eslint { strict: [2, "global"] } */
"use strict";

const root = "http://www.tsubuani.com";

const co = require("co"),
      cheerio = require("cheerio-httpcli");

// fetchFullComment
let fetching = false,
    canceled = false;

function decode(str) {
  str = str.replace(/%(?:25)+([0-9A-F][0-9A-F])/g, (w, m) => "%" + m);
  const utf8uri = new RegExp(
     "%[0-7][0-9A-F]|" +
     "%C[2-9A-F]%[89AB][0-9A-F]|%D[0-9A-F]%[89AB][0-9A-F]|" +
     "%E[0-F](?:%[89AB][0-9A-F]){2}|" +
     "%F[0-7](?:%[89AB][0-9A-F]){3}|" +
     "%F[89AB](?:%[89AB][0-9A-F]){4}|" +
     "%F[CD](?:%[89AB][0-9A-F]){5}", "ig");
  return str.replace(utf8uri, w => decodeURIComponent(w));
}

function parseDate(d) {
  let date = null;
  const m = d.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    date = new Date(m[1], parseInt(m[2], 10) - 1, m[3], 0, m[5], m[6]);
    date.setHours(parseInt(m[4], 10));
  }
  return date;
}

function getEpisodeInfo(id, episode) {
  return cheerio.fetch(`${root}/anime/${id}/${episode}`).then(result => {
    if (result.error) throw result.error;

    if (result.response.statusCode !== 200)
      throw "status_code_wrong"; // eslint-disable-line no-throw-literal

    const $ = result.$;

    const subtitle = $("#main > div.anime_info_area.box > h1 > span")
      .text().replace(/[0-9]+話/, "").trim();
    if (!subtitle)
      throw "episode_not_found"; // eslint-disable-line no-throw-literal

    let chart;
    try {
      chart = JSON.parse(result.body.match(/var CHART_VAL=(.*?);/)[1]);
    } catch (e) {
      throw "not_broadcasted"; // eslint-disable-line no-throw-literal
    }

    if (chart.some(c => c === 0))
      throw "not_available"; // eslint-disable-line no-throw-literal

    const pid = $("#pid").val();
    if (!pid)
      throw "pid_not_found"; // eslint-disable-line no-throw-literal

    return {
      subtitle,
      pid,
      chart
    };
  });
}

function getTweets(pid, minute, size) {
  const url = `${root}/tvs/get_by_minute/${pid}/${minute}/${size}`;
  return cheerio.fetch(url).then(result => {
    if (result.error)
      throw result.error;
    else if (result.response.statusCode !== 200)
      throw "status_code_wrong"; // eslint-disable-line no-throw-literal
    const $ = result.$;
    return $("li").map(function() {
      /* eslint-disable no-invalid-this */
      const sn = $(this).find("p.twi_icon > a").attr("title");
      return {
        text: $(this).find(".twi_comment").text()
          .replace(/http:\/\/.+?(\s|$)|#.+?(\s|$)|\n/ig, "").trim(),
        date: parseDate($(this).find(".post").text()),
        screenname: sn,
        image: $(this).find("p.twi_icon > a > img").attr("src"),
        class: $(this).attr("class"),
        user_id: sn
      };
      /* eslint-enable no-invalid-this */
    }).toArray();
  });
}

function getMinuteTweets(pid, minute, callback) {
  const minuteTweetCount = 30;

  const isFn = typeof callback === "function";
  let comment = [];
  let size = 0;

  return co(function *() {
    let tweets;
    do {
      if (canceled) throw "canceled"; // eslint-disable-line no-throw-literal
      tweets = yield getTweets(pid, minute, size);
      comment = comment.concat(tweets);
      size += tweets.length;
      if (isFn) callback(minute, size); // eslint-disable-line callback-return
    } while (tweets.length >= minuteTweetCount);
    return comment;
  });
}

module.exports = {

  search(title) {
    return cheerio.fetch(
      `${root}/anime/all?keyword=${encodeURIComponent(title)}`
    ).then(result => {
      if (result.error) {
        throw result.error;
      }
      const $ = result.$;
      return $(".anime-box").map(() => ({
        id: $(this).data("id"),
        name: $(this).find("span.title").text()
      })).toArray();
    });
  },

  fetchComment(id, episode) {
    const url = `${root}/rec_datas/comments?tvId=${id}&count=${episode}&idx=`;
    return getEpisodeInfo(id, episode).then(info => Promise.all([
      info,
      cheerio.fetch(url + "1"),
      cheerio.fetch(url + "2"),
      cheerio.fetch(url + "3")
    ])).then(results => {
      const info = results[0];
      delete results[0];

      let error;
      if (results.some(r => {
        if (r.error) {
          error = r.error;
          return true;
        }
        return false;
      }))
        throw error;

      if (results.some(r => r.response.statusCode !== 200))
        throw "status_code_wrong"; // eslint-disable-line no-throw-literal

      let firstTime = 0;
      const comment = results.map(r => JSON.parse(r.body))
        .reduce((a, b) => a.concat(b), [])
        .map(e => e.l)
        .reduce((a, b) => a.concat(b), [])
        .map((e, i) => {
          const text = decode(e.t).replace(/http:\/\/.+?(\s|$)|#.+?(\s|$)|\n/ig, "").trim();
          const date = parseDate(e.d);
          if (i === 0) firstTime = date.getTime();
          return {
            text,
            date,
            user_id: e.id === null ? "" : e.id,
            screenname: e.s === null ? "" : e.s,
            user_name: e.n === null ? "" : decode(e.n),
            image: e.i === null ? "" : e.i.replace(/\\\//g, "/"),
            ci: e.ci,
            vpos: Math.round((date.getTime() - firstTime) / 10)
          };
        })
        .filter(e => e.text.length > 0);
      return {
        subtitle: info.subtitle,
        comment
      };
    });
  },

  fetchFullComment(id, episode, callback) {
    if (fetching)
      return Promise.reject("it has already started fetching");

    if (typeof callback !== "function")
      callback = null;

    let comment = [],
        firstTime = 0,
        current = 0,
        beforeCount = 0,
        beforeMinute = 0;

    fetching = true;
    canceled = false;

    return getEpisodeInfo(id, episode).then(info => co(function *() {
      const length = info.chart.length;
      const sum = info.chart.reduce((a, b) => a + b, 0);
      const cb = (minute, count) => { // eslint-disable-line func-style
        if (!callback) return;
        if (beforeMinute !== minute)
          beforeCount = 0;
        current += count - beforeCount;
        beforeMinute = minute;
        beforeCount = count;
        callback(current, sum);
      };
      for (let m = 0; m < length; ++m) {
        comment = comment.concat(yield getMinuteTweets(info.pid, m, cb));
        if (m === 0) firstTime = comment[0].date.getTime();
      }
      fetching = false;
      return {
        subtitle: info.subtitle,
        comment: comment.map(c => {
          c.vpos = Math.round((c.date.getTime() - firstTime) / 10);
          return c;
        })
      };
    })).catch(err => {
      fetching = false;
      throw err;
    });
  },

  cancelFetchFullComment() {
    if (fetching) canceled = true;
  },

  toXml(comment) {
    const firstTime = new Date(comment[0].date).getTime();
    // new Date(tweets.map(e => e.date).sort((a, b) => a - b)[0])
    let output = "";
    comment.forEach((c, i) => {
      const vpos = c.vpos || Math.round((c.date.getTime() - firstTime) / 10);
      const date = Math.round(c.date.getTime() / 1000);
      const text = c.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      output += `<chat user_id="${c.user_id}" date="${date}" vpos="${vpos}" no="${i + 1}">${text}</chat>\r\n`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\r\n<packet>\r\n<thread last_res="${comment.length}" ticket=""/>\r\n<view_counter video="0"/>\r\n${output}</packet>\r\n`;
  },

  getFilename(filename, title, episode, subtitle) {
    return filename.replace(/\$\{title\}/g, title)
      .replace(/\$\{episode\}/g, episode)
      .replace(/\$\{episode2\}/g,
        episode.toString().length > 2 ? episode : ("0" + episode).slice(-2))
      .replace(/\$\{subtitle\}/g, subtitle);
  },

  fetchHashtags() {
    return cheerio.fetch(root + "/anime").then(result => {
      if (result.error) throw result.error;
      if (result.response.statusCode !== 200)
        throw "status_code_wrong"; // eslint-disable-line no-throw-literal

      const $ = result.$;

      return $("#now_animes > .section > table tr").map(() => ({
        title: $(this).find("a").text().trim(),
        hashtag: $(this).find(".hasttag_cell").text().trim().split(" ")
      })).toArray().filter(e => e.title && e.hashtag);
    });
  }

};
