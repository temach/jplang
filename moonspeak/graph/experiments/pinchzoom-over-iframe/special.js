let primaryPointerDown = null;
let streamPinchZoomEvents = false;
let streamedIds = new Set();

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

    let message = {
        type: event.type,
        pointerEvent: {
            isPrimary: event.isPrimary,
            pointerId: event.pointerId,
            width: event.width,
            height: event.height,
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            screenX: event.screenX,
            screenY: event.screenY,
        },
    };
    window.top.postMessage(message, '*');
}

function init() {
    // Install event handlers for the pointer target
    var body = document.body;
    body.addEventListener('pointerdown', pointerdown_handler);
    body.addEventListener('pointermove', pointermove_handler);

    // the finish event handler is the same in all cases
    body.addEventListener('pointerup', pointerup_handler);
    body.addEventListener('pointercancel', pointerup_handler);
    body.addEventListener('pointerout', pointerup_handler);
    body.addEventListener('pointerleave', pointerup_handler);

    window.addEventListener('message', event => {
        const data = event.data;
        if (data.type === 'pleaseStreamEvents') {
            streamPinchZoomEvents = data.value;
        };
    });
}
