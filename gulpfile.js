var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var NwBuilder = require('node-webkit-builder');

gulp.task('sync', function() {
  var package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var srcPackage = JSON.parse(fs.readFileSync('src/package.json', 'utf8'));
  var srcBower = JSON.parse(fs.readFileSync('src/bower.json', 'utf8'));
  srcPackage.name = srcBower.name = package.name;
  srcPackage.version = srcBower.version = package.version;
  srcPackage.description = srcBower.description = package.description;
  try {
    fs.writeFileSync('src/package.json',
                     JSON.stringify(srcPackage, null, "  "), 'utf8');
    fs.writeFileSync('src/bower.json',
                     JSON.stringify(srcBower, null, "  "), 'utf8');
  } catch(ignore) {
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
    macZip: true,
    winIco: 'src/images/jikkyo.ico'
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
gulp.task('release', ['clean', 'sync', 'nw:release']);
gulp.task('default', ['build']);
