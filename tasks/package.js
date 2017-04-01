"use strict";

const os = require("os");
const packager = require("electron-packager");
const argv = require("minimist")(process.argv.slice(2));
const pkg = require("../package.json");

const shouldBuildAll = argv.all || false;

const options = {
  appCategoryType: pkg.electron.categoryType,
  appCopyright: pkg.electron.copyright,
  appVersion: pkg.version,
  asar: true,
  dir: ".",
  electronVersion: pkg.devDependencies.electron.replace(/^\^/, ""),
  icon: pkg.electron.icon,
  ignore: [
    /^\/(?!build|package.json$)/
  ],
  name: pkg.electron.name || pkg.name,
  out: "dist",
  overwrite: true
};

const archs = shouldBuildAll ? ["ia32", "x64"] : [os.arch()];
const platforms = shouldBuildAll ? ["linux", "win32", "darwin"] : [os.platform()];
platforms.forEach(platform => {
  archs.forEach(arch => {
    console.log(`${platform} ${arch} start`);
    pack(platform, arch).then(
      () => console.log(`${platform} ${arch} finish`),
      err => {
        if (!err) return;
        console.log(`${platform} ${arch} error`);
        throw err;
      }
    );
  });
});

function pack(platform, arch) {
  if (platform === "darwin" && arch === "ia32") {
    return Promise.reject(); // eslint-disable-line prefer-promise-reject-errors
  }

  const opts = Object.assign({}, options, {
    platform,
    arch,
    icon: options.icon ? options.icon + (
      platform === "darwin" ? ".icns" :
      platform === "win32" ? ".ico" : ".png"
    ) : undefined
  });

  return new Promise((resolve, reject) => {
    packager(opts, (err, appPaths) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(appPaths);
    });
  });
}
