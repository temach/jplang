// Log events flag
let mustStartPinchZoom = false;

// Global vars to cache event state
var evCache = new Array();
var prevDiff = -1;

function pointerdown_handler(ev) {
    evCache.push(ev);

    let m = "tracking new pointer: " + ev.pointerId + "  total: " + evCache.length;
    console.log(m);

    if (ev.isPrimary == false) {
        isPinchZoom = true;

        let fr = document.getElementById('secondframe');
        let message = {
            type: 'isPinchZoom',
            value: isPinchZoom,
        };
        fr.contentWindow.postMessage(message, "*");
    }
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
    ev.target.style.border = "dashed";

    // Find this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
        if (ev.pointerId == evCache[i].pointerId) {
            evCache[i] = ev;
            break;
        }
    }

    var el = document.getElementById("target");

    // If two pointers are down, check for pinch gestures
    if (evCache.length == 2) {
        // Calculate the distance between the two pointers
        var curDiff = Math.sqrt(Math.pow(evCache[1].clientX - evCache[0].clientX, 2) + Math.pow(evCache[1].clientY - evCache[0].clientY, 2));

        if (prevDiff > 0) {
            if (curDiff > prevDiff) {
                // The distance between the two pointers has increased
                // console.log("Pinch moving OUT -> Zoom in");
                el.style.background = "pink";
            }
            if (curDiff < prevDiff) {
                // The distance between the two pointers has decreased
                // console.log("Pinch moving IN -> Zoom out");
                el.style.background =  "lightblue";
            }
        }

        // Cache the distance for the next move event
        prevDiff = curDiff;
    }
}

function pointerup_handler(ev) {
    // Remove this pointer from the cache and reset the target's
    // background and border
    remove_event(ev);

    let m = "removing event: " + ev.pointerId + "  total: " + evCache.length;
    console.log(m);

    var el = document.getElementById("target");
    el.style.background = "white";

    ev.target.style.border = "1px solid black";

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 2) prevDiff = -1;

    if (isPinchZoom) {
        isPinchZoom = false;

        let fr = document.getElementById('secondframe');
        let message = {
            type: 'isPinchZoom',
            value: isPinchZoom,
        };
        fr.contentWindow.postMessage(message, "*");
    }
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

// First, we'll define a function that will be called when a touch event is detected
function dispatchTouchEvent(event, type) {
  let fr = document.getElementById('secondframe');

  // Then, we'll create a new pointer event using the data from the touch event
  const pointerEvent = new PointerEvent(type, {
    isPrimary: event.isPrimary,
    bubbles: true,
    cancelable: true,
    pointerType: 'touch',
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
    pageX: event.pageX,
    pageY: event.pageY,
    width: event.width,
    height: event.height,
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

    window.addEventListener('message', event => {
        const data = event.data;
        dispatchTouchEvent(data.touchEvent, data.type);
    });
}
