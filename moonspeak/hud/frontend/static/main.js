
async function get_feature(feature_url) {
    let backend = new URL("/api/getfeature", window.location);
    backend.searchParams.set('feature_url', new URL(feature_url));

    let response = await fetch(backend);
    if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
    }
    let feature_json = await response.json();
    return feature_json;
}

async function loadHudFeatures() {
    let urls = [
        "http://0.0.0.0:9010",
        "http://0.0.0.0:9012",
        "http://0.0.0.0:9011",
    ];

    let container = document.getElementById("featuresContainer");

    let fullscreenFrames = new Array();
    for (const url of urls) {
        try {
            let feature_json = await get_feature(url);
            // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
            let iframe = document.createElement("iframe");
            iframe.classList.add("fullscreen");
            iframe.srcdoc = feature_json["text"];

            container.appendChild(iframe);
            fullscreenFrames.push(iframe);
        } catch (error) {
            console.log("HTTP error:" + error.message);
        };
    }

    return fullscreenFrames;

}

function setupHandlers(fullscreenFrames) {
    let STATE_PROPOGATING = "propogating";
    let STATE_HANDLED = "handled";

    let eventTrap = document.getElementById("eventTrap");

    let handler = (e) => {
        let evt = new MouseEvent(e.type, e);
        evt.moonspeakEventState = STATE_PROPOGATING;
        for (const child of fullscreenFrames) {
                if (evt.moonspeakEventState === STATE_HANDLED) {
                    // stop early if event was handled
                    break; 
                }
                let innerEl = child.contentWindow.document.elementFromPoint(e.clientX, e.clientY);
                if (innerEl) {
                    innerEl.dispatchEvent(evt);
                }
        };
    }

    eventTrap.addEventListener('click', handler, true);

    for (const iframeElem of fullscreenFrames) {
        let iframeHtml = iframeElem.contentWindow.document.documentElement;
        iframeHtml.addEventListener('click', (e) => {
            if (e.target !== iframeHtml && (! e.target.classList.contains('deadzone'))) {
                // if target element: is not document.html tag and not deadzone css class
                // means user clicked on something worthwhile (likely with a lower click event handler)
                e.moonspeakEventState = STATE_HANDLED;
                eventTrap.classList.remove('active');
                iframeElem.classList.add('active');
            } else if (iframeElem.classList.contains('active')) {
                // user clicked on non-active element, so current iframe should stop being active
                iframeElem.classList.remove('active');
                eventTrap.classList.add('active');
                let evt = new MouseEvent('click', e);
                eventTrap.dispatchEvent(evt);
            }
        }, true);
    };
}

async function initHud() {
    let fullscreenFrames = await loadHudFeatures();

    // background element is first child of container (to put it in the bottom of hierarchy)
    // but background element needs to be the LAST to check when assigning event handlers
    // so reverse list of iframes, to place background last
    fullscreenFrames.reverse();

    setupHandlers(fullscreenFrames);
}

