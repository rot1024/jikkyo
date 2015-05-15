var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var NwBuilder = require('nw-builder');

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
    gutil.log('node-webkit-builder', msg);
  });
  nw.build(cb);
};

gulp.task('nw:release', ['clean', 'sync'], function(cb) {
  nw(cb, ['win', 'osx', 'linux']);
});

gulp.task('nw:win32', function(cb) {
  nw(cb, ['win32']);
});

gulp.task('nw:win64', function(cb) {
  nw(cb, ['win64']);
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

gulp.task('clean', ['clean:build']);
gulp.task('release', ['clean', 'nw:release']);
gulp.task('default', ['build']);
