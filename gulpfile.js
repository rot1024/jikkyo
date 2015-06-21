var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var NwBuilder = require('nw-builder');
var archiver = require("archiver");

gulp.task('sync', function() {
  var package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var srcPackage = JSON.parse(fs.readFileSync('src/package.json', 'utf8'));
  srcPackage.name = package.name;
  srcPackage.version = package.version;
  srcPackage.description = package.description;
  srcPackage.repository = package.repository;
  srcPackage.homepage = package.homepage;
  try {
    fs.writeFileSync('src/package.json', JSON.stringify(srcPackage, null, "  ") + "\n", 'utf8');
  } catch(e) {
    console.error("Failed to sync package.json");
  }
});

gulp.task('clean:build', function(cb) {
  del(['build'], cb);
});

var nw = function(cb, platforms) {
  var nw = new NwBuilder({
    files: 'src/**',
    version: '0.12.1',
    platforms: platforms,
    build: 'build',
    cacheDir: 'cache',
    macCredits: 'Credits.html',
    macIcns: 'src/images/jikkyo.icns',
    macZip: false,
    winIco: 'src/images/jikkyo.ico',
    winZip: false
  });
  nw.on('log', function(msg) {
    gutil.log('nw-builder', msg);
  });
  nw.build().then(function() {
    platforms.forEach(function(platform) {
      var jikkyo_ct,
          targets =
          platform === "win" ? ["win32", "win64"] :
          platform === "osx" ? ["osx32", "osx64"] :
          platform === "linux" ? ["linux32", "linux64"] : [platform];

      if (platform.indexOf("win") !== -1) {
        jikkyo_ct = fs.readFileSync(path.join(__dirname, "attachment", "jikkyo_ct.cmd"));
        targets.forEach(function(target) {
          fs.writeFileSync(path.join(__dirname, "build", "jikkyo", target, "jikkyo_ct.cmd"), jikkyo_ct);
        });
      }

      if (platform.indexOf("osx") !== -1) {
        jikkyo_ct = fs.readFileSync(path.join(__dirname, "attachment", "jikkyo_ct.command"));
        targets.forEach(function(target) {
          fs.writeFileSync(path.join(__dirname, "build", "jikkyo", target, "jikkyo_ct.command"), jikkyo_ct);
        });
      }

      var readme = fs.readFileSync(path.join(__dirname, "README.md"));
      targets.forEach(function(target) {
        fs.writeFileSync(path.join(__dirname, "build", "jikkyo", target, "README.md"), readme);
      });
    });

    cb();
  });
};

gulp.task('nw:release', ['clean', 'sync'], function(cb) {
  nw(cb, ['win', 'osx', 'linux']);
});

gulp.task('nw', function(cb) {
  var platform = "", arch = "";

  if (process.platform === "win32") platform = "win";
  else if (process.platform === "darwin") platform = "osx";
  else if (process.platform !== "linux") {
    console.error("Cannot build for " + process.platform);
    return;
  }

  if (process.arch === "x64") arch = "64";
  else if (process.arch === "ia32") arch = "32";
  else {
    console.error("Cannot build for " + process.arch);
    return;
  }

  nw(cb, [platform + arch]);
});

gulp.task('nw:win', function(cb) {
  nw(cb, ['win']);
});

gulp.task('nw:win32', function(cb) {
  nw(cb, ['win32']);
});

gulp.task('nw:win64', function(cb) {
  nw(cb, ['win64']);
});

gulp.task('nw:osx', function(cb) {
  nw(cb, ['osx']);
});

gulp.task('nw:osx32', function(cb) {
  nw(cb, ['osx32']);
});

gulp.task('nw:osx64', function(cb) {
  nw(cb, ['osx64']);
});

gulp.task('nw:linux', function(cb) {
  nw(cb, ['linux']);
});

gulp.task('nw:linux32', function(cb) {
  nw(cb, ['linux32']);
});

gulp.task('nw:linux64', function(cb) {
  nw(cb, ['linux64']);
});

gulp.task('clean', ['clean:build']);

var zip = function(platform, version, cb) {
  var archive = archiver('zip');
  var dir = path.join("build", "jikkyo", platform);
  var name = "jikkyo-v" + version + "-" + platform;
  var out = path.join("build", "jikkyo", name + ".zip");

  var output = fs.createWriteStream(out);

  output.on('close', cb);
  archive.on('error', cb);

  archive.pipe(output);
  archive.directory(dir, name).finalize();
};

gulp.task('package', function(cb) {
  var version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

  var dirs = fs.readdirSync("build/jikkyo").filter(function(file) {
    return fs.statSync("build/jikkyo/" + file).isDirectory();
  }).map(function(dir) {
    return new Promise(function(resolve, reject) {
      console.log("Zipping v" + version + "-" + dir + "...");
      zip(dir, version, function(err) {
        if (err) return reject(err);
        console.log("Complete zipping v" + version + "-" + dir + "!");
        resolve();
      });
    });
  });

  Promise.all(dirs).then(cb).catch(cb);
});

gulp.task('release', ['clean', 'nw:release', 'package']);

gulp.task('default', ['nw']);
