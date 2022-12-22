let isPinchZoom = false;
let cache = new Array();

function insert_event(ev) {
    // Find this event in the cache and update its record with this event
    for (var i = 0; i < cache.length; i++) {
        if (ev.identifier == cache[i].identifier) {
            cache[i] = ev;
            return;
        }
    }
    cache.push(ev);
}

function remove_event(ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < cache.length; i++) {
        if (cache[i].identifier == ev.identifier) {
            cache.splice(i, 1);
            return;
        }
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
                clientX: ev.clientX,
                clientY: ev.clientY,
                force: ev.force,
                identifier: ev.identifier,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.radiusX,
                radiusY: ev.radiusY,
                rotationAngle: ev.rotationAngle,
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
                clientX: ev.clientX,
                clientY: ev.clientY,
                force: ev.force,
                identifier: ev.identifier,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.radiusX,
                radiusY: ev.radiusY,
                rotationAngle: ev.rotationAngle,
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

    if (window.top.halfPinchZoom) {
        // if the other finger is on graph
        // add_event(ev);
        isPinchZoom = true;
        tev.preventDefault();
        let message = {
            type: "touchstart",
            touchEvent: {
                clientX: ev.clientX,
                clientY: ev.clientY,
                force: ev.force,
                identifier: ev.identifier,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.radiusX,
                radiusY: ev.radiusY,
                rotationAngle: ev.rotationAngle,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    } else if (tev.touches.length >= 2) {
        // if both fingers are on this iframe
        // add_event(ev);
        isPinchZoom = true;
        tev.preventDefault();
        let message = {
            type: "touchstart",
            touchEvent: {
                clientX: ev.clientX,
                clientY: ev.clientY,
                force: ev.force,
                identifier: ev.identifier,
                pageX: ev.pageX,
                pageY: ev.pageY,
                radiusX: ev.radiusX,
                radiusY: ev.radiusY,
                rotationAngle: ev.rotationAngle,
                screenX: ev.screenX,
                screenY: ev.screenY,
            },
        };
        window.top.postMessage(message, '*');
    } else {
        // only one finger is on the screen
        // must inform the parent frame of all movement,
        // because it might be start of zoom
        // actually will just ignore this case for now, its only 1 out of 4
        console.log("first finger touchstart inside the iframe");
    }
  }

  // The touch start event signals the start of a touch interaction.
  // if (ev.isPrimary === false) {
  //     console.log('detected pinch zoom in iframe, cancelling and telling the parent window');
  //     // this is the second touch finger, must quit the zoom and send message to top
  //     let message = {
  //       type: 'pinchZoomStartedInsideIframe',
  //       // might be useful for setPointerCapture
  //       // pointerId: ev.pointerId,
  //     };
  //     ev.preventDefault();
  //     window.top.postMessage(message, '*');
  // }
}

function init() {
    // Install event handlers for the pointer target
    var el=document.getElementById("mainbody");
    el.addEventListener('touchstart', touchstart_handler, {passive: false, capture: true} );
    el.addEventListener('touchmove', touchmove_handler, {passive: false, capture: true} );
    el.addEventListener('touchend', touchend_handler, {passive: false, capture: true} );
    // el.addEventListener('pointerdown', pointerdown_handler, {passive: false, capture: true} );

    // window.addEventListener('message', event => {
    //     // The event object contains the data that was sent via postMessage
    //     const data = event.data;
    //     // You can check the origin of the message if necessary
    //     const origin = event.origin;
    //     if (data.type === 'possiblePinchZoomStart') {
    //         console.log('message of pich zoom received, disabling iframe');
    //         let fr = document.getElementById('secondframe');
    //         fr.style.pointerEvents = 'none';
    //     }
    // });
}
