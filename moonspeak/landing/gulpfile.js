const gulp = require('gulp');

const streamify = require('gulp-streamify');

const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');
const git = require("git-rev-sync");
const replace = require('gulp-replace');
const rename = require("gulp-rename");
const log = require('fancy-log');
const c = require('ansi-colors');

const handlebars = require('gulp-compile-handlebars');

const data = require('gulp-data');
const path = require('path');
const fs = require('fs');
const mergejson = require('gulp-merge-json');
const merge2 = require('merge2');
const merge = require('merge-stream');
const TOML = require('fast-toml');

const del = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

//==================================================
// HTML
//
function findVariables(lang) {
    return function(file) {
        const fp = './frontend/' + lang + '/' + file.stem + '.toml';
        const language = TOML.parseFileSync(fp)
        return {
            ...language,
            git_hash: git.long(),
            git_date: git.date(),
            "lang": lang,
            gulp_debug_data: {
                template: file.basename,
                toml: lang + '/' + file.stem + '.toml',
            }
        }
    }
}

const htmlhintconfig = {
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
    "tags-check": true,
    "tag-pair": true,
    "tag-self-close": false,
    "tagname-lowercase": true,
    "tagname-specialchars": true,
    "empty-tag-not-self-closed": false,
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

function htmlTemplateLintTask() {
    return gulp.src(["./frontend/templates/*.template"])
                    .pipe(htmlhint(htmlhintconfig))
                    .pipe(htmlhint.reporter());
}

function printNicerError(err) {
    if (err.message.includes("not defined in [object Object]")) {
        // this is an error about the templates
        let data = err.domainEmitter._transformState.writechunk.data.gulp_debug_data;
        let msg = "Error mashing " + data.toml + " with " + data.template + ". Template received null for this variable: " + err.message;
        log.error(c.bold.red(msg));
    }
}

// Minify html and fix links to CSS and JS
function htmlTask() {
    // use a nodejs domain to get more exact info for handling template errors
    const d = require('domain').create();
    d.on('error', (err) => {printNicerError(err); throw err;});
    d.enter();

    const result = merge();
    for (const lang of ["test", "ru", "en", "kz"]) {
        const r = gulp.src(["./frontend/templates/*.template"])
                .pipe(data(findVariables(lang)))
                .pipe(handlebars({}, {compile: {strict:true}}))
                // becasue we sourced *.template we need to fix names here
                .pipe(rename(path => {
                    path.dirname += "/" + lang;
                    path.extname = ".html";
                }))
                .pipe(htmlhint(htmlhintconfig))
                .pipe(htmlhint.reporter())
                // minify html
                .pipe(htmlmin({collapseWhitespace:true, removeComments: true}))
                .pipe(gulp.dest('./dist/'));

        result.add(r, {end: false});
    }

    // close the domain of error handling
    d.exit();

    return result.end();
}

function preCleanTask() {
    return del([
        './dist/**/*',
    ]);
}

function copyTask() {
    return gulp.src([
            './frontend/*/*', 
            
            // exclude these
            '!./frontend/*/*.html',
            '!./frontend/*/*.js',
            '!./frontend/*/*.template',
            '!./frontend/*/*.toml',
        ])
        .pipe(gulp.dest('./dist/'));
}

function postCleanTask(cb) {
    // remove files that are only used in development
    return del([
        './dist/*/*.toml',
        './dist/templates',
        './dist/README.md',
    ]);
}


// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    preCleanTask,

    copyTask,

    // html
    htmlTemplateLintTask,
    htmlTask,
);

exports.lint = gulp.series(
    htmlTemplateLintTask,
);
