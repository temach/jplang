async function moonspeakRender(basename, extension, languageTag) {
    let response = await fetch(basename + '.toml');
    let text = await response.text();
    let data = TOML.parse(text);
    let dummy_data = {
        ...data,
        build_date: Date(),
        lang: languageTag,
    }
    let resp = await fetch("../templates/" + basename + "." + extension);
    let templateText = await resp.text();
    let template = Handlebars.compile(templateText, {strict: true});

    let rendered = template(dummy_data);

    if (extension === "html") {
        document.open();
        document.write(rendered);
        document.close();
    } else if (extension === "js") {
        let script = document.createElement("script");
        script.innerHTML = rendered;
        document.body.appendChild(script);
    }
}

function moonspeakBasename(fileUrl=null) {
    // e.g. from "/test/index.html" we get "index"
    try {

        // try to auto determine which file is being loaded 
        // for HTML: window.location.href
        // for JS: document.currentScript.src
        if (! fileUrl) {
            if (! document.currentScript || ! document.currentScript.src) {
                // we are running from HTML markup script tag
                fileUrl = window.location.href;
            } else {
                // we are being eval'd by somefile.js
                fileUrl = document.currentScript.src;
            }
            // const scriptName = document.currentScript.src;
            // if (scriptName.includes("moonspeak_bootstrap.js")) {
            //     fileUrl = window.location.href;
            // } else {
            //     // we are being eval'd by somefile.js
            //     fileUrl = document.currentScript.src;
            // }
        }

        let [base, ext] = fileUrl.split("/").pop(0).split(".");
        if (base.length < 1 || ext.length < 1) {
            throw "Can not get basename & extension from: " + fileUrl;
        }
        return [base, ext];
    } catch (error) {
        console.error(error);
        return ["index", "html"];
    }
}

function moonspeakLanguage() {
    // e.g. from "/en/index.html" we get "en"
    try {
        // try to return first component of pathname if its exactly 2 letters or "test" special language
        const pathZero = window.location.pathname.split("/").at(1);
        if (! (pathZero === "test" || pathZero.length === 2)) {
            throw "Can not get language first component from: " + window.location.pathname;
        }
        return "test";
    } catch (error) {
        console.error(error);
        return "test";
    }
}

function moonspeakBootstrap(fileUrl=null) {
    const languageTag = moonspeakLanguage()
    const [basename, extension] = moonspeakBasename(fileUrl);

    const hacks = [
        "../common/dev_mode/fast-toml.js",
        "../common/dev_mode/handlebars.js",
    ];

    let script = null;
    for (const hackUrl of hacks) {
        script = document.createElement("script");
        script.src = hackUrl;
        document.body.appendChild(script);
    }

    // wait for browser to load the last hack, then run this to fetch, template, load the actual file
    script.onload = () => {
        console.log("Mashing template and data for: " + basename + "." + extension);
        moonspeakRender(basename, extension, languageTag);
    };
}
