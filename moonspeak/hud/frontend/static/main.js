
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
    let response = await fetch("config/hud.json");

    if (! response.ok) {
        console.log("HTTP-Error: " + response.status);
        return;
    }

    let json = await response.json();

    // order affects event check, element 0 is checked first
    // background should be the last element
    const URLS = json["urls"];

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
            // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
            let iframe = document.createElement("iframe");
            iframe.classList.add("fullscreen");
            iframe.src = url;
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

function isMoonspeakDevMode(hostname = location.hostname) {
    // checking .endsWith() is ok, but .startsWith() is not ok
    return (
        ['localhost', '127.0.0.1', '', '0.0.0.0', '::1'].includes(hostname)
        || hostname.endsWith('.local')
        || hostname.endsWith('.test')
    )
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
        // if host on dev origin, soften developer pain by relaxing security, else be strict
        let targetOrigin = isMoonspeakDevMode() ? "*" : location.origin;
        iframeWindow.postMessage(eventData, targetOrigin);
    });
}

function onMessage(event) {
    if (event.origin !== location.origin && !isMoonspeakDevMode()) {
        // accept only messages from same origin, but ignore this rule for dev mode
        return;
    }

    console.log(location + " received:");
    console.log(event.data);

    if (! ("info" in event.data)) {
        console.log("No 'info' field in message, skipping");
        return;
    }

    if (event.data["info"].includes("please feature")) {
        arrayBroadcast(event.source, event.data, fullscreenFrames);
    } else {
        console.log("Can not understand message info:" + event.data["info"]);
        return;
    }
}


// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", onMessage);
