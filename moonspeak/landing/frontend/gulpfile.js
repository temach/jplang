const gulp = require('gulp');

const rename = require("gulp-rename");
const c = require('ansi-colors');

const fse = require('fs-extra');
const data = require('gulp-data');
const glob = require("glob");
const path = require("path");

const deleteAsync = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

const { PassThrough } = require('stream');

const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify-es').default;

const replace = require('gulp-replace');
const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');
const TOML = require('fast-toml');
const handlebars = require('gulp-compile-handlebars');

const fontmin = require('gulp-fontmin');

const LANG_CODES = ["en", "ru"];
const UNIFIED_FILES = path.join("src", "localhost");
const EXPANDED_FILES = path.join('tmp');


//====================================
// Translations
//
function annotateError(err) {
    if (err.message.includes("not defined in [object Object]")) {
        // this is an error about the templates compilation, it is critical
        let data = err.domainEmitter._transformState.writechunk.data.gulp_debug_data;
        let msg = "Error mashing " + data.toml + " with " + data.template + ". Template received null for this variable: " + err.message;
        console.error(c.bold.red(msg));
    } 
}

function translationTask(cb) {
    // copy the static files, that dont have translations
    const ignoreLangFilesFilter = (src, dest) => ! path.basename(src).includes('.lang');
    for (const langCode of LANG_CODES) {
        fse.copySync(UNIFIED_FILES, path.join(EXPANDED_FILES, langCode), { filter: ignoreLangFilesFilter });
    }

    // use a nodejs domain to get more exact info for handling template errors
    const d = require('domain').create();
    d.on('error', (err) => {try {annotateError(err)} finally {throw err}});
    d.enter();

    // we hit the limit on events because we create a gulp stream for each and every
    // translation file and then aggregate the streams on one object
    // this is not a memory leak
    require('events').EventEmitter.defaultMaxListeners = 50;

    const aggregate  = new PassThrough({objectMode: true});

    const langDirs = glob.sync(path.join(UNIFIED_FILES, '**', '*.lang'), {nonull: false})
    for (const langDir of langDirs) {
        // e.g. index.html.lang, logo.png.lang
        const resourcePath = langDir.replace(/\.lang$/, "");
        const relativeResourcePath = path.relative(UNIFIED_FILES, resourcePath)
        const langFiles = fse.readdirSync(langDir).map(f => path.join(langDir, f));

        for (const langFile of langFiles) {
            // e.g. index.html.en.toml, logo.en.png
            const parts = path.basename(langFile).split(".");
            const extension = parts.pop();
            const langCode = parts.pop();
            
            let translatedFile = null;
            if (extension === "toml") {
                const translationStrings = TOML.parseFileSync(langFile);
                translatedFile = gulp.src(resourcePath)
                    .pipe(data((file) => {
                        return {
                            ...translationStrings,
                            build_date: Date(),
                            gulp_debug_data: {
                                template: resourcePath,
                                toml: langFile,
                            }
                        }
                    }))
                    .pipe(handlebars({}, {compile: {strict:true}}));
            } else {
                translatedFile = gulp.src(langFile);
            }

            translatedFile
                .pipe(rename(path.join(langCode, relativeResourcePath)))
                .pipe(gulp.dest(EXPANDED_FILES))
                .pipe(aggregate);
        }
    }

    // close the domain of error handling
    d.exit();

    aggregate.on('finish', cb);
}


//===========================================
// HTML
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

// Minify html
function htmlLintTask() {
    const pattern = path.join(EXPANDED_FILES, '**', '*.html');
    return gulp.src(pattern)
        // remove dev mode section from html
        .pipe(replace(/.*BEGIN_DEV_MODE.*(\n.*)*END_DEV_MODE.*/g, ""))
        // run htmlhint and report all errors, then fail if error and dont report it
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }));
}


// Minify html
function minifyHtmlTask() {
    const pattern = path.join(EXPANDED_FILES, '**', '*.html');
    return gulp.src(pattern)
        // remove dev mode section from html
        .pipe(replace(/.*BEGIN_DEV_MODE.*(\n.*)*END_DEV_MODE.*/g, ""))
        // run htmlhint and report all errors, then fail if error and dont report it
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }))
        // minify html
        .pipe(htmlmin({collapseWhitespace:true, removeComments: true}))
        .pipe(gulp.dest(EXPANDED_FILES));
}


//==========================================
// Javascript
//

function jsLintTask() {
    const eslintconf = {
        "parserOptions": {
            "sourceType": "module"
        },
        "envs": [
            "es6",
            "browser",
        ],
    };

    const pattern = path.join(EXPANDED_FILES, '**', '*.js');
    return gulp.src(pattern)
        .pipe(eslint(eslintconf))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function uglifyJsTask() {
    const pattern = path.join(EXPANDED_FILES, '**', '*.js');
    return gulp.src(pattern)
        .pipe(uglify())
        .pipe(gulp.dest(EXPANDED_FILES));
}


//===========================================
// Assets

// takes the source files and fonts
// writes the font files only for thouse characters
// that we use in the source files
function fontminFountainTask(cb) {
    let buffers = [];

    const patternJs = path.join(EXPANDED_FILES, '**', 'js', 'fountain.js');
    gulp.src(patternJs)
        .on('data', file => {
            buffers.push(file.contents);
        })
        .on('end', () => {
            // fontmin needs a ttf font source from which it generates all other fonts
            const text = Buffer.concat(buffers).toString('utf-8');
            const patternFont = path.join(EXPANDED_FILES, '**', 'assets', 'MochiyPopOne-Regular.ttf')

            gulp.src(patternFont)
                .pipe(fontmin({
                    text: text,
                    hinting: false,
                }))
                .pipe(gulp.dest(EXPANDED_FILES))
                .on('end', cb);
        });
}

function fontminTask(cb) {
    let buffers = [];

    const patterns = [
        path.join(EXPANDED_FILES, '**', '*.js'),
        path.join(EXPANDED_FILES, '**', '*.html'),
        path.join(EXPANDED_FILES, '**', '*.css'),
    ];

    gulp.src(patterns)
        .on('data', file => {
            buffers.push(file.contents);
        })
        .on('end', () => {
            // fontmin needs a ttf font source from which it generates all other fonts
            const text = Buffer.concat(buffers).toString('utf-8');
            const patternFont = path.join(EXPANDED_FILES, '**', 'assets', 'NunitoSans-Regular.ttf')

            gulp.src(patternFont)
                .pipe(fontmin({
                    text: text,
                    hinting: false,
                }))
                .pipe(gulp.dest(EXPANDED_FILES))
                .on('end', cb);
        });
}

function preCleanTask() {
    return deleteAsync([
        EXPANDED_FILES,
    ]);
}

// function copyAssets() {
//     const patterns = [
//         path.join(EXPANDED_FILES, '**', 'assets', '**'),
//         path.join(EXPANDED_FILES, '**', 'css', '**'),
//     ];
//     return gulp.src(patterns).pipe(gulp.dest(FINAL_FILES));
// }

function postCleanTask(cb) {
    // remove files that are only used in development
    deleteAsync.sync([
        // useless font CSS and SVG files
        path.join(EXPANDED_FILES, '**', 'assets', 'MochiyPopOne-Regular.css'),
        path.join(EXPANDED_FILES, '**', 'assets', 'MochiyPopOne-Regular.svg'),
        path.join(EXPANDED_FILES, '**', 'assets', 'NunitoSans-Regular.css'),
        path.join(EXPANDED_FILES, '**', 'assets', 'NunitoSans-Regular.svg'),
    ]);
    cb();
}

function prepareForServerTask() {
    return gulp.src(path.join(EXPANDED_FILES, '**')).pipe(gulp.dest('src'));
}

exports.default = gulp.series(
    preCleanTask,

    // lint
    htmlLintTask,
    jsLintTask,

    // expand translations into language dirs
    translationTask,

    // combine expanded files into optimised distribution files
    minifyHtmlTask,
    uglifyJsTask,
    fontminFountainTask,
    fontminTask,
    postCleanTask,
    // copyAssets,

    prepareForServerTask,
);
