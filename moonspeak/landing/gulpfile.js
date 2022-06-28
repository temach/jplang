const gulp = require('gulp');

const streamify = require('gulp-streamify');

const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');
const git = require("git-rev-sync");
const replace = require('gulp-replace');
const nunjucks = require('gulp-nunjucks');
const data = require('gulp-data');
const path = require('path');
const fs = require('fs');
const mergejson = require('gulp-merge-json');
const merge2 = require('merge2');
const merge = require('merge-stream');
const TOML = require('fast-toml');

const del = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

function findVariables(lang) {
    return function(file) {
        const language = TOML.parseFileSync('./frontend/' + lang + '/' + file.stem + '.toml')
        return {
            ...language,
            git_hash: git.long(),
            git_date: git.date(),
            "lang": lang,
        }
    }
}

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
        "style-disabled": false,
        "inline-style-disabled": true,
        "inline-script-disabled": false,
        "space-tab-mixed-disabled": "space",
        "id-class-ad-disabled": false,
        "href-abs-or-rel": false,
        "attr-unsafe-chars": true,
        "head-script-disabled": true
    };


    const htmlhintconfig2 = {
        // doctype and head
        "doctype-first": true,
        "doctype-html5": true,
        "html-lang-require": true,
        "head-script-disabled": true,
        "style-disabled": true,
        "script-disabled": false,
        "title-require": true,
        // attributes
        "attr-lowercase": true,
        "attr-no-duplication": true,
        "attr-no-unnecessary-whitespace": true,
        "attr-unsafe-chars": true,
        "attr-value-double-quotes": true,
        "attr-value-single-quotes": false,
        "attr-value-not-empty": true,
        "attr-sorted": true,
        "attr-whitespace": true,
        "alt-require": true,
        "input-requires-label": true,
        // tags
        "tags-check": false,
        "tag-pair": true,
        "tag-self-close": false,
        "tagname-lowercase": true,
        "tagname-specialchars": true,
        "empty-tag-not-self-closed": true,
        "src-not-empty": true,
        "href-abs-or-rel": false,
        // id
        "id-class-ad-disabled": true,
        "id-class-value": "underscore",
        "id-unique": true,
        // inline
        "inline-script-disabled": true,
        "inline-style-disabled": true,
        // formatting
        "space-tab-mixed-disabled": "space",
        "spec-char-escape": true,
    }

    const result = merge();

    for (lang of ["test", "ru", "en", "kz"]) {
    // for (lang of ["test"]) {
        const render = gulp.src(["./frontend/templates/*.template"])
                        .pipe(htmlhint(htmlhintconfig2))
                        .pipe(htmlhint.reporter())
                        .pipe(data(findVariables(lang)))
                        .pipe(nunjucks.compile({}, {autoescape: false, throwOnUndefined: true}))
                        .pipe(htmlhint(htmlhintconfig2))
                        .pipe(htmlhint.reporter())
                        // write unmangled to debug
                        .pipe(gulp.dest('./debug/' + lang + '/'))
                        // minify html
                        .pipe(htmlmin({collapseWhitespace:true, removeComments: true}))
                        .pipe(gulp.dest('./dist/' + lang + '/'));
        result.add(render, {end: false});
    }

    return result.end();
}

function preCleanTask(cb) {
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

function postCleanTask(cb) {
    // remove files that are only used in development
    return del([
        './debug/*/*.toml',
        './dist/*/*.toml',

        './debug/templates',
        './dist/templates',

        './debug/README.md',
        './dist/README.md',
    ]);
}

// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    preCleanTask,
    copyTask,
    htmlTask,
    postCleanTask,
);
