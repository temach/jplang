let primaryPointerDown = null;
let streamPinchZoomEvents = false;
let streamedIds = new Set();

//==================================================================
let moonspeakPorts = [];

function moonspeakLog(msg, obj) {
    console.log(location + " " + document.title + " " + msg);
    if (obj) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/Console/log#logging_objects
        console.log(JSON.parse(JSON.stringify(obj)));
    }
}

function moonspeakMessageHandler(event, userHandler) {
    if (event.data.type === 'pleaseStreamEvents') {
        streamPinchZoomEvents = event.data.value;
        return;
    };

    moonspeakLog("received:", event.data);
    userHandler(event);
}

function moonspeakBootstrapMasterPort(event, userHandler) {
    function isMoonspeakDevMode() {
        // to debug via usb tethering on android
        // set permanent computer address, and add it to the list below 
        // then loading it from the phone you wont have to run the router component
        return ['moonspeak.localhost', 'localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);
    }

    if (event.origin !== location.origin && !isMoonspeakDevMode()) {
        // accept only messages from same origin, but ignore this rule for dev mode
        return;
    }

    moonspeakLog("receiving once:", event.data);

    if ("info" in event.data && event.data["info"].includes("port")) {
        const masterport = event.ports[0];
        masterport.onmessage = (event) => moonspeakMessageHandler(event, userHandler);
        moonspeakPorts.push(masterport);
        return;
    }

    moonspeakLog("Can not understand message info, handling anyway.");
    userHandler(event);
}

// use this function to subscribe to messages
function moonspeakInstallOnMessageHandler(userHandler) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // this listener is called ONCE to transfer the message channel for further communication
    window.addEventListener("message", (event) => moonspeakBootstrapMasterPort(event, userHandler));
}

// use this function to post messages
function moonspeakPostMessage(message, isSecondTime=false) {
    if (moonspeakPorts.length === 0) {
        if (isSecondTime === false) {
            // if sending this message first time, try repeating it after few milli-seconds
            // if it fails a second time, then ignore
            window.setTimeout(() => moonspeakPostMessage(message, true), 500);
        }

        if (isSecondTime === true) {
            moonspeakLog("no ports connected, will abandon sending message:", message);
        }

        // if no ports listening, nothing to do
        return;
    }
    moonspeakLog("posted:", message);
    for (const port of moonspeakPorts) {
        port.postMessage(message);
    }
}

//===========================================================================================
function pointerdown_handler(ev) {
    if (ev.pointerType != 'touch') {
        return;
    }

    if (ev.isPrimary == false) {
        // this is the second pointer event on this document, so its pinch zoom
        streamPinchZoomEvents = true;
        streamEvent(ev);
    } else {
        primaryPointerDown = ev;
    }
}

function pointerup_handler(ev) {
    if (ev.pointerType != 'touch') {
        return;
    }

    if (primaryPointerDown && (ev.pointerId == primaryPointerDown.pointerId)) {
        // got here in case of a boring primary pointer click, so just forget it
        primaryPointerDown = null;
    }

    if (streamedIds.has(ev.pointerId)) {
        streamPinchZoomEvents = false;
        streamEvent(ev);
        streamedIds.delete(ev.pointerId);
    }
}

function pointermove_handler(ev) {
    if (ev.pointerType != 'touch') {
        return;
    }

    if (streamPinchZoomEvents) {
        if (primaryPointerDown != null) {
            // after pinch zoom activation and before the first pointermove
            // we must send pointerdown
            streamEvent(primaryPointerDown);
            primaryPointerDown = null;
        }
        // stream pointermove event to parent
        streamEvent(ev);
    }
}

function streamEvent(event) {
    // when event is streamed the end event must also be streamed (e.g. pointerup), so track the ids
    streamedIds.add(event.pointerId);
    console.log("workelements: " + event.type)

    let message = {
        iframename: window.name,
        info: event.type,
        pointerEvent: {
            isPrimary: event.isPrimary,
            pointerId: event.pointerId,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            bubbles: event.bubbles,
            cancelable: event.cancelable,
            pointerType: event.pointerType,
            button: event.button,
            buttons: event.buttons,
            x: event.x,
            y: event.y,
            width: event.width,
            height: event.height,
            pageX: event.pageX,
            pageY: event.pageY,
            layerX: event.layerX,
            layerY: event.layerY,
            offsetX: event.offsetX,
            offsetY: event.offsetY,
            movementX: event.movementX,
            movementY: event.movementY,
            screenX: event.screenX,
            screenY: event.screenY,

            // clientX and clientY are used by mxClient.js for zooming, unfortunately they are relative to DOM (hence wrong when in iframe)
            // we fake them here and feed the screenX and screenY coords.
            // the alternative is to fix mxClient.js addMouseWheelListener function to use screenX/Y instead of clientX/Y.
            clientX: event.screenX,
            clientY: event.screenY,
        },
    };
    window.top.postMessage(message, "*");
}

function initPitchZoom() {
    // Install event handlers for the pointer target
    document.addEventListener('pointerdown', pointerdown_handler);
    document.addEventListener('pointermove', pointermove_handler);

    // the finish event handler is the same in all cases
    document.addEventListener('pointerup', pointerup_handler);
    document.addEventListener('pointercancel', pointerup_handler);
    document.addEventListener('pointerout', pointerup_handler);
    document.addEventListener('pointerleave', pointerup_handler);
}

export { initPitchZoom, moonspeakInstallOnMessageHandler, moonspeakPostMessage };
