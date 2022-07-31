const gulp = require('gulp');

const git = require("git-rev-sync");
const rename = require("gulp-rename");
const c = require('ansi-colors');

const fs = require('fs');
const data = require('gulp-data');

const deleteAsync = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

const { PassThrough } = require('stream');


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

function htmlTemplateLintTask() {
    return gulp.src(["./src/templates/*.html"])
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({suppress: true}));
}

// Minify html
function htmlTask() {
    return gulp.src(["./dist/*/*.html"])
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }))
        // minify html
        .pipe(htmlmin({collapseWhitespace:true, removeComments: true}))
        .pipe(gulp.dest('./dist/'));
}


//====================================
// Translations
//
function findVariables(lang) {
    return function(file) {
        const fp = './src/' + lang + '/' + file.stem + '.toml';
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
                + "Example: for errors in " + c.bold.red("templates/ru/index.html") + " find the actual error in " + c.bold.red("src/ru/index.toml")
        console.error(msg);
    }
}

function makeTranslationsTask(cb) {
    // use a nodejs domain to get more exact info for handling template errors
    const d = require('domain').create();
    d.on('error', (err) => {try {annotateError(err)} finally {throw err}});
    d.enter();

    const aggregate  = new PassThrough({objectMode: true});

    for (const lang of ["test", "ru", "en", "kz"]) {
        const r = gulp.src(["./src/templates/*"])
                .pipe(data(findVariables(lang)))
                .pipe(handlebars({}, {compile: {strict:true}}))
                .pipe(rename(path => {
                    path.dirname += "/" + lang;
                }))
                .pipe(gulp.dest('./dist/'))
                .pipe(aggregate);
    }

    // close the domain of error handling
    d.exit();

    aggregate.on('finish', cb);
}



//===========================================
function preCleanTask() {
    return deleteAsync([
        './dist/',
    ]);
}

function copyTask() {
    return gulp.src([
        './src/*/*', 
        
        // exclude these
        '!./src/static/dev_mode',
        '!./src/templates/*',
        '!./src/elm/*',
        '!./src/*/*.toml',
        '!./src/README.md',
    ])
    .pipe(gulp.dest('./dist/'));
}

function postCleanTask() {
    // remove files that are only used in development
    return deleteAsync([
        './dist/README.md',
    ]);
}


// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    preCleanTask,
    copyTask,
    htmlTemplateLintTask,
    makeTranslationsTask,
    htmlTask,
    postCleanTask,
);

exports.lint = gulp.series(
    htmlTemplateLintTask,
);
