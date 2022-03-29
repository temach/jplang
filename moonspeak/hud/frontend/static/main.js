const fullscreenFrames = new Array();

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

function addInnerHtmlEventListener(frame, trap, state_handled) {
    let iframeHtml = frame.contentWindow.document.documentElement;
    let adjustFocus = (e) => {
        if (e.target !== iframeHtml && (! e.target.classList.contains('deadzone'))) {
            // if target element: is not document.html tag and not deadzone css class
            // means user clicked on something worthwhile (likely with a lower click event handler)
            e.moonspeakEventState = state_handled;
            trap.classList.remove('active');
            frame.classList.add('active');
        } else if (frame.classList.contains('active')) {
            // user clicked on non-active element, so current frame should stop being active
            frame.classList.remove('active');
            trap.classList.add('active');
            let evt = new MouseEvent('click', e);
            trap.dispatchEvent(evt);
        }
    };
    iframeHtml.addEventListener('click', adjustFocus, true);
}

async function initHud() {
    const STATE_PROPOGATING = "propogating";
    const STATE_HANDLED = "handled";

    // order affects event check, element 0 is checked first
    const URLS = [
        "http://0.0.0.0:9012",
        "http://0.0.0.0:9011",
        "http://0.0.0.0:9010",
    ];


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

    for (const url of URLS) {
        try {
            let feature_json = await get_feature(url);
            // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
            let iframe = document.createElement("iframe");
            iframe.classList.add("fullscreen");
            iframe.srcdoc = feature_json["text"];
            iframe.onload = () => {
                addInnerHtmlEventListener(iframe, eventTrap, STATE_HANDLED);
            };
            fullscreenFrames.push(iframe);
        } catch (error) {
            console.log("HTTP error:" + error.message);
        };
    }

    // background element must be the last to check when assigning event handlers
    // background element must also be the first child of container (to put it in the bottom of hierarchy)
    // so iterate in reverse
    let container = document.getElementById("featuresContainer");
    for (let i = fullscreenFrames.length - 1; i >= 0; i--) {
        container.appendChild(fullscreenFrames[i]);
    }
}

// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", (event) => {
    if (event.origin !== window.parent.location.origin) {
        // we only accept messages from the IFrames (must be on the same domain)
        return;
    }

    console.log("hud received: ");
    console.log(event.data);

    // broadcast message to other fullscreen iframes
    fullscreenFrames.forEach(function(currentFrame, index, array) {
        let iframeWindow = (currentFrame.contentWindow || currentFrame.contentDocument);
        if (iframeWindow !== event.source) {
            iframeWindow.postMessage(event.data, window.parent.location.origin);
        };
    });

});
