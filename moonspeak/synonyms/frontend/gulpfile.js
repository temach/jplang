const gulp = require('gulp');

const git = require("git-rev-sync");
const rename = require("gulp-rename");
const c = require('ansi-colors');

const fs = require('fs');
const data = require('gulp-data');
const glob = require("glob");
const path = require("path");

const deleteAsync = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

const { PassThrough } = require('stream');

const elm = require('gulp-elm');

// const uglify = require('gulp-uglify');
// const pipeline = require('readable-stream').pipeline;

const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');
const TOML = require('fast-toml');
const handlebars = require('gulp-compile-handlebars');


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

    const tomlFiles = glob.sync("src/*/*.toml", {nonull: false});
    for (const tomlPath of tomlFiles) {
        const langCode = tomlPath.split("/")[1];
        const translationStrings = TOML.parseFileSync(tomlPath);
        const templatePath = "src/templates/" + path.basename(tomlPath, ".toml");

        gulp.src([templatePath])
            .pipe(data((file) => {
                return {
                    ...translationStrings,
                    build_date: Date(),
                    lang: langCode,
                    gulp_debug_data: {
                        template: templatePath,
                        toml: tomlPath
                    }
                }
            }))
            .pipe(handlebars({}, {compile: {strict:true}}))
            .pipe(rename(path => {
                path.dirname += "/" + langCode;
            }))
            .pipe(gulp.dest('dist/'))
            .pipe(aggregate);
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

function htmlTemplateLintTask() {
    return gulp.src(["src/templates/*.html"])
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({suppress: true}));
}

// Minify html
function htmlTask() {
    return gulp.src(["dist/*/*.html"])
        // remove development section from html
        .pipe(streamify(replace(/.*GULP_CSS.*(\n.*)*GULP_CSS.*/g, "<link href='index.min.css' rel='stylesheet'>")))

        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }))
        // minify html
        .pipe(htmlmin({collapseWhitespace:true, removeComments: true}))
        .pipe(gulp.dest('dist/'));
}


//==========================================
// Javascript
//
const eslintconfig = {
    "envs": [
        "browser"
    ],
};

function elmTask() {
  return gulp.src('src/elm/src/Main.elm')
    .pipe(elm.bundle("elmapp.js", {cwd: "src/elm/", optimize: true}))
    .pipe(gulp.dest('src/static/'));
}

// function lintJsTask() {
//     return gulp.src([
//         'src/static/*.js',
//         'src/templates/*.js',
// 
//         // exclude these
//         '!src/templates/elmapp.js',
//     ])
//     .pipe(eslint(eslintconf))
//     .pipe(eslint.format())
//     .pipe(eslint.failAfterError());
// });
// 
// function minifyJsTask() {
//   return pipeline(
//       gulp.src('dist/*/*.js'),
//       uglify(),
//       gulp.dest('dist')
//   );
// });



//===========================================
// Assets
function preCleanTask() {
    return deleteAsync([
        'dist/',
    ]);
}

function copyStatic() {
    return gulp.src([
        'src/static/*', 
        
        // exclude dev_mode files
        '!src/static/dev_mode',
    ])
    .pipe(gulp.dest('dist/static/'));
}

// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    preCleanTask,
    elmTask,
    copyStatic,
    htmlTemplateLintTask,
    makeTranslationsTask,
    htmlTask,
);

exports.lint = gulp.series(
    htmlTemplateLintTask,
);

exports.elm = gulp.series(
    elmTask,
);
