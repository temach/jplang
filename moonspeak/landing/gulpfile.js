const gulp = require('gulp');

const streamify = require('gulp-streamify');

const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');
const git = require("git-rev-sync");
const replace = require('gulp-replace');

const del = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

// Minify html and fix links to CSS and JS
function htmlTask() {
    const htmlhintconfig = {
        "tagname-lowercase": true,
        "attr-lowercase": true,
        "attr-value-double-quotes": true,
        "attr-value-not-empty": false,
        "attr-no-duplication": true,
        "doctype-first": true,
        "tag-pair": true,
        "tag-self-close": false,
        "spec-char-escape": true,
        "id-unique": true,
        "src-not-empty": true,
        "title-require": true,
        "alt-require": true,
        "doctype-html5": true,
        "id-class-value": "underscore",
        "style-disabled": false,
        "inline-style-disabled": false,
        "inline-script-disabled": false,
        "space-tab-mixed-disabled": "space",
        "id-class-ad-disabled": false,
        "href-abs-or-rel": false,
        "attr-unsafe-chars": true,
        "head-script-disabled": true
    };

    return gulp.src('./frontend/*/*.html')
        .pipe(streamify(replace('{{git:hash}}', git.long())))
        .pipe(streamify(replace('{{git:date}}', git.date())))
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        // write unmangled to debug
        .pipe(gulp.dest('./debug'))
        // minify html
        .pipe(htmlmin({collapseWhitespace:true}))
        .pipe(gulp.dest('./dist'));
}

function cleanTask(cb) {
    return del([
        './debug/**/*',
        './dist/**/*',
    ]);
}

function copyTask(cb) {
    return gulp.src('./frontend/**/*')
        .pipe(gulp.dest('./debug/'))
        .pipe(gulp.dest('./dist/'));
}

// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    cleanTask,
    copyTask,
    htmlTask
);
