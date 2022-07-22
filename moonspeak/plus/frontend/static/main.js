async function initPlus() {
    let response = await fetch("config/plus.json");

    if (! response.ok) {
        console.log("HTTP-Error: " + response.status);
        return;
    }

    let featureList = document.getElementById("feature_list");
    let json = await response.json();

    // order affects layout
    for (const service of json["services"]) {
        let img_child = document.getElementById(service["name"]);
        img_child.title += " @ " + service["url"];
        img_child.addEventListener("click", () => {
            request_feature(service["url"]);
        });
    }
}

function isMoonspeakDevMode(hostname = location.hostname) {
    // checking .endsWith() is ok, but .startsWith() is not ok
    return (
        ['localhost', '127.0.0.1', '', '0.0.0.0', '::1'].includes(hostname)
        || hostname.endsWith('.local')
        || hostname.endsWith('.test')
    )
}

function request_feature(feature_url) {
    let message = {
        "info": "please feature",
        "src": feature_url,
    }
    console.log(location + " posted:");
    console.log(message);
    if (window !== window.parent) {
        // if host on dev origin, soften developer pain by relaxing security, else be strict
        let targetOrigin = isMoonspeakDevMode() ? "*" : location.origin;
        window.parent.postMessage(message, targetOrigin);
    }
}


window.addEventListener("load", initPlus, true);
