let zeroTouches = true;
let primaryPointerDown = null;
let streamPinchZoomEvents = false;

function pointerdown_handler(ev) {
    if (ev.isPrimary == false) {
        // this is the second pointer event on this document, so
        // both fingers are in iframe, handle by streaming events to parent iframe
        streamPinchZoomEvents = true;
        let message = {
            type: "pointerdown",
            touchEvent: {
                isPrimary: ev.isPrimary,
                pointerId: ev.pointerId,
                width: ev.width,
                height: ev.height,
                clientX: ev.clientX,
                clientY: ev.clientY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    } else {
        primaryPointerDown = ev;
    }
    zeroTouches = false;
}

function pointermove_handler(ev) {
    if (streamPinchZoomEvents) {
        if (primaryPointerDown != null) {
            // after pinch zoom activation and before the first pointermove
            // we must send pointerdown
            let ev = primaryPointerDown;
            let message = {
                type: "pointerdown",
                touchEvent: {
                    isPrimary: ev.isPrimary,
                    pointerId: ev.pointerId,
                    width: ev.width,
                    height: ev.height,
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    pageX: ev.pageX,
                    pageY: ev.pageY,
                    screenX: ev.screenX,
                    screenY: ev.screenY,
                },
            };
            primaryPointerDown = null;
            window.top.postMessage(message, '*');
        }
        // stream pointermove event to parent and ignore it here
        let message = {
            type: "pointermove",
            touchEvent: {
                isPrimary: ev.isPrimary,
                pointerId: ev.pointerId,
                width: ev.width,
                height: ev.height,
                clientX: ev.clientX,
                clientY: ev.clientY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    }
}

function pointerup_handler(ev) {
    if (primaryPointerDown && (ev.pointerId == primaryPointerDown.pointerId)) {
        // if we are here, means we have not streamed the primary pointerdown data yet
        primaryPointerDown = null;
    } // so we just shut about it ever being down even if asked to stream, hence "else if"
    else if (streamPinchZoomEvents) {
        let message = {
            type: "pointerup",
            touchEvent: {
                isPrimary: ev.isPrimary,
                pointerId: ev.pointerId,
                width: ev.width,
                height: ev.height,
                clientX: ev.clientX,
                clientY: ev.clientY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');

        // for case when both fingers were inside iframe,
        // after streaming yet another pointerup check if it was the last one
        if (zeroTouches) {
            streamPinchZoomEvents = false;
        }
    }
}

function touchend(tev) {
    if (tev.touches.length == 0) {
        zeroTouches = true;
    }

}

function init() {
    // Install event handlers for the pointer target
    var el=document.getElementById("mainbody");

    el.addEventListener('pointerdown', pointerdown_handler);
    el.addEventListener('pointermove', pointermove_handler);
    el.addEventListener('pointerup', pointerup_handler);
    el.addEventListener('touchend', touchend);

    window.addEventListener('message', event => {
        const data = event.data;

        if (data.type === 'isPinchZoom') {
            streamPinchZoomEvents = data.value;
        };
    });
}
