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


function request_feature(feature_url) {
    let message = {
        "info": "please feature",
        "src": feature_url,
    }
    console.log(window.location + " posted:");
    console.log(message);
    if (window !== window.parent) {
        window.parent.postMessage(message, window.parent.location.origin);
    }
}


window.addEventListener("load", initPlus, true);
