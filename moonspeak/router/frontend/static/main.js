
//=========================================================
// Code related to fullscreen features that are loaded once at the start of app
//
const fullscreenFrames = new Array();

function addInnerHtmlEventListener(frame, yieldFunc) {
    let iframeHtml = frame.contentWindow.document.documentElement;
    let checkYield = (e) => {
        if (e.target === iframeHtml || e.target.classList.contains('deadzone')) {
            frame.classList.remove('acceptevents');
            yieldFunc(e);
        };
    };

    // capture the down event in bubbling phase
    iframeHtml.addEventListener('pointerdown', checkYield, true);
    iframeHtml.addEventListener('pointerup', checkYield, true);
    iframeHtml.addEventListener('click', checkYield, true);
}

async function initHud() {
    // order affects event check, element 0 is checked first
    // background should be the last element
    const URLS = [
        // "http://f-help.test",
        "http://f-plus.test",
        "http://manager-grid2.test",
    ];

    let eventTrap = document.getElementById("eventTrap");

    let yieldFunc = (e) => {
        // events get here after some frame has yielded (as a result of yielding)
        // or its the very-very first event ever
        let frame = false;

        for (const child of fullscreenFrames) {
            let innerEl = child.contentWindow.document.elementFromPoint(e.clientX, e.clientY);
            let iframeHtml = child.contentWindow.document.documentElement;
            if (! innerEl 
                || innerEl === iframeHtml 
                || innerEl.classList.contains('deadzone')
            ) {
                // this child does not have elem to activate
                continue;
            }

            let repeat = new PointerEvent(e.type, e);
            innerEl.dispatchEvent(repeat);

            frame = child;
            break;
        }

        if (frame) {
            eventTrap.classList.remove('acceptevents');
            frame.classList.add('acceptevents');
        } else {
            // no frame was activated so activate the eventTrap
            eventTrap.classList.add('acceptevents');
        }
    };

    eventTrap.addEventListener('pointerdown', yieldFunc, true);
    eventTrap.addEventListener('pointerup', yieldFunc, true);
    eventTrap.addEventListener('click', yieldFunc, true);

    for (const url of URLS) {
        try {
            let feature_json = await getFeatureSrc(url);
            // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
            let iframe = document.createElement("iframe");
            iframe.classList.add("fullscreen");
            iframe.src = feature_json["src"];
            iframe.onload = () => {
                addInnerHtmlEventListener(iframe, yieldFunc);
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

function arrayBroadcast(eventSource, eventData, array) {
    array.forEach((featureIFrameElem, index, arr) => {
        let iframeWindow = (featureIFrameElem.contentWindow || featureIFrameElem.contentDocument);
        if (! iframeWindow) {
            return;
        }
        if (eventSource && iframeWindow === eventSource) {
            return;
        };
        iframeWindow.postMessage(eventData, window.location.origin);
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
            let msg = {
                "info": "created feature",
                "srcdoc": featureJson["text"],
                "src": featureJson["src"],
            };
            // make sure every fullscreen feature knows that a new on-demand feature was added
            arrayBroadcast(null, msg, fullscreenFrames);
        } catch (error) {
            console.log("getting new feature failed with error:" + error.message);
        };

    } else if (event.data["info"].includes("broadcast")) {
        arrayBroadcast(event.source, event.data, fullscreenFrames);

    } else {
        console.log("Can not understand message info:" + event.data["info"]);
        return;
    }
}


// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", onMessage);



