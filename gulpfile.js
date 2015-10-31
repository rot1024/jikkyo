"use strict";

const fs = require("fs");
const gulp = require("gulp");
const gutil = require("gulp-util");
const del = require("del");
const NwBuilder = require("nw-builder");
const archiver = require("archiver");
const runSequence = require("run-sequence");

const platforms = {
  win: ["win32", "win64"],
  osx: ["osx32", "osx64"],
  linux: ["linux32", "linux64"]
};

const platformsArray = (() => {
  return Object.keys(platforms).reduce((prev, current) => {
    return prev.concat(current);
  }, []);
})();

var currentTarget;

switch (process.platform) {
  case "win32":
    currentTarget = "win";
    break;

  case "darwin":
    currentTarget = "osx";
    break;

  case "linux":
    currentTarget = "linux";
    break;

  default:
    currentTarget = "";
    break;
}

if (currentTarget) {
  switch (process.arch) {
    case "x64":
      currentTarget += "64";
      break;

    case "ia32":
      currentTarget += "32";
      break;

    default:
      currentTarget = "";
      break;
  }
}

function readFile(file, encoding) {
  return new Promise((resolve, reject) => {
    encoding = encoding || "utf8";

    fs.readFile(file, encoding, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
}

function writeFile(file, data, encoding) {
  return new Promise((resolve, reject) => {
    encoding = encoding || "utf8";

    fs.writeFile(file, data, encoding, err => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function readJSON(file, encoding) {
  return readFile(file, encoding).then(data => JSON.parse(data));
}

function writeJSON(file, data, encoding) {
  return writeFile(file, JSON.stringify(data, null, "  ") + "\n", encoding);
}

function cleanList(target) {
  var list = [];
  var parent = "build/jikkyo";

  if (target === "all") {
    list.push(parent);
  } else {
    list.push(`${parent}/${target}`);
    list.push(`${parent}/*-${target}.zip`);
  }

  return list;
}

function nw(targets) {
  var nwb = new NwBuilder({
    files: "src/**",
    version: "0.12.3",
    platforms: targets,
    build: "build",
    cacheDir: "cache",
    macCredits: "Credits.html",
    macIcns: "src/images/jikkyo.icns",
    macZip: false,
    winIco: "src/images/jikkyo.ico",
    winZip: false
  });

  nwb.on("log", msg => {
    if (!/^Zipping/.test(msg))
      gutil.log("nw-builder", msg);
  });

  return nwb.build();
}

function copyList(target) {
  var files = ["README.md", "LICENSE"];

  if (target.includes("win")) {
    files.push("attachment/jikkyo_ct.cmd");
  } else if (target.includes("osx")) {
    files.push("attachment/jikkyo_ct.command");
  }

  return files;
}

function pack(targets) {
  return readJSON("package.json").then(json => {
    var version = json.version;

    return Promise.all(targets.map(target => {
      return new Promise((resolve, reject) => {
        var dir = `build/jikkyo/${target}`;
        var name = `jikkyo-v${version}-${target}`;
        var out = `build/jikkyo/${name}.zip`;

        var archive = archiver("zip");
        var output = fs.createWriteStream(out);

        output.on("close", resolve);
        archive.on("error", reject);

        archive.pipe(output);

        archive.directory(dir, name)
               .finalize();
      });
    }));
  });
}

function release(target) {
  return new Promise((resolve, reject) => {
    runSequence(`clean:${target}`, `nw:${target}`, `copy:${target}`, `package:${target}`, err => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

gulp.task("sync", () => {
  return Promise.all([
    readJSON("package.json"),
    readJSON("src/package.json")
  ]).then(jsons => {
    var pkg = jsons[0];
    var srcPkg = jsons[1];

    srcPkg.name = pkg.name;
    srcPkg.version = pkg.version;
    srcPkg.description = pkg.description;
    srcPkg.repository = pkg.repository;
    srcPkg.homepage = pkg.homepage;

    return writeJSON("src/package.json", srcPkg);
  });
});

gulp.task("clean:all", () => del(cleanList("all")));
gulp.task("nw:all", () => nw(platformsArray));
gulp.task("copy:all", Object.keys(platforms).map(platform => `copy:${platform}`));
gulp.task("package:all", Object.keys(platforms).map(platform => `package:${platform}`));
gulp.task("release:all", () => release("all"));

Object.keys(platforms).forEach(platform => {
  gulp.task(`clean:${platform}`, platforms[platform].map(target => `clean:${target}`));
  gulp.task(`nw:${platform}`, () => nw(platforms[platform]));
  gulp.task(`copy:${platform}`, platforms[platform].map(target => `copy:${target}`));
  gulp.task(`package:${platform}`, platforms[platform].map(target => `package:${target}`));
  gulp.task(`release:${platform}`, () => release(platform));

  platforms[platform].forEach(target => {
    gulp.task(`clean:${target}`, () => del(cleanList(target)));
    gulp.task(`nw:${target}`, () => nw([target]));
    gulp.task(`copy:${target}`, () => gulp.src(copyList(target)).pipe(gulp.dest(`build/jikkyo/${target}`)));
    gulp.task(`package:${target}`, () => pack([target]));
    gulp.task(`release:${target}`, () => release(target));
  });
});

gulp.task("clean", ["clean:all"]);

if (currentTarget) {
  gulp.task("nw", [`nw:${currentTarget}`]);
  gulp.task("copy", [`copy:${currentTarget}`]);
  gulp.task("package", [`package:${currentTarget}`]);
  gulp.task("release", [`release:${currentTarget}`]);
}

gulp.task("default", ["nw"]);
