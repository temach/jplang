let isPinchZoom = false;
let halfPinchZoom = false;

function pointerdown_handler(ev) {
    if (halfPinchZoom) {
        // if the other finger is on graph
        isPinchZoom = true;
        ev.preventDefault();
        let message = {
            type: "touchstart",
            touchEvent: {
                identifier: ev.pointerId,
                clientX: ev.clientX,
                clientY: ev.clientY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.width,
                radiusY: ev.height,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    }
}

function touchend_handler(tev) {
  for (var i = 0; i < tev.changedTouches.length; i++) {
    var ev = tev.changedTouches[i];
    if (isPinchZoom) {
        tev.preventDefault();
        let message = {
            type: "touchend",
            touchEvent: {
                identifier: ev.identifier,
                clientX: ev.clientX,
                clientY: ev.clientY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.radiusX,
                radiusY: ev.radiusY,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    }
  }
  if (isPinchZoom && tev.touches.length == 0) {
      // not done with pinch zoom until reach zero touches,
      // because must preventDefault for both touchends
      isPinchZoom = false;
  }
}

function touchmove_handler(tev) {
  for (var i = 0; i < tev.changedTouches.length; i++) {
    var ev = tev.changedTouches[i];
    if (isPinchZoom) {
        tev.preventDefault();
        let message = {
            type: "touchmove",
            touchEvent: {
                identifier: ev.identifier,
                clientX: ev.clientX,
                clientY: ev.clientY,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.radiusX,
                radiusY: ev.radiusY,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    }
  }
}

function touchstart_handler(tev) {
  for (var i = 0; i < tev.changedTouches.length; i++) {
    var ev = tev.changedTouches[i];

    if (tev.touches.length == 2) {
        // first case: both fingers in iframe, handle by streaming events to parent iframe
        // if both fingers are on this iframe
        // add_event(ev);
        isPinchZoom = true;
        tev.preventDefault();
        for (let j = 0; j < tev.touches.length; j++) {
            // send both current touches as events to parent
            let curEv = tev.touches[j];
            let message = {
                type: "touchstart",
                touchEvent: {
                    identifier: curEv.identifier,
                    clientX: curEv.clientX,
                    clientY: curEv.clientY,
                    pageX: curEv.pageX,
                    pageY: curEv.pageY,
                    radiusX: curEv.radiusX,
                    radiusY: curEv.radiusY,
                    screenX: curEv.screenX,
                    screenY: curEv.screenY,
                },
            };
            window.top.postMessage(message, '*');
        }
    } else {
        // last case: one finger in iframe, unknown in parent
        // just leave this case broken, as its only 1 out of 4
        console.log("first finger touchstart inside the iframe");
    }
  }
}

function init() {
    // Install event handlers for the pointer target
    var el=document.getElementById("mainbody");
    el.addEventListener('touchstart', touchstart_handler, {passive: false, capture: true} );
    el.addEventListener('touchmove', touchmove_handler, {passive: false, capture: true} );
    el.addEventListener('touchend', touchend_handler, {passive: false, capture: true} );
    // el.addEventListener('pointerdown', pointerdown_handler, {passive: false, capture: true} );

    window.addEventListener('message', event => {
        const data = event.data;

        if (data.type === 'halfPinchZoom') {
            halfPinchZoom = data.value;
        };
    });
}
