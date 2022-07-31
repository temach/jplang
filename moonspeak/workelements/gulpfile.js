const gulp = require('gulp');

const git = require("git-rev-sync");
const rename = require("gulp-rename");
const c = require('ansi-colors');

const fs = require('fs');
const data = require('gulp-data');
const mergeStream =   require('merge-stream');
const tap = require('gulp-tap');

const del = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md


//===========================================
// HTML
const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');
const TOML = require('fast-toml');
const handlebars = require('gulp-compile-handlebars');

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

function htmlTemplateLintTask(cb) {
    gulp.src(["./frontend/templates/*.html"])
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({suppress: true}))
        .on('finish', cb);
}

function delayTask(cb) {
    setTimeout(cb, 100);
}

// Minify html
function htmlTask(cb) {
    gulp.src(["./dist/*/*.html"])
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }))
        // minify html
        .pipe(htmlmin({collapseWhitespace:true, removeComments: true}))
        .pipe(gulp.dest('./dist/'))
        .on('finish', cb); 
}


//====================================
// Translations
//
function findVariables(lang) {
    return function(file) {
        const fp = './frontend/' + lang + '/' + file.stem + '.toml';
        const language = TOML.parseFileSync(fp)
        return {
            ...language,
            build_date: Date(),
            "lang": lang,
            gulp_debug_data: {
                template: file.basename,
                toml: lang + '/' + file.stem + '.toml',
            }
        }
    }
}

function annotateError(err) {
    if (err.message.includes("not defined in [object Object]")) {
        // this is an error about the templates compilation, it is critical
        let data = err.domainEmitter._transformState.writechunk.data.gulp_debug_data;
        let msg = "Error mashing " + data.toml + " with " + data.template + ". Template received null for this variable: " + err.message;
        console.error(c.bold.red(msg));
    } 
    else if (err.plugin === 'gulp-htmlhint') {
        let msg = c.bold.red("HTMLHint reporting uses wrong filenames:\n")
                + "Example: for errors in " + c.bold.red("templates/ru/doc.html") + " find the actual error in " + c.bold.red("frontend/ru/doc.toml")
        console.error(msg);
    }
}

function makeTranslationsTask(cb) {
    // use a nodejs domain to get more exact info for handling template errors
    const d = require('domain').create();
    d.on('error', (err) => {try {annotateError(err)} finally {throw err}});
    d.enter();

    const result = mergeStream();

    for (const lang of ["test", "ru", "en", "kz"]) {
        const r = gulp.src(["./frontend/templates/*"])
                .pipe(data(findVariables(lang)))
                .pipe(handlebars({}, {compile: {strict:true}}))
                .pipe(rename(path => {
                    path.dirname += "/" + lang;
                }))
                .pipe(gulp.dest('./dist/'));

        // by default does not close streams after each add
        result.add(r);
    }

    // close the domain of error handling
    d.exit();

    result.on('finish', cb); 
    result.end();
}



//===========================================
function preCleanTask(cb) {
    del.sync([
        './dist/',
    ]);
    cb();
}

function copyTask(cb) {
    gulp.src([
        './frontend/*/*', 
        
        // exclude these
        '!./frontend/static/dev_mode',
        '!./frontend/templates/*',
        '!./frontend/elm/*',
        '!./frontend/*/*.toml',
        '!./frontend/README.md',
    ])
    .pipe(gulp.dest('./dist/'))
    .on('end', cb);
}

function postCleanTask(cb) {
    // remove files that are only used in development
    del.sync([
        './dist/README.md',
    ]);
    cb();
}


// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    preCleanTask,
    copyTask,
    htmlTemplateLintTask,
    makeTranslationsTask,

    // add delay to allow filesystem to flush
    // or use complex in memory files: https://github.com/gulpjs/gulp/blob/master/docs/recipes/make-stream-from-buffer.md
    delayTask,

    htmlTask,
    postCleanTask,
);

exports.lint = gulp.series(
    htmlTemplateLintTask,
);
