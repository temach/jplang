const gulp = require('gulp');

const path = require("path");

// globals
const LANG_CODES = ["en", "ru"];
const UNIFIED_FILES = 'src';
const EXPANDED_FILES = 'dist';


//====================================
// Translations
//
const fse = require('fs-extra');
const glob = require("glob");
const data = require('gulp-data');
const c = require('ansi-colors');
const rename = require("gulp-rename");
const { PassThrough } = require('stream');
const TOML = require('fast-toml');
const handlebars = require('gulp-compile-handlebars');

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
//
const replace = require('gulp-replace');
const htmlhint = require("gulp-htmlhint");
const htmlmin = require('gulp-htmlmin');

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

function htmlLintTask() {
    const pattern = path.join(UNIFIED_FILES, '**', '*.html');
    return gulp.src(pattern)
        // remove dev mode section from html
        .pipe(replace(/.*BEGIN_DEV_MODE.*(\n.*)*END_DEV_MODE.*/g, ""))
        // run htmlhint and report all errors, then fail if error and dont report it
        .pipe(htmlhint(htmlhintconfig))
        .pipe(htmlhint.reporter())
        .pipe(htmlhint.failOnError({ suppress: true }));
}

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
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify-es').default;

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

    const pattern = path.join(UNIFIED_FILES, '**', '*.js');
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

//==========================================
// CSS
//
const postcss    = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const stylelint = require('stylelint');
const doiuse = require('doiuse');
const simplevars = require('postcss-simple-vars');
const nestedcss = require('postcss-nested');
const reporter = require('postcss-reporter');
const cleanCss = require('gulp-clean-css');

const ourbrowsers = ['> 0.05% in RU', 'not ie < 10', 'not OperaMini all'];

const prefixconfig = {
    browserlist : ourbrowsers
};
const doiuseconfig = {
    browserlist: ourbrowsers, // an autoprefixer-like array of browsers.
};
const reportconfig = {
    clearMessages: true,        // should we disable gulp messages
    throwError: false,           // should we stop processing if issues found
    filter: function(message) { return true },      // allow any level of messages, not only warn()
};
const lintconfig = {
    "extends": "stylelint-config-standard",
    "rules": {
        // our rules, place below
        "property-no-vendor-prefix": true,
        "selector-no-vendor-prefix": true,
        "at-rule-no-vendor-prefix": true,
        "value-no-vendor-prefix": true,
        "declaration-no-important": true,
    }
};

function cssLintTask() {
    return gulp.src([
            path.join(UNIFIED_FILES, '**', '*.css'),
            '!' + path.join(UNIFIED_FILES, '**', 'font-awesome.min.css'),
        ])
        .pipe(postcss([
            simplevars(),
            nestedcss(),
            stylelint({config: lintconfig}),
            doiuse(doiuseconfig),
            autoprefixer(prefixconfig),
            reporter(reportconfig),
        ]));
}

function cssTask() {
    return gulp.src(path.join(EXPANDED_FILES, '**', '*.css'))
        // minify
        .pipe(cleanCss({
            compatibility: 'ie10'
        }))
        .pipe(gulp.dest(EXPANDED_FILES));
}


//===========================================
// Fonts
//
// must see for font performance: Peter Muller - High Performance Web Fonts
//
const gulpfontmin = require('gulp-fontmin');
const fontmin = require('fontmin');

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
            const patternFont = path.join(EXPANDED_FILES, '**', 'fonts', 'MochiyPopOne-*.ttf')

            gulp.src(patternFont)
                .pipe(gulpfontmin({
                    text: text,
                    hinting: false,
                    onlyChinese: true,
                    use: [
                        fontmin.ttf2woff(),
                        fontmin.ttf2woff2()
                    ],
                }))
                .pipe(gulp.dest(EXPANDED_FILES))
                .on('end', () => {
                    deleteAsync.sync([
                        // useless font CSS and SVG files
                        path.join(EXPANDED_FILES, '**', 'fonts', 'MochiyPopOne-*.css'),
                        path.join(EXPANDED_FILES, '**', 'fonts', 'MochiyPopOne-*.svg'),
                        path.join(EXPANDED_FILES, '**', 'fonts', 'MochiyPopOne-*.eot'),
                    ]);
                    cb();
                });
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
            const patternFont = path.join(EXPANDED_FILES, '**', 'fonts', 'NunitoSans-*.ttf')

            gulp.src(patternFont)
                .pipe(gulpfontmin({
                    text: text,
                    hinting: false,
                    use: [
                        fontmin.ttf2woff(),
                        fontmin.ttf2woff2()
                    ],
                }))
                .pipe(gulp.dest(EXPANDED_FILES))
                .on('end', () => {
                    deleteAsync.sync([
                        // useless font CSS and SVG files
                        path.join(EXPANDED_FILES, '**', 'fonts', 'NunitoSans-*.css'),
                        path.join(EXPANDED_FILES, '**', 'fonts', 'NunitoSans-*.svg'),
                        path.join(EXPANDED_FILES, '**', 'fonts', 'NunitoSans-*.eot'),
                    ]);
                    cb();
                });
        });
}


//=====================================
// Assets
//
const deleteAsync = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md

function preCleanTask() {
    return deleteAsync([
        EXPANDED_FILES,
    ]);
}

exports.default = gulp.series(
    // lint
    htmlLintTask,
    jsLintTask,
    cssLintTask,

    preCleanTask,

    // expand translations into language dirs
    translationTask,

    // combine expanded files into optimised distribution files
    minifyHtmlTask,
    uglifyJsTask,
    fontminFountainTask,
    fontminTask,
    cssTask,
);
