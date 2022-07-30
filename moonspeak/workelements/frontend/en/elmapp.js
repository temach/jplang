const hacks = [
    "../common/dev_mode/fast-toml.js",
    "../common/dev_mode/handlebars.js",
    "../common/dev_mode/moonspeak_bootstrap.js",
];

let script = null;
for (const url of hacks) {
    script = document.createElement("script");
    script.src = url;
    document.body.appendChild(script);
}

// wait for browser to load the last hack, then run it to load and template the script in the browser
let scriptName = document.currentScript.src;
script.onload = () => moonspeakBootstrap("en", scriptName);
