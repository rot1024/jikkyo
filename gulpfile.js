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

let currentTarget;

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
  const list = [];
  const parent = "build/jikkyo";

  if (target === "all") {
    list.push(parent);
  } else {
    list.push(`${parent}/${target}`);
    list.push(`${parent}/*-${target}.zip`);
  }

  return list;
}

function nw(targets) {
  const nwb = new NwBuilder({
    files: "src/**/*",
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
  const files = ["README.md", "LICENSE"];

  if (target.includes("win")) {
    files.push("attachment/jikkyo_ct.cmd");
  } else if (target.includes("osx")) {
    files.push("attachment/jikkyo_ct.command");
  } else if (target.includes("linux")) {
    files.push("attachment/jikkyo_ct.sh");
  }

  return files;
}

function pack(targets) {
  return readJSON("package.json").then(json => {
    const version = json.version;

    return Promise.all(targets.map(target => {
      return new Promise((resolve, reject) => {
        const dir = `build/jikkyo/${target}`;
        const name = `jikkyo-v${version}-${target}`;
        const out = `build/jikkyo/${name}.zip`;

        const archive = archiver("zip");
        const output = fs.createWriteStream(out);

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
    const pkg = jsons[0];
    const srcPkg = jsons[1];

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
    if (platform === "win") {
      gulp.task(`workaround:${target}`, () => {
        return gulp.src("src/package.json")
          .pipe(gulp.dest(`build/jikkyo/${target}/src`));
      });
    }
    gulp.task(`clean:${target}`, () => del(cleanList(target)));
    gulp.task(`nw:${target}`, () => nw([target]));
    gulp.task(`copy:${target}`, platform === "win" ? [`workaround:${target}`] : [], () => {
      return gulp.src(copyList(target)).pipe(gulp.dest(`build/jikkyo/${target}`));
    });
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
