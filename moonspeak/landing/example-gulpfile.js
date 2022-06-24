//
// browserify: (concatenated browserified files gives error) VS (loading separate files works)
// Quick solution
// We fixed this error by ensuring that the JS bundle in each file ended with a semi-colon, like Keven Wang mentioned, before being concatenated.
// More information
//
// It seems like as of writing, Browserify omits the semi-colon (possibly due to this issue) if you have enabled generating source maps (controlled by debug option). If we don't provide this option, Browserify adds the semi-colon and there are no errors after concatenating.
//
// There seem to be issues caused by whatever the default behaviour is—omitting or appending the semi-colon (see this issue—sometimes you want to wrap the output in an expression, so don't want the semi-colon). It depends heavily on your build pipeline too, as we had no errors in another project with a slightly different build process that was running the output through Grunt's uglify task, stripping the source maps, and adding the semi-colon at the end.
//



// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var run = require('gulp-run');          // to run uncss
var streamify = require('gulp-streamify');
var replace = require('gulp-replace');
var htmlmin = require('gulp-htmlmin');
var cleanCss = require('gulp-clean-css');
var fontmin = require('gulp-fontmin');
var zopfli = require('gulp-zopfli');
var imagemin = require('gulp-imagemin');
var del = require('del');       //< see https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md
var merge2 = require('merge2');
var rename = require('gulp-rename');
var eslint = require('gulp-eslint');
var htmlhint = require("gulp-htmlhint");
var git = require("git-rev-sync");
var spritesmith = require('gulp.spritesmith');

// postcss
var postcss    = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var stylelint = require('stylelint');
var doiuse = require('doiuse');
var oldie = require('oldie');
var simplevars = require('postcss-simple-vars');
var nestedcss = require('postcss-nested');
var reporter = require('postcss-reporter');
var bemlinter = require('postcss-bem-linter');
// var mqpacker = require('css-mqpacker');

// browsers supported by us from browserlist
// project (exact bowsers: http://browserl.ist/?q=%3E0.05%25+in+RU%2C+not+ie+%3C+9)
// this setting is dublicated in .browserslistrc
// caniuse has messed up statistics for OperaMini
// which generates a lot of false warnings
// see https://github.com/browserslist/browserslist/issues/146
var ourbrowsers = ['> 0.05% in RU', 'not ie < 10', 'not OperaMini all'];

// Minify html and fix links to CSS and JS
gulp.task('html', function() {
    var htmlhintconfig = {
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

    return gulp.src('./index.html')
    .pipe(streamify(replace('{{git:hash}}', git.long())))
    .pipe(streamify(replace('{{git:date}}', git.date())))
    .pipe(htmlhint(htmlhintconfig))
    .pipe(htmlhint.reporter())
    // Replace development css files with the minified one.
    .pipe(streamify(replace(/.*GULP_CSS.*(\n.*)*GULP_CSS.*/g, "<link href='index.min.css' rel='stylesheet'>")))
    // Replace development js files with the minified one.
    .pipe(streamify(replace(/.*GULP_JS.*(\n.*)*GULP_JS.*/g, "window.setTimeout(loadjscssfile.bind(null, 'index.min.js', 'js'), 1500);")))
    // write unmangled to debug
    .pipe(gulp.dest('./debug'))
    // minify html
    .pipe(htmlmin({collapseWhitespace:true}))
    .pipe(gulp.dest('./dist'));
});

// Copy assets and test responces
gulp.task('filecopy', ['sprites'], function() {
    return gulp.src([
        // dummy responces
        './history_temp',
        './history_humid',
        './timespans',
        './read',
        // images
        './spritesheet-bundle.png',
        './*.ico',
        // for running test web server
        './*.py',
    ])
    .pipe(gulp.dest('./debug'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('sprites', function () {
    var spriteData = gulp.src([
        './compass-*.png',
    ])
    .pipe(spritesmith({
        /* this is used in css background declarations */
        imgName: 'spritesheet-bundle.png',
        cssName: 'spritesheet.css',
        padding: 1,
    }));

    // put the sprites and css in root dir
    // css later gets bundled
    // png sprite later gets copied (in filecopy)
    return spriteData.pipe(gulp.dest('./'));
});

// bundle together all the css
gulp.task('bundle-css', ['sprites'], function() {
    var lintconfig = {
        ignoreFiles: [
            // ignore sprites css file generated by spritesmith tool
            'spritesheet.css',
        ],
        rules: {
            // the stylelint-config-recommended, it turns on all the possible errors rules within stylelint
            "at-rule-no-unknown": true,
            "block-no-empty": true,
            "color-no-invalid-hex": true,
            "comment-no-empty": true,
            "declaration-block-no-duplicate-properties": [
                true,
                {
                    ignore: ["consecutive-duplicates-with-different-values"]
                }
            ],
            "declaration-block-no-shorthand-property-overrides": true,
            "font-family-no-duplicate-names": true,
            "font-family-no-missing-generic-family-keyword": true,
            "function-calc-no-unspaced-operator": true,
            "function-linear-gradient-no-nonstandard-direction": true,
            "keyframe-declaration-no-important": true,
            "media-feature-name-no-unknown": true,
            "no-descending-specificity": true,
            "no-duplicate-at-import-rules": true,
            "no-duplicate-selectors": true,
            "no-empty-source": true,
            "no-extra-semicolons": true,
            "no-invalid-double-slash-comments": true,
            "property-no-unknown": true,
            "selector-pseudo-class-no-unknown": true,
            "selector-pseudo-element-no-unknown": true,
            "selector-type-no-unknown": true,
            "string-no-newline": true,
            "unit-no-unknown": true,
            // the stylelist-config-standart, turns on additional rules to enforce common stylistic conventions
            "at-rule-empty-line-before": [ "always", {
                except: [
                    "blockless-after-same-name-blockless",
                    "first-nested",
                ],
                ignore: ["after-comment"],
            } ],
            "at-rule-name-case": "lower",
            "at-rule-name-space-after": "always-single-line",
            "at-rule-semicolon-newline-after": "always",
            "block-closing-brace-empty-line-before": "never",
            "block-closing-brace-newline-after": "always",
            "block-closing-brace-newline-before": "always-multi-line",
            "block-closing-brace-space-before": "always-single-line",
            "block-opening-brace-newline-after": "always-multi-line",
            "block-opening-brace-space-after": "always-single-line",
            "block-opening-brace-space-before": "always",
            "color-hex-case": "lower",
            "color-hex-length": "short",
            "comment-empty-line-before": [ "always", {
                except: ["first-nested"],
                ignore: ["stylelint-commands"],
            } ],
            "comment-whitespace-inside": "always",
            "custom-property-empty-line-before": [ "always", {
                except: [
                    "after-custom-property",
                    "first-nested",
                ],
                ignore: [
                    "after-comment",
                    "inside-single-line-block",
                ],
            } ],
            "declaration-bang-space-after": "never",
            "declaration-bang-space-before": "always",
            "declaration-block-semicolon-newline-after": "always-multi-line",
            "declaration-block-semicolon-space-after": "always-single-line",
            "declaration-block-semicolon-space-before": "never",
            "declaration-block-single-line-max-declarations": 1,
            "declaration-block-trailing-semicolon": "always",
            "declaration-colon-newline-after": "always-multi-line",
            "declaration-colon-space-after": "always-single-line",
            "declaration-colon-space-before": "never",
            "declaration-empty-line-before": [ "always", {
                except: [
                    "after-declaration",
                    "first-nested",
                ],
                ignore: [
                    "after-comment",
                    "inside-single-line-block",
                ],
            } ],
            "function-comma-newline-after": "always-multi-line",
            "function-comma-space-after": "always-single-line",
            "function-comma-space-before": "never",
            "function-max-empty-lines": 0,
            "function-name-case": "lower",
            "function-parentheses-newline-inside": "always-multi-line",
            "function-parentheses-space-inside": "never-single-line",
            "function-whitespace-after": "always",
            "indentation": 4,
            "length-zero-no-unit": true,
            "max-empty-lines": 1,
            "media-feature-colon-space-after": "always",
            "media-feature-colon-space-before": "never",
            "media-feature-name-case": "lower",
            "media-feature-parentheses-space-inside": "never",
            "media-feature-range-operator-space-after": "always",
            "media-feature-range-operator-space-before": "always",
            "media-query-list-comma-newline-after": "always-multi-line",
            "media-query-list-comma-space-after": "always-single-line",
            "media-query-list-comma-space-before": "never",
            "no-eol-whitespace": true,
            "no-missing-end-of-source-newline": true,
            "number-leading-zero": "always",
            "number-no-trailing-zeros": true,
            "property-case": "lower",
            "rule-empty-line-before": [ "always-multi-line", {
                except: ["first-nested"],
                ignore: ["after-comment"],
            } ],
            "selector-attribute-brackets-space-inside": "never",
            "selector-attribute-operator-space-after": "never",
            "selector-attribute-operator-space-before": "never",
            "selector-combinator-space-after": "always",
            "selector-combinator-space-before": "always",
            "selector-descendant-combinator-no-non-space": true,
            "selector-list-comma-newline-after": "always",
            "selector-list-comma-space-before": "never",
            "selector-max-empty-lines": 0,
            "selector-pseudo-class-case": "lower",
            "selector-pseudo-class-parentheses-space-inside": "never",
            "selector-pseudo-element-case": "lower",
            "selector-pseudo-element-colon-notation": "double",
            "selector-type-case": "lower",
            "unit-case": "lower",
            "value-list-comma-newline-after": "always-multi-line",
            "value-list-comma-space-after": "always-single-line",
            "value-list-comma-space-before": "never",
            "value-list-max-empty-lines": 0,
            // our rules, place below
            "property-no-vendor-prefix": true,
            "selector-no-vendor-prefix": true,
            "at-rule-no-vendor-prefix": true,
            "value-no-vendor-prefix": true,
            "declaration-no-important": true,
        }
    };


    var prefixconfig = {
        browsers : ourbrowsers
    };

    var reportconfig = {
        clearMessages: true,        // should we disable gulp messages
        throwError: false,           // should we stop processing if issues found
        filter: function(message) { return true },      // allow any level of messages, not only warn()
    };

    var useconfig = {
        browsers: ourbrowsers, // an autoprefixer-like array of browsers.
        ignore: [], // optional: feature names to ignore
        ignoreFiles: [], // optional: file pattern matched against original source file path, to ignore
    }

    var ccss = gulp.src([
        './flatpickr/dist/flatpickr.css',
    ])
    .pipe(postcss([
        autoprefixer(prefixconfig),
        reporter(reportconfig),
    ]))
    .pipe(concat('chart.min.css'))
    .pipe(gulp.dest('./debug'))
    .pipe(cleanCss({
        compatibility: 'ie9'}
    ))
    .pipe(gulp.dest('./dist'));

    var icss = gulp.src([
        './reset.css',
        './loader.css',
        './slidetoggle.css',
        './style.css',
        // will not get linted by stylelint, its in ignoreFiles for stylelint
        './spritesheet.css',
    ])
    // process each file individually
    .pipe(postcss([
        simplevars(),
        nestedcss(),
        stylelint({config: lintconfig}),
        // the bem linter needs extra configuration via source files, so disabled for now
        // bemlinter('bem'),
        doiuse(useconfig),
        autoprefixer(prefixconfig),
        reporter(reportconfig),
    ]))
    .pipe(concat('index.min.css'))
    .pipe(gulp.dest('./debug'))
    // minify it
    .pipe(cleanCss({
        compatibility: 'ie9'}
    ))
    .pipe(gulp.dest('./dist'));

    return merge2([ccss, icss]);
});

// Mangle, concat, minify, uglify JS and CSS
gulp.task('bundle-js', function() {
    var eslintconf = {
        rules: {
            "accessor-pairs": "off",
            "array-bracket-newline": "off",
            "array-bracket-spacing": "off",
            "array-callback-return": "off",
            "array-element-newline": "off",
            "arrow-body-style": "off",
            "arrow-parens": "off",
            "arrow-spacing": "off",
            "block-scoped-var": "off",
            "block-spacing": "off",
            "brace-style": "off",
            "callback-return": "off",
            "camelcase": "off",
            "capitalized-comments": "off",
            "class-methods-use-this": "off",
            "comma-dangle": "off",
            "comma-spacing": "off",
            "comma-style": "off",
            complexity: "off",
            "computed-property-spacing": "off",
            "consistent-return": "off",
            "consistent-this": "off",
            "constructor-super": "warn",
            curly: "off",
            "default-case": "off",
            "dot-location": "off",
            "dot-notation": "off",
            "eol-last": "off",
            eqeqeq: "off",
            "func-call-spacing": "off",
            "func-name-matching": "off",
            "func-names": "off",
            "func-style": "off",
            "function-paren-newline": "off",
            "generator-star-spacing": "off",
            "getter-return": "off",
            "global-require": "off",
            "guard-for-in": "off",
            "handle-callback-err": "off",
            "id-blacklist": "off",
            "id-length": "off",
            "id-match": "off",
            "implicit-arrow-linebreak": "off",
            indent: "off",
            "indent-legacy": "off",
            "init-declarations": "off",
            "jsx-quotes": "off",
            "key-spacing": "off",
            "keyword-spacing": "off",
            "line-comment-position": "off",
            "linebreak-style": "off",
            "lines-around-comment": "off",
            "lines-around-directive": "off",
            "lines-between-class-members": "off",
            "max-depth": "off",
            "max-len": "off",
            "max-lines": "off",
            "max-nested-callbacks": "off",
            "max-params": "off",
            "max-statements": "off",
            "max-statements-per-line": "off",
            "multiline-comment-style": "off",
            "multiline-ternary": "off",
            "new-cap": "off",
            "new-parens": "off",
            "newline-after-var": "off",
            "newline-before-return": "off",
            "newline-per-chained-call": "off",
            "no-alert": "off",
            "no-array-constructor": "off",
            "no-await-in-loop": "off",
            "no-bitwise": "off",
            "no-buffer-constructor": "off",
            "no-caller": "off",
            "no-case-declarations": "warn",
            "no-catch-shadow": "off",
            "no-class-assign": "warn",
            "no-compare-neg-zero": "warn",
            "no-cond-assign": "warn",
            "no-confusing-arrow": "off",
            "no-console": "warn",
            "no-const-assign": "warn",
            "no-constant-condition": "warn",
            "no-continue": "off",
            "no-control-regex": "warn",
            "no-debugger": "warn",
            "no-delete-var": "warn",
            "no-div-regex": "off",
            "no-dupe-args": "warn",
            "no-dupe-class-members": "warn",
            "no-dupe-keys": "warn",
            "no-duplicate-case": "warn",
            "no-duplicate-imports": "off",
            "no-else-return": "off",
            "no-empty": "warn",
            "no-empty-character-class": "warn",
            "no-empty-function": "off",
            "no-empty-pattern": "warn",
            "no-eq-null": "off",
            "no-eval": "off",
            "no-ex-assign": "warn",
            "no-extend-native": "off",
            "no-extra-bind": "off",
            "no-extra-boolean-cast": "warn",
            "no-extra-label": "off",
            "no-extra-parens": "off",
            "no-extra-semi": "warn",
            "no-fallthrough": "warn",
            "no-floating-decimal": "off",
            "no-func-assign": "warn",
            "no-global-assign": "warn",
            "no-implicit-coercion": "off",
            "no-implicit-globals": "off",
            "no-implied-eval": "off",
            "no-inline-comments": "off",
            "no-inner-declarations": "warn",
            "no-invalid-regexp": "warn",
            "no-invalid-this": "off",
            "no-irregular-whitespace": "warn",
            "no-iterator": "off",
            "no-label-var": "off",
            "no-labels": "off",
            "no-lone-blocks": "off",
            "no-lonely-if": "off",
            "no-loop-func": "off",
            "no-magic-numbers": "off",
            "no-mixed-operators": "off",
            "no-mixed-requires": "off",
            "no-mixed-spaces-and-tabs": "warn",
            "no-multi-assign": "off",
            "no-multi-spaces": "off",
            "no-multi-str": "off",
            "no-multiple-empty-lines": "off",
            "no-native-reassign": "off",
            "no-negated-condition": "off",
            "no-negated-in-lhs": "off",
            "no-nested-ternary": "off",
            "no-new": "off",
            "no-new-func": "off",
            "no-new-object": "off",
            "no-new-require": "off",
            "no-new-symbol": "warn",
            "no-new-wrappers": "off",
            "no-obj-calls": "warn",
            "no-octal": "warn",
            "no-octal-escape": "off",
            "no-param-reassign": "off",
            "no-path-concat": "off",
            "no-plusplus": "off",
            "no-process-env": "off",
            "no-process-exit": "off",
            "no-proto": "off",
            "no-prototype-builtins": "off",
            "no-redeclare": "warn",
            "no-regex-spaces": "warn",
            "no-restricted-globals": "off",
            "no-restricted-imports": "off",
            "no-restricted-modules": "off",
            "no-restricted-properties": "off",
            "no-restricted-syntax": "off",
            "no-return-assign": "off",
            "no-return-await": "off",
            "no-script-url": "off",
            "no-self-assign": "warn",
            "no-self-compare": "off",
            "no-sequences": "off",
            "no-shadow": "off",
            "no-shadow-restricted-names": "off",
            "no-spaced-func": "off",
            "no-sparse-arrays": "warn",
            "no-sync": "off",
            "no-tabs": "off",
            "no-template-curly-in-string": "off",
            "no-ternary": "off",
            "no-this-before-super": "warn",
            "no-throw-literal": "off",
            "no-trailing-spaces": "off",
            "no-undef": "warn",
            "no-undef-init": "off",
            "no-undefined": "off",
            "no-underscore-dangle": "off",
            "no-unexpected-multiline": "warn",
            "no-unmodified-loop-condition": "off",
            "no-unneeded-ternary": "off",
            "no-unreachable": "warn",
            "no-unsafe-finally": "warn",
            "no-unsafe-negation": "warn",
            "no-unused-expressions": "off",
            "no-unused-labels": "warn",
            "no-unused-vars": "warn",
            "no-use-before-define": "off",
            "no-useless-call": "off",
            "no-useless-computed-key": "off",
            "no-useless-concat": "off",
            "no-useless-constructor": "off",
            "no-useless-escape": "warn",
            "no-useless-rename": "off",
            "no-useless-return": "off",
            "no-var": "off",
            "no-void": "off",
            "no-warning-comments": "off",
            "no-whitespace-before-property": "off",
            "no-with": "off",
            "nonblock-statement-body-position": "off",
            "object-curly-newline": "off",
            "object-curly-spacing": "off",
            "object-property-newline": "off",
            "object-shorthand": "off",
            "one-var": "off",
            "one-var-declaration-per-line": "off",
            "operator-assignment": "off",
            "operator-linebreak": "off",
            "padded-blocks": "off",
            "padding-line-between-statements": "off",
            "prefer-arrow-callback": "off",
            "prefer-const": "off",
            "prefer-destructuring": "off",
            "prefer-numeric-literals": "off",
            "prefer-promise-reject-errors": "off",
            "prefer-reflect": "off",
            "prefer-rest-params": "off",
            "prefer-spread": "off",
            "prefer-template": "off",
            "quote-props": "off",
            quotes: ["warn", "single"],
            radix: "off",
            "require-await": "off",
            "require-jsdoc": "off",
            "require-yield": "warn",
            "rest-spread-spacing": "off",
            semi: "warn",
            "semi-spacing": "off",
            "semi-style": "off",
            "sort-imports": "off",
            "sort-keys": "off",
            "sort-vars": "off",
            "space-before-blocks": "off",
            "space-before-function-paren": "off",
            "space-in-parens": "off",
            "space-infix-ops": "off",
            "space-unary-ops": "off",
            "spaced-comment": "off",
            strict: ["warn", "global"],
            "switch-colon-spacing": "off",
            "symbol-description": "off",
            "template-curly-spacing": "off",
            "template-tag-spacing": "off",
            "unicode-bom": "off",
            "use-isnan": "warn",
            "valid-jsdoc": "off",
            "valid-typeof": "warn",
            "vars-on-top": "off",
            "wrap-iife": "off",
            "wrap-regex": "off",
            "yield-star-spacing": "off",
            yoda: "off",
        },
        "globals": [
            "flatpickr",
            "vline",
            "DataView",
        ],
        "envs": [
            "browser"
        ],
    };

    var cjs = gulp.src([
        './Chartjs/dist/Chart.js',
        './chartjs-plugin-annotation/chartjs-plugin-annotation.js',
        './vertical-cursor-plugin.js',
        './flatpickr/dist/flatpickr.js',
        './graph.js',
    ])
    .pipe(concat('chart.min.js'))
    .pipe(gulp.dest('./debug'))
    // minify it
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));

    var ijs = gulp.src([
        './constants.js',
        './global.js',
        './connections.js',
        './interface.js',
    ])
    .pipe(concat('index.min.js'))
    // lint it
    .pipe(eslint(eslintconf))
    .pipe(eslint.format())
    .pipe(gulp.dest('./debug'))
    // minify it
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));

    return merge2([cjs, ijs]);
});

// takes the source files and fonts
// writes the font files only for thouse characters
// that we use in the source files
gulp.task('fontcut', ['html', 'bundle-js', 'bundle-css'], function(force_gulp_serial_callback) {
    var buffers = [];

    gulp.src([
        './dist/index.html',
        './dist/chart.min.js',
        './dist/index.min.js',
    ])
    .on('data', function (file) {
        buffers.push(file.contents);
    })
    .on('end', function () {
        // fontmin needs a ttf font source from which it generates all other fonts
        var text = Buffer.concat(buffers).toString('utf-8');
        gulp.src([
            './*.ttf',
        ])
        .pipe(fontmin({
            text: text,
            hinting: false,
        }))
        .pipe(gulp.dest('./dist/'))
        .pipe(gulp.dest('./debug/'))
        // now we can finally call the callback to say that this task is done
        .on('end', force_gulp_serial_callback);
    });
});


// make the final filesystem
// take from "dist" and put into "filesys"

gulp.task('fsimages', function() {
    // compress images
    return gulp.src([
        './dist/*.png',
        './dist/*.svg',
        './dist/*.ico',
    ])
    .pipe(imagemin(null, {
        verbose: true,
    }))
    .pipe(gulp.dest('./filesys/'));
});

// Go through all the files and replace links to other files with cache-busting version
// this appends a query parameter to each file reference with current date (in seconds)
// so "./logo.png" -> "./logo.png?1312312312", "index.min.js" -> "index.min.js?1231231"
// On the backend we ignore the time parameter and just serve the file, but this allows
// browsers to determine when to request the file and when to server from browser cache
gulp.task('fscachebust', function() {

    var cachebust = "?" + git.long().substr(0, 12);
    return gulp.src([
        './dist/*.html',
        './dist/*.css',
        './dist/*.js',
    ])
    // change reference to css file by appending a cache busting query parameter
    .pipe(streamify(replace(/([a-zA-Z0-9_])[.](css|js|html|svg|woff|ttf|png)([)]|["'])/g, "$1.$2" + cachebust + "$3")))
    // write it out
    .pipe(gulp.dest('./filesys'));
});

gulp.task('fszip', ['fsimages', 'fscachebust'], function() {
    // compress everything that can be
    return gulp.src([
        // take js, css, html from filesys (to use results of fscachebust task)
        './filesys/*.js',
        './filesys/*.css',
        './filesys/*.html',
        './dist/*.ttf',
        './dist/*.eot',
        // woff can be compressed by other means
        './dist/*.woff',
        // compress the svg after minification, from filesys
        './filesys/*.svg',
    ])
    .pipe(zopfli({
        zopfliOptions: {
            verbose: false,
            verbose_more: false,
            numiterations: 20,
            blocksplitting: true,
            blocksplittinglast: false,
            blocksplittingmax: 30
        },
        format: 'gzip',
        append: false,       //< if true appends .gz to filename, else overwrites
    }))
    .pipe(gulp.dest('./filesys/'));
});

gulp.task('fscopy', function() {
    // copy over some other files, maybe ico should go here
    return gulp.src([
        // for compass backend
    ])
    .pipe(gulp.dest('./filesys/'));
});

gulp.task('fsclean', ['fszip'], function() {
    // fontmin produces unneeded .css files so we just delete them
    return del([
        './filesys/montserrat-bold.css',
        './filesys/montserrat-regular.css',
    ]);
});

// watch the source files and rebundle them when anything changes
gulp.task('watch', function () {
    gulp.watch([
        // html
        'index.html',
        // css
        'chart.min.css',
        'loader.css',
        'reset.css',
        'slidetoggle.css',
        // this is auto generated
        // 'spritesheet.css',
        'style.css',
        // js
        'chart.min.js',
        'connections.js',
        'constants.js',
        'global.js',
        'graph.js',
        'gulpfile.js',
        // this is auto generated
        // 'index.min.js',
        'interface.js',
        'vertical-cursor-plugin.js',
    ], ['html', 'bundle-css', 'bundle-js']);
});


// Task to make filesystem for upload
gulp.task('mkfs', ['fscachebust', 'fsimages', 'fszip', 'fsclean', 'fscopy'], function(){
    console.log('\n Ready for upload to filesystem! \n');
});

// Default Task
// Build ./debug/ and ./dist/ very close to production (json stubs, minified, fontcut, etc..)
gulp.task('default', ['html', 'bundle-css', 'sprites', 'bundle-js', 'filecopy', 'fontcut'], function() {
    console.log('\n Finished building ./debug/ and ./dist/. Run gulp mkfs task separately! \n');
});

