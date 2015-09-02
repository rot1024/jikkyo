"use strict";

const root = "http://www.tsubuani.com";

var cheerio = require("cheerio-httpcli");

function decode(str) {
  str = str.replace(/%(?:25)+([0-9A-F][0-9A-F])/g, (w, m) => "%" + m);
  var utf8uri = new RegExp(
     "%[0-7][0-9A-F]|" +
     "%C[2-9A-F]%[89AB][0-9A-F]|%D[0-9A-F]%[89AB][0-9A-F]|" +
     "%E[0-F](?:%[89AB][0-9A-F]){2}|" +
     "%F[0-7](?:%[89AB][0-9A-F]){3}|" +
     "%F[89AB](?:%[89AB][0-9A-F]){4}|" +
     "%F[CD](?:%[89AB][0-9A-F]){5}", "ig");
  return str.replace(utf8uri, w => decodeURIComponent(w));
}

function parseDate(d) {
  var date = null;
  var m = d.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    date = new Date(m[1], parseInt(m[2]) - 1, m[3], 0, m[5], m[6]);
    date.setHours(parseInt(m[4]));
  }
  return date;
}

function getEpisodeInfo(id, episode) {
  return cheerio.fetch(`${root}/anime/${id}/${episode}`).then(result => {
    if (result.error) throw result.error;
    var $ = result.$;

    var subtitle = $("#main > div.anime_info_area.box > h1 > span")
      .text().replace(/[0-9]+話/, "").trim();
    if (!subtitle)
      throw "episode_not_found";

    var chart;
    try {
      chart = JSON.parse(result.body.match(/var CHART_VAL=(.*?);/)[1]);
    } catch(e) {
      throw "not_broadcasted";
    }

    if (chart.some(c => c === 0))
      throw "not_available";

    var pid = $("#pid").val();
    if (!pid)
      throw "pid_not_found";

    return {
      subtitle: subtitle,
      pid: pid,
      chart: chart
    };
  });
}

module.exports = {

  search(title) {
    return cheerio.fetch(
      `${root}/anime/all?keyword=${encodeURIComponent(title)}`
    ).then(result => {
      if (result.error) throw result.error;
      var $ = result.$;
      return $(".anime-box").map(() => ({
        id: $(this).data("id"),
        name: $(this).find("span.title").text()
      })).toArray();
    });
  },

  fetchComment(id, episode, callback) {
    var url = `${root}/rec_datas/comments?tvId=${id}&count=${episode}&idx=`;
    return getEpisodeInfo(id, episode).then(info => Promise.all([
      info,
      cheerio.fetch(url + "1"),
      cheerio.fetch(url + "2"),
      cheerio.fetch(url + "3")
    ])).then(results => {
      var info = results[0];
      delete results[0];
      var comment = results.map(r => JSON.parse(r.body))
        .reduce((a, b) => a.concat(b), [])
        .map(e => e.l)
        .reduce((a, b) => a.concat(b), [])
        .map(e => ({
          text: decode(e.t),
          date: parseDate(e.d),
          user_id: e.id,
          screenname: e.s,
          user_name: decode(e.n),
          image: e.i.replace(/\\\//g, "/"),
          ci: e.ci
        }))
        .filter(e => e.text.length > 0);
      return {
        subtitle: info.subtitle,
        comment: comment
      };
    });
  },

  fetchFullComment(id, episode, callback) {
  },

  toXml(comment) {
    var firstDate = new Date(comment[0].date);
    // new Date(tweets.map(e => e.date).sort((a, b) => a - b)[0])
    var output = "";
    comment.forEach((value, index) => {
      var vpos = Math.round((value.date.getTime() - firstDate.getTime()) / 10);
      var date = Math.round(value.date.getTime() / 1000);
      var text = value.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .trim();
      output += `<chat user_id="${value.user_id}" date="${date}" vpos="${vpos}" no="${index + 1}">${text}</chat>\r\n`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\r\n<packet>\r\n<thread last_res="${comment.length}" ticket=""/>\r\n<view_counter video="0"/>\r\n${output}</packet>\r\n`;
  },

  getFilename(filename, title, episode, subtitle) {
    return filename.replace(/\$\{title\}/g, title)
      .replace(/\$\{episode\}/g, episode)
      .replace(/\$\{episode2\}/g,
        episode.toString().length > 2 ? episode : ("0" + episode).slice(-2))
      .replace(/\$\{subtitle\}/g, subtitle);
  }

};
