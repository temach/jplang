async function moonspeakRender(basename, languageTag) {
    let response = await fetch(basename + '.toml');
    let text = await response.text();
    let data = TOML.parse(text);
    let dummy_data = {
        ...data,
        build_date: Date(),
        lang: languageTag,
    }
    let resp = await fetch("../templates/" + basename + ".html");
    let templateText = await resp.text();
    let template = Handlebars.compile(templateText, {strict: true});

    // execute the compiled template and print the output to the console
    // console.log(template({ doesWhat: "rocks!" }));
    // nunjucks.configure('../templates', { autoescape: false, throwOnUndefined: true });
    // let rendered = nunjucks.render(basename + '.template', dummy_data);
    let rendered = template(dummy_data);

    document.open();
    document.write(rendered);
    document.close();
}

function moonspeakBasename() {
    // e.g. from "/test/index.html" we get "index"
    try {
        let basename = window.location.pathname.split("/").pop(0).split(".")[0];
        if (basename.length < 1) {
            return "index";
        }
        return basename;
    } catch (error) {
        console.error(error);
        return "index";
    }
}

// This is the entry point
function moonspeakBoot(languageTag) {
    let basename = moonspeakBasename();
    console.log("Mashing template and data for: " + basename);
    moonspeakRender(basename, languageTag);
}

