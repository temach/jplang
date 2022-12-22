// Log events flag
var logEvents = false;

// Global vars to cache event state
var evCache = new Array();
var prevDiff = -1;

// Logging/debugging functions
function enableLog(ev) {
    logEvents = logEvents ? false : true;
}

function log(prefix, ev) {
    if (!logEvents) return;
    var o = document.getElementsByTagName('output')[0];
    var s = prefix + ": pointerID = " + ev.pointerId +
        " ; pointerType = " + ev.pointerType +
        " ; isPrimary = " + ev.isPrimary;
    o.innerHTML += s + " <br>";
}

function clearLog(event) {
    var o = document.getElementsByTagName('output')[0];
    o.innerHTML = "";
}

function pointerdown_handler(ev) {
    // The pointerdown event signals the start of a touch interaction.
    // This event is cached to support 2-finger gestures
    evCache.push(ev);
    log("pointerDown", ev);
}

function pointermove_handler(ev) {
    // This function implements a 2-pointer horizontal pinch/zoom gesture. 
    //
    // If the distance between the two pointers has increased (zoom in), 
    // the taget element's background is changed to "pink" and if the 
    // distance is decreasing (zoom out), the color is changed to "lightblue".
    //
    // This function sets the target element's border to "dashed" to visually
    // indicate the pointer's target received a move event.
    // log("pointerMove", ev);
    console.log('pointerMove');
    ev.target.style.border = "dashed";

    var el = document.getElementById("target");

    // Find this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
        if (ev.pointerId == evCache[i].pointerId) {
            evCache[i] = ev;
            break;
        }
    }

    // If two pointers are down, check for pinch gestures
    if (evCache.length == 2) {
        // Calculate the distance between the two pointers
        var curDiff = Math.sqrt(Math.pow(evCache[1].clientX - evCache[0].clientX, 2) + Math.pow(evCache[1].clientY - evCache[0].clientY, 2));

        if (prevDiff > 0) {
            if (curDiff > prevDiff) {
                // The distance between the two pointers has increased
                log("Pinch moving OUT -> Zoom in", ev);
                el.style.background = "pink";
            }
            if (curDiff < prevDiff) {
                // The distance between the two pointers has decreased
                log("Pinch moving IN -> Zoom out",ev);
                el.style.background =  "lightblue";
            }
        }

        // Cache the distance for the next move event
        prevDiff = curDiff;
    }
}

function pointerup_handler(ev) {
    log(ev.type, ev);
    // Remove this pointer from the cache and reset the target's
    // background and border
    remove_event(ev);

    var el = document.getElementById("target");
    el.style.background = "white";

    ev.target.style.border = "1px solid black";

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 2) prevDiff = -1;
}

function remove_event(ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == ev.pointerId) {
            evCache.splice(i, 1);
            break;
        }
    }
}

function touchstart_handler(ev) {
    if (ev.touches.length == 1) {
        // first finger goes down outside the iframe, then disable iframe
        let fr = document.getElementById('secondframe');
        let message = {
            type: 'halfPinchZoom',
            value: true,
        };
        fr.contentWindow.postMessage(message, "*");
    } else if (ev.touches.length == 2) {
        // if full zoom is here, then turn off halfPinchZoom
        let fr = document.getElementById('secondframe');
        let message = {
            type: 'halfPinchZoom',
            value: false,
        };
        fr.contentWindow.postMessage(message, "*");
    }
}

function touchend_handler(ev) {
    if (ev.touches.length == 0) {
        // no fingers left, then enable iframe
        let fr = document.getElementById('secondframe');
        let message = {
            type: 'halfPinchZoom',
            value: false,
        };
        fr.contentWindow.postMessage(message, "*");
    }
}

// First, we'll define a function that will be called when a touch event is detected
function dispatchTouchEvent(event, type) {
  let fr = document.getElementById('secondframe');

  // Then, we'll create a new pointer event using the data from the touch event
  const pointerEvent = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
    pageX: event.pageX,
    pageY: event.pageY,
    pointerId: event.identifier,
    pointerType: 'touch',
    width: event.radiusX * 2,
    height: event.radiusY * 2
  });

  // Finally, we'll dispatch the pointer event on the target element
  fr.dispatchEvent(pointerEvent);
}

function init() {
    // Install event handlers for the pointer target
    var el=document.getElementById("target");
    el.addEventListener('pointerdown', pointerdown_handler);
    el.addEventListener('pointermove', pointermove_handler);

    // Use same handler for pointer{up,cancel,out,leave} events since
    // the semantics for these events - in this app - are the same.
    el.addEventListener('pointerup', pointerup_handler);
    el.addEventListener('pointercancel', pointerup_handler);
    el.addEventListener('pointerout', pointerup_handler);
    el.addEventListener('pointerleave', pointerup_handler);

    el.addEventListener('touchstart', touchstart_handler, {passive: false});
    el.addEventListener('touchend', touchend_handler);

    // fr.addEventListener('touchstart', event => {
    //     if (event.touches.length === 2) {
    //         console.log('Two fingers detected on touchscreen, disabling iframe');
    //         let fr = document.getElementById('secondframe');
    //         fr.style.pointerEvents = 'none';
    //         event.preventDefault();
    //     }
    // }, {
    //     passive: false,
    //     capture: true
    // });

    window.addEventListener('message', event => {
        const data = event.data;

        if (data.type == 'touchstart') {
            dispatchTouchEvent(data.touchEvent, 'pointerdown');
        } else if (data.type == 'touchmove') {
            dispatchTouchEvent(data.touchEvent, 'pointermove');
        } else if (data.type == 'touchend') {
            dispatchTouchEvent(data.touchEvent, 'pointerup');
        };

    });
}
