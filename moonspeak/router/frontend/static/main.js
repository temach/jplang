
//=========================================================
// Code related to fullscreen features that are loaded once at the start of app
//
const fullscreenFrames = new Array();

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
        // "http://0.0.0.0:9012",
        // "http://0.0.0.0:9011",
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
            let feature_json = await getFeatureSrc(url);
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


//=============================================================
// Code related to small features that are loaded on user request
//
// const FEATURES = new Map();


async function getFeatureSrc(feature_url) {
    let backend = new URL("/api/getfeature", window.location);
    backend.searchParams.set('feature_url', new URL(feature_url));

    let response = await fetch(backend);
    if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
    }
    let feature_json = await response.json();
    return feature_json;
}

// function mapBroadcast(event, map) {
//     map.forEach((featureExtraInfo, featureIFrameElem, m) => {
//         let iframeWindow = (featureIFrameElem.contentWindow || featureIFrameElem.contentDocument);
//         if (iframeWindow !== event.source) {
//             iframeWindow.postMessage(event.data, window.location.origin);
//         };
//     });
// }

function arrayBroadcast(event, array) {
    array.forEach((featureIFrameElem, index, arr) => {
        let iframeWindow = (featureIFrameElem.contentWindow || featureIFrameElem.contentDocument);
        if (iframeWindow !== event.source) {
            iframeWindow.postMessage(event.data, window.location.origin);
        };
    });
}

async function onMessage(event) {
    if (event.origin !== window.top.location.origin) {
        // accept only messages for your domain
        return;
    }

    console.log("hud received: ");
    console.log(event.data);

    if (! ("info" in event.data)) {
        console.log("No 'info' field in message, skipping");
        return;
    }

    if (event.data["info"].includes("new feature")) {
        try {
            let featureJson = await getFeatureSrc(event.data["url"]);
            // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
            // let iframe = document.createElement("iframe");
            // iframe.srcdoc = featureJson["text"];
            // let featureExtraInfo = {};
            // FEATURES.set(iframe, featureExtraInfo);

            // let msg = {
            //     "info": "created feature",
            //     "feature": iframe.outerHTML,
            // };
            // let fakeEvent = {
            //     "source": "*",
            //     "data": msg,
            // }
            // // make sure every fullscreen feature knows that a new on-demand feature was added
            // arrayBroadcast(fakeEvent, fullscreenFrames);
            let msg = {
                "info": "created feature",
                "srcdoc": featureJson["text"],
            };
            let fakeEvent = {
                "source": "xxx",
                "data": msg,
            }
            // make sure every fullscreen feature knows that a new on-demand feature was added
            arrayBroadcast(fakeEvent, fullscreenFrames);
        } catch (error) {
            console.log("HTTP error:" + error.message);
        };

//     } else if (event.data["info"].includes("small broadcast")) {
//         mapBroadcast(event, FEATURES);
// 
    } else if (event.data["info"].includes("broadcast")) {
        arrayBroadcast(event, fullscreenFrames);

    } else {
        console.log("Can not understand message info:" + event.data["info"]);
        return;
    }
}


// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", onMessage);



