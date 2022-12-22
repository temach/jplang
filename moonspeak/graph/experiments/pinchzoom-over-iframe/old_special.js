// Log events flag
var logEvents = false;
// Logging/debugging functions
function enableLog(ev) {
    logEvents = logEvents ? false : true;
}
function log(prefix, ev) {
    if (!logEvents) return;
    var s = prefix + ": pointerID = " + ev.pointerId + " ; pointerType = " + ev.pointerType + " ; isPrimary = " + ev.isPrimary; console.log(s);
}
function clearLog(event) {
    return;
}

// Global vars to cache event state
var evCache = new Array();
var prevDiff = -1;
let isPinchZoom = false;

function cache_event(ev) {
    evCache.push(ev);

    // Try to this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
        if (ev.pointerId == evCache[i].pointerId) {
            evCache[i] = ev;
            break;
        }
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

function touchstart_handler(ev) {
  // The touch start event signals the start of a touch interaction.
  if (ev.touches.length == 2) {
      console.log('detected pinch zoom in iframe, cancelling and telling the parent window');
      // this is the second touch finger, must quit the zoom and send message to top
      let message = {
        type: 'pinchZoomStartedInsideIframe',
        // might be useful for setPointerCapture
        pointerId: ev.pointerId,
      };
      ev.preventDefault();
      window.top.postMessage(message, '*');
  }
}


function pointerdown_handler(ev) {
  // The pointerdown event signals the start of a touch interaction.
  // This event is cached to support 2-finger gestures
  // cache_event(ev);
  // log("pointerDown", ev);
  if (ev.isPrimary == false) {
      // this is the second touch finger, must quit the zoom and send message to top
      let message = {
        type: 'pinchZoomStartedInsideIframe',
        // might be useful for setPointerCapture
        pointerId: ev.pointerId,
      };
      // cancel the event:
      window.top.postMessage(message, '*');
  }

  // in few milliseconds check if a second pointerId appeared or not.
  // if it has appeared then its a zoom gesture and we must end it and notify master iframe to set set pointer-events:none for us
  // when the gesture ends the master will reset our pointer-events to appropriate state
  // otherwise its our gesture to handle as usual
  // if (evCache.length == 2) {
  //     let message = {
  //       type: 'pinchZoomStartedInsideIframe',
  //       pointerId: ev.pointerId, //might be useful for setPointerCapture
  //     };
  //     // cancel the event:
  //     window.top.postMessage(message, '*');
  // }
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
    ev.target.style.border = "dashed";

    // Find this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
        if (ev.pointerId == evCache[i].pointerId) {
            evCache[i] = ev;
            break;
        }
    }
}

function pointerup_handler(ev) {
    // Remove this pointer from the cache and reset the target's
    // background and border
    remove_event(ev);
    ev.target.style.background = "white";
    ev.target.style.border = "1px solid black";

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 2) prevDiff = -1;
}

function init() {
    // Install event handlers for the pointer target
    var el=document.getElementById("mainbody");
    el.addEventListener('touchstart', touchstart_handler);

    //el.addEventListener('pointerdown', pointerdown_handler);
    //el.addEventListener('pointermove', pointermove_handler);

    // el.onpointerdown = pointerdown_handler;
    // el.onpointermove = pointermove_handler;


    // Use same handler for pointer{up,cancel,out,leave} events since
    // the semantics for these events - in this app - are the same.

    // el.addEventListener('pointerup',        pointerup_handler);
    // el.addEventListener('pointercancel',    pointerup_handler);
    // el.addEventListener('pointerout',       pointerup_handler);
    // el.addEventListener('pointerleave',     pointerup_handler);

    // el.onpointerup = pointerup_handler;
    // el.onpointercancel = pointerup_handler;
    // el.onpointerout = pointerup_handler;
    // el.onpointerleave = pointerup_handler;
}
