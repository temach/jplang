const gulp = require('gulp');

const rename = require("gulp-rename");
const c = require('ansi-colors');

const fse = require('fs-extra');
const data = require('gulp-data');
const glob = require("glob");
const path = require("path");

const deleteAsync = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

const { PassThrough } = require('stream');

const elm = require('gulp-elm');

const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify-es').default;

const replace = require('gulp-replace');
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
}

function translationsTask(cb) {
    // use a nodejs domain to get more exact info for handling template errors
    const d = require('domain').create();
    d.on('error', (err) => {try {annotateError(err)} finally {throw err}});
    d.enter();

    const aggregate  = new PassThrough({objectMode: true});

    const tomlFiles = glob.sync("src/**/*.toml", {nonull: false});
    for (const tomlPath of tomlFiles) {
        // e.g. index.html.en.toml
        const components = path.basename(tomlPath).split(".");
        components.pop();
        const langCode = components.pop();
        const templatePath = path.join(path.dirname(tomlPath), components.join("."));

        const translationStrings = TOML.parseFileSync(tomlPath);

        gulp.src([templatePath], {base: "src"})
            .pipe(data((file) => {
                return {
                    ...translationStrings,
                    build_date: Date(),
                    gulp_debug_data: {
                        template: templatePath,
                        toml: tomlPath
                    }
                }
            }))
            .pipe(handlebars({}, {compile: {strict:true}}))
            .pipe(gulp.dest(path.join('dist', langCode)))
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

// Minify html
function htmlLintTask() {
    return gulp.src(["src/**/*.html"])
        // remove dev mode section from html
        .pipe(replace(/.*BEGIN_DEV_MODE.*(\n.*)*END_DEV_MODE.*/g, ""))
        // run htmlhint and report all errors, then fail if error and dont report it
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }));
}


// Minify html
function htmlTask() {
    return gulp.src(["dist/**/*.html"])
        // remove dev mode section from html
        .pipe(replace(/.*BEGIN_DEV_MODE.*(\n.*)*END_DEV_MODE.*/g, ""))
        // run htmlhint and report all errors, then fail if error and dont report it
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

    return gulp.src([
            'src/**/*.js',
            // exclude these
            '!src/**/elm-app.js',
        ])
        .pipe(eslint(eslintconf))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function jsTask(cb) {
    const aggregate  = new PassThrough({objectMode: true});
    const langFolders = glob.sync("dist/*", {nonull: false});
    for (const langFolder of langFolders) {
        gulp.src(langFolder + "/**/*.js", {base: "dist"})
            .pipe(uglify())
            .pipe(gulp.dest("dist/"))
            .pipe(aggregate);
    }
    aggregate.on('finish', cb);
}

function elmTask() {
    const pure = ["F2","F3","F4","F5","F6","F7","F8","F9","A2","A3","A4","A5","A6","A7","A8","A9"];
    const elmUglifyConf = {
        compress: {
            // from elm docs: https://guide.elm-lang.org/optimization/asset_size.html
            pure_funcs: pure,
            pure_getters: true,
            keep_fargs: false,
            unsafe_comps: true,
            unsafe: true,
        },
        mangle: {
            // see uglify docs for pure_funcs arg
            reserved: pure,
        }
    }

    return gulp.src('elm/src/Main.elm')
        .pipe(elm.bundle("elm-app.js", {cwd: "elm/", optimize: true}))

        // hot fixes to allow transpiled elm code to be natively imported as browser javascript module
        .pipe(replace("(this)", "(window)"))
        .pipe(replace(/$/, "\nexport const Elm = window.Elm;"))

        // special uglify config for elm
        .pipe(uglify(elmUglifyConf))

        .pipe(gulp.dest('src/js/'));
}



//===========================================
// Assets
function preCleanTask() {
    return deleteAsync([
        'dist/',
    ]);
}

function copyStatic(cb) {
    const shouldCopy = (src, dest) => {
        if (path.extname(src) === ".toml") {
            return false;
        }
        return true;
    }

    for (const langCode of ["en", "kz", "ru", "localhost"]) {
        const langFolder = path.join("dist", langCode);
        fse.copySync("src", langFolder, { filter: shouldCopy });
    }
    cb();
}

function makeSymlinks(cb) {
    // create domain to ignore possible error
    const d = require('domain').create();
    d.on('error', (err) => console.warn(err));
    d.enter();

    // create symlinks so backend can serve the translated frontends easily
    // see: https://nodejs.org/api/fs.html#fspromisessymlinktarget-path-type
    fse.symlink("dist/ru", "ru", "junction");
    fse.symlink("dist/en", "en", "junction");
    fse.symlink("dist/kz", "kz", "junction");

    // close the domain of error handling
    d.exit();

    cb();
}

// start by copying all files,
// then gradually improve by overriding some of them with optimised versions
exports.default = gulp.series(
    preCleanTask,
    elmTask,
    htmlLintTask,
    jsLintTask,
    copyStatic,
    translationsTask,
    htmlTask,
    jsTask,
    makeSymlinks,
);

exports.elm = gulp.series(
    elmTask,
);
