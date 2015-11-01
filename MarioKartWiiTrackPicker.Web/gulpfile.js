/// <binding Clean='clean' />
var gulp = require('gulp'),
    rimraf = require('rimraf'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    uglify = require('gulp-uglify'),
    swPrecache = require('sw-precache'),
    path = require('path'),
    fs = require('fs'),
    sass = require('gulp-sass'),
    runSequence = require('run-sequence'),
    project = require('./project.json');


function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


var paths = {
    webroot: './' + project.webroot + '/'
};

paths.dist = paths.webroot + 'dist/';
paths.moduleJs = paths.webroot + 'js/**/*.module.js';
paths.js = paths.webroot + 'js/**/*.js';
paths.jsVendor = [paths.webroot + 'lib/hammer.js/hammer.js'];
paths.minJs = paths.webroot + 'js/**/*.min.js';
paths.scss = './styles/**/*.scss';
paths.css = paths.webroot + 'css/**/*.css';
paths.cssVendor = [paths.webroot + 'lib/angular/angular-csp.css'];
paths.minCss = paths.webroot + 'css/**/*.min.css';
paths.concatJsVendorDest = paths.dist + 'vendor' + generateGuid() + '.min.js';
paths.concatJsModuleDest = paths.dist + 'modules' + generateGuid() + '.min.js';
paths.concatJsDest = paths.dist + 'other' + generateGuid() + '.min.js';
paths.concatCssDest = paths.dist + 'site' + generateGuid() + '.min.css';

gulp.task('clean', function (cb) {
    rimraf(paths.dist, cb);
});

gulp.task('min:js-vendor', function () {
    return gulp.src(paths.jsVendor, { base: '.' })
        .pipe(concat(paths.concatJsVendorDest))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});

gulp.task('min:js-modules', function () {
    return gulp.src([paths.moduleJs, '!' + paths.minJs], { base: '.' })
        .pipe(concat(paths.concatJsModuleDest))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});

gulp.task('min:js-other', function () {
    return gulp.src([paths.js, '!' + paths.minJs, '!' + paths.moduleJs], { base: '.' })
        .pipe(concat(paths.concatJsDest))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});

gulp.task('min:js', ['min:js-vendor', 'min:js-modules', 'min:js-other']);

gulp.task('sass', function () {
    return gulp.src(paths.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.webroot + '/css'));
});

gulp.task('min:css', function () {
    return gulp.src(paths.cssVendor.concat([paths.css, '!' + paths.minCss]))
        .pipe(concat(paths.concatCssDest))
        .pipe(cssmin())
        .pipe(gulp.dest('.'));
});

gulp.task('min', ['min:js', 'min:css']);

gulp.task('create-fake-serviceworker-index', function (callback) {
    fs.writeFile(path.join(paths.webroot, 'Home/Index'), '<html></html>', function (err) {
        if (err) {
            callback(err);
        }
        callback();
    });
});

var commonServiceWorkerCachePaths = [
    paths.webroot + 'Home/Index',
    paths.webroot + 'favicon.ico',
    paths.webroot + 'images/**/*.{png,jpg,gif}',
    paths.webroot + 'images/**/*.{png,jpg,gif}'
];

gulp.task('generate-service-worker', function (callback) {
    swPrecache.write(path.join(paths.webroot, 'service-worker.js'), {
        directoryIndex: 'Home/Index',
        staticFileGlobs: commonServiceWorkerCachePaths.concat([
            paths.webroot + '**/*.{min.js,min.css}'
        ]),
        stripPrefix: paths.webroot
    }, callback);
});

gulp.task('generate-service-worker-dev', function (callback) {
    swPrecache.write(path.join(paths.webroot, 'service-worker.js'), {
        directoryIndex: 'Home/Index',
        staticFileGlobs: commonServiceWorkerCachePaths
            .concat(paths.cssVendor)
            .concat(paths.jsVendor)
            .concat([
            paths.webroot + 'lib/bootstrap/dist/css/bootstrap.css',
            paths.webroot + 'lib/jquery/dist/jquery.js',
            paths.webroot + 'lib/bootstrap/dist/js/bootstrap.js',
            paths.webroot + 'lib/lodash/lodash.js',
            paths.webroot + 'lib/angular/angular.js',
            paths.webroot + 'lib/angular-cookies/angular-cookies.js',
            paths.webroot + 'lib/angular-animate/angular-animate.js',
            paths.css,
            paths.js
            ]),
        stripPrefix: paths.webroot
    }, callback);
});

gulp.task('delete-fake-serviceworker-index', function (callback) {
    fs.unlink(path.join(paths.webroot, 'Home/Index'), function (err) {
        if (err) {
            callback(err);
        }
        callback();
    });
});

gulp.task('build-service-worker', function (callback) {
    runSequence('create-fake-serviceworker-index',
        'generate-service-worker',
        'delete-fake-serviceworker-index',
        callback);
});

gulp.task('build-service-worker-dev', function (callback) {
    runSequence('create-fake-serviceworker-index',
        'generate-service-worker-dev',
        'delete-fake-serviceworker-index',
        callback);
});

gulp.task('build-common', function (callback) {
    runSequence('clean',
        'sass',
        'min',
        callback);
});

gulp.task('build', function (callback) {
    runSequence('build-common',
        'build-service-worker',
        callback);
});

gulp.task('build-dev', function (callback) {
    runSequence('build-common',
        'build-service-worker-dev',
        callback);
});

gulp.task('watch-then-build', function () {
    gulp.watch([paths.webroot + 'js/**/*.js', paths.scss], ['build-dev']);
});

gulp.task('watch', function (callback) {
    runSequence('build-dev', 'watch-then-build', callback);
});
