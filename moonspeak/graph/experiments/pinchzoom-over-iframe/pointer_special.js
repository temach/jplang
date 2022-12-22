let primaryPointerDownPosted = false;
let primaryPointerDown = null;
let secondaryPointerDown = null;
let isPinchZoom = false;

function pointerdown_handler(ev) {
    if (ev.isPrimary == false) {
        // this is the second pointer event on this document, so
        // both fingers are in iframe, handle by streaming events to parent iframe
        isPinchZoom = true;
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
        primaryPointerDownPosted = false;
    }
}

function pointermove_handler(ev) {
    if (isPinchZoom) {
        if (primaryPointerDownPosted == false) {
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
            primaryPointerDownPosted = true;
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
        primaryPointerDown = null;
    }
    if (secondaryPointerDown && (ev.pointerId == secondaryPointerDown.pointerId)) {
        secondaryPointerDown = null;
    }

    if (isPinchZoom) {
        isPinchZoom = primaryPointerDown != null || secondaryPointerDown != null;
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
    }
}

function init() {
    // Install event handlers for the pointer target
    var el=document.getElementById("mainbody");

    el.addEventListener('pointerdown', pointerdown_handler);
    el.addEventListener('pointermove', pointermove_handler);
    el.addEventListener('pointerup', pointerup_handler);

    window.addEventListener('message', event => {
        const data = event.data;

        if (data.type === 'isPinchZoom') {
            isPinchZoom = data.value;
        };
    });
}
