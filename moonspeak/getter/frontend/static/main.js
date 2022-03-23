const iframes = new Map();

// function add_feature()
// append_feature(document.getElementById('features'), document.getElementById('feature-url').value)

async function get_feature(feature_url, callback) {
    let backend = new URL("/api/getfeature", window.location);
    backend.searchParams.set('feature_url', new URL(feature_url));

    let response = await fetch(backend);
    if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
    }
    let feature_json = await response.json();
    return feature_json;
}

function append_feature(parent_elem, feature_url) {
    get_feature(feature_url).then(feature_json => {
        // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
        let iframe = document.createElement("iframe");
        iframe.srcdoc = feature_json["text"];
        parent_elem.appendChild(iframe);
        iframes.set(iframe, new Set());
    }).catch(error => {
        console.log("HTTP error:" + error.message);
    });
}

function append_feature_fullscreen(parent_elem, feature_url) {
    get_feature(feature_url).then(feature_json => {
        // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
        let iframe = document.createElement("iframe");
        iframe.classList.add("fullscreen");
        iframe.srcdoc = feature_json["text"];
        parent_elem.appendChild(iframe);
        iframes.set(iframe, new Set());
    }).catch(error => {
        console.log("HTTP error:" + error.message);
    });
}


// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", (event) => {
    if (event.origin !== window.top.location.origin) {
        // we only accept messages from the IFrames (must be on the same domain)
        return;
    }

    console.log("getter received: ");
    console.log(event.data);

    // if (event.data["moonspeak_routing"]) {
    //     let source = event.data["moonspeak_routing"]["source_iframe"];
    //     let target = event.data["moonspeak_routing"]["target_iframe"];
    //     if (origin) {
    //         let setOfOrigins = iframes.get(target);
    //         setOfOrigins.add(target);
    //     } else if (! origin)
    //     let action = event.data["moonspeak_routing"]["action"]
    //     if (action === "add_route") {
    //     } else if (action === "delete_route") {

    //     } else if (action === "suspend_route") {

    //     }
    //     return;
    // }

    iframes.forEach(function(downstreamFrames, currentFrame, map) {
        var iframeWindow = (currentFrame.contentWindow || currentFrame.contentDocument);
        if (iframeWindow !== event.source) {
            iframeWindow.postMessage(event.data, window.top.location.origin);
        };
    });

});
