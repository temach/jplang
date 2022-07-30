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

function moonspeakBasename(url=null) {
    // e.g. from "/test/index.html" we get "index"
    try {
        if (! url) {
            url = window.location.pathname;
        }
        return url.split("/").pop(0).split(".");
    } catch (error) {
        console.error(error);
        return ["index", "html"];
    }
}

// This is the entry point
function moonspeakBootstrap(languageTag, url=null) {
    [basename, extension] = moonspeakBasename(url);
    console.log("Mashing template and data for: " + basename + "." + extension);
    moonspeakRender(basename, extension, languageTag);
}

