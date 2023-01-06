Debugging zoom on mobile:
1. After touching iframe, zooming on graph does not work, maybe focus shifts?
2. Two fnger zoom breaks if one or two fingers are in the iframe.

First lets debug problem 1.
Looking at logs after manually triggering finger zoom with androig-touch-record-replay git repo.
The difference between good and bad is that good always has:
10:17:37.537 size mxClient.js:118:57
10:17:37.538 scale mxClient.js:118:57
10:17:37.543 reset mxClient.js:118:57
10:17:37.552 scale mxClient.js:118:57
At the very end.
The good runs differ between themselves in the number of mouse press and their order.
It seems like somehing is just blocking the size event from firing in the bad case.
After looking its clear that the evt.movementY property is 0 for the pointermove events after a click in an iframe.
After clicking outside of iframe the event is registered and further evt.movementY are not 0.
Having movementY == 0, means that the factor variable is always too small to affect cumulativeZoomFactor.
The current fix is to just set movementY to 20 when calculating the factor, does not matter if its zoom in or out because factor is calculated with Math.abs.


Problem 2
mxClient.js
```
mxCellRenderer.prototype.installListeners = function(state)
```


mxClient.js
```
	addMouseWheelListener: function(funct, target)
			...
				var evtCache = [];
				var dx0 = 0;
				var dy0 = 0;
				
				// Adds basic listeners for graph event dispatching
				mxEvent.addGestureListeners(target, mxUtils.bind(this, function(evt)
				{
					if (!mxEvent.isMouseEvent(evt) && evt.pointerId != null)
					{
						evtCache.push(evt);
					}
				}),
					...
						// Calculate the distance between the two pointers
						var dx = Math.abs(evtCache[0].clientX - evtCache[1].clientX);
						var dy = Math.abs(evtCache[0].clientY - evtCache[1].clientY);
						var tx = Math.abs(dx - dx0);
						var ty = Math.abs(dy - dy0);

						if (tx > mxEvent.PINCH_THRESHOLD || ty > mxEvent.PINCH_THRESHOLD)
						{
							var cx = evtCache[0].clientX + (evtCache[1].clientX - evtCache[0].clientX) / 2;
							var cy = evtCache[0].clientY + (evtCache[1].clientY - evtCache[0].clientY) / 2;
							
							funct(evtCache[0], (tx > ty) ? dx > dx0 : dy > dy0, true, cx, cy);
```


mxClient.js
```
	addGestureListeners: function(node, startListener, moveListener, endListener)
	{
		if (startListener != null)
		{
			mxEvent.addListener(node, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown', startListener);
		}
		...
```


grapheditor/EditorUi.js
```
	mxEvent.addMouseWheelListener(mxUtils.bind(this, function(evt, up, force, cx, cy)
	{
		graph.fireEvent(new mxEventObject('wheel'));
		...
			else if (force || graph.isZoomWheelEvent(evt))
			{
				var source = mxEvent.getSource(evt);
				while (source != null)
				{
					if (source == graph.container)
					{
						graph.tooltipHandler.hideTooltip();
						cursorPosition = (cx != null && cy!= null) ? new mxPoint(cx, cy) :
							new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
						forcedZoom = force;
						var factor = graph.zoomFactor;
						var delay = null;
						...
```

Basically there is jitter in touch events, in particular: a short pointerdown + pointerup just before the long pointerdown + pointermove + pointerup.
Now because workelements unexpectedly push new events it happens that the sequence is pointerdown, pointerdown, pointerup.
This means that then the EditorUi.js event handler is called it is called with pointerdown event.
The simple hack is to apply the "pointermove" conditional to "pointerdown" case as well.
The other problem was that "addMouseWheelListener: function(funct, target)" in mxClient.js used clientX/Y to calculate delta from evtCache.
The coordinates were relative to DOM inside iframes, not to the screen. One solution is to modify mxClient.js to use screenX/Y.
The current hack is to feed screenX/Y from iframes into clientX/Y event fields.



To view translation keys and disable splash on draw.io use:
```
https://app.diagrams.net/?lang=i18n&splash=0
```

save and saveAs modes:
MODE_DEVICE - save data as a file for downloading to device
MODE_BROWSER - save graph as data into browser storage
MODE_MOONSPEAK - our custom mode for importing/saving to moonspeak

see:
```
rgjs ui.mode
rgjs unsavedChangesClickHereToSave
```

Must test one day with Trackpad pinch to zoom (browser expresses it as CTRL + Wheel event), see current code in mxClient.4.2.2.js:
```
    //To prevent window zoom on trackpad pinch
    if (evt.ctrlKey) 
    {
            evt.preventDefault();
    }
```

To test trackpad pinch zoom on firefox:
```
Mousewheel action prefs on the about:config page:

    mousewheel.default.action
    mousewheel.with_*.action
    mousewheel.with_alt.action = 2
    mousewheel.with_control.action = 3
    mousewheel.with_meta.action = 1
    mousewheel.with_shift.action = 4
    mousewheel.with_win.action= 1 

Action:

0: Nothing happens
1: Scrolling contents
2: Go back or go forward, in your history
3: Zoom in or out (reflowing zoom)
4: Treat vertical wheel as horizontal scroll
5: Zoom in or out (pinch zoom)
```

Really good info on pointer and touch events:
https://www.w3.org/TR/pointerevents3/

Touch events are NOT shared across iframes because its a CVE:
https://www.mozilla.org/en-US/security/advisories/mfsa2013-06/
Indeed it not logical, :(

Changing the events capture target also looks like its forbidden:
https://github.com/w3c/pointerevents/issues/291

Touch event is limited to single iframe. Touchstart and touchend events use something like capture,
so if touchstart was in an iframe, touchend can only trigger in the same iframe.
User agents should ensure that all Touch objects available from a given TouchEvent are all associated to the same
document that the TouchEvent was dispatched to. To implement this, user agents should maintain a notion of the
current touch-active document. On first touch, this is set to the target document where the touch was created.
If a touch starts entirely outside the currently touch-active document, then it is ignored entirely
See implementer's note: https://www.w3.org/TR/touch-events/#touchevent-implementer-s-note

If your touchstart listener calls preventDefault(), ensure preventDefault() is also called from associated
touchend listeners to continue suppressing the generation of click events and other default tap behavior.
Because touchend is generated on finger lift-off and if its not handled a mouse click will be generated.
https://developer.chrome.com/blog/scrolling-intervention/
https://developer.mozilla.org/en-US/docs/Web/API/Touch_events


For android debugging the UI simulate touch events via ADB:
https://igor.mp/blog/2018/02/23/using-adb-simulate-touch-events.html
https://developer.android.com/studio/test/monkeyrunner
https://developer.android.com/studio/test/other-testing-tools

https://stackoverflow.com/questions/4386449/send-touch-events-to-a-device-via-adb/18959385#18959385
https://source.android.com/docs/core/interaction/input/touch-devices
https://source.android.com/docs/core/interaction/input/getevent
https://stackoverflow.com/questions/7789826/adb-shell-input-events

Links:
- getevent source: https://github.com/ndyer/getevent/blob/master/getevent.c
- multi-touch protocol overview (has struct input_event_: https://www.kernel.org/doc/html/latest/input/input.html
- multi-touch protocol details: https://www.kernel.org/doc/html/v4.19/input/multi-touch-protocol.html
- good question on SO: https://stackoverflow.com/questions/30729738/parse-android-kernel-dev-input-event-touch-information
evtest util for linux and evemu.


FINALLY replay that sleeps according to delay!: https://github.com/Cartucho/android-touch-record-replay
For it to work, must manually copy the mysendevent-arm64 binary:
```
adb push mysendevent-arm64 /data/local/tmp/mysendevent
```
The short recording of short zoom-in with two fingers vertically: recorded_touch_events.txt



to set ui, use ui=sketch url parameter


mxClient.4.2.2.js
72139-				// Forces repaint even if not moved to update pointer events
72140-				state.shape.bounds = null;


Example initial config for graph:
```
{
  "language": "",
  "configVersion": null,
  "customFonts": [],
  "libraries": "general;uml;er;bpmn;flowchart;basic;arrows2",
  "customLibraries": [
    "L.scratchpad"
  ],
  "plugins": [],
  "recentColors": [],
  "formatWidth": "240",
  "createTarget": true,
  "pageFormat": {
    "x": 0,
    "y": 0,
    "width": 850,
    "height": 1100
  },
  "search": true,
  "showStartScreen": true,
  "gridColor": "#d0d0d0",
  "darkGridColor": "#6e6e6e",
  "autosave": true,
  "resizeImages": null,
  "openCounter": 79,
  "version": 18,
  "unit": 1,
  "isRulerOn": false,
  "ui": "",
  "darkMode": false
}
```


Controlling shape redraw:
mxCellRenderer.prototype.redrawShape
mxCellRenderer.prototype.redraw 
mxCellRenderer.prototype.redrawLabel
mxGraphView.prototype.validateCellState
mxSvgCanvas2D.prototype.addForeignObject

Inside: mxCellRenderer.prototype.createShape
a.view.graph.isCellLocked(a.cell) 
OR
Inside: mxCellRenderer.prototype.redrawLabel
this.state.view.graph.isCellLocked(this.state.cell) 

Does not work because the node id=1 does not get updated on redraw (its virtual)
So the proper solution is to set pointer-events to each element based on isCellLocked.
```
    let mxCellRendererRedraw = mxCellRenderer.prototype.redraw;
    mxCellRenderer.prototype.redraw = function(state, force, rendering)
    {
        mxCellRendererRedraw.apply(this, arguments);
        if (state.style.locked) {
            state.view.canvas.dataset.moonspeakLocked = true;
        } else if (state.view && state.view.canvas && state.view.canvas.dataset.moonspeakLocked) {
            delete state.view.canvas.dataset.moonspeakLocked;
        }
    }
```


Looks like there are a few ways to lock the elements:

// edgeStyle[mxConstants.STYLE_POINTER_EVENTS] = 'none';
// edgeStyle["locked"] = '1';
// edgeStyle[mxConstants.STYLE_EDITABLE] = 0;
the same can be applied to default vertexStyle.

OR

// mxShape.prototype.svgPointerEvents = 'none';

Load line for when running with docker on localhost (note: must have ending slash "/" after graph and removed "dev=1" param to load compiled assets):
http://moonspeak.localhost/router/route/graph-demouser-bbb/?lang=i18n&test=1&mode=moonspeak&gh=0&gl=0&splash=0&ui=sketch&noFileMenu=1&plugins=0&gapi=0&print-csp=1&math=0#Mimport?uuid=default


Load line, see https://www.diagrams.net/doc/faq/supported-url-parameters :
http://localhost:8001/?lang=i18n&dev=1&test=1&mode=moonspeak&gh=0&gl=0&splash=0&ui=sketch&noFileMenu=1&plugins=0&gapi=0&print-csp=1&math=0#Mimport?uuid=default

For android debugging use:
192.168.42.156 ip address


older config lines:
- localhost:8001/?lang=i18n&test=1&mode=moonspeak&splash=0&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0#Mimport?uuid=default
- localhost:8001/?lang=i18n&mode=moonspeak&splash=0&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0#Mimport?uuid=default
- localhost:8001/?lang=i18n&mode=moonspeak&splash=0&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0#Mhttp://localhost:8001/config/graph.xml
- localhost:8001/?lang=i18n&splash=0&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0#Uhttp://localhost:8001/config/graph.xml
- localhost:8001/?lang=i18n&splash=0&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0&url=https://raw.githubusercontent.com/temach/jplang/master/moonspeak/graph/config/workelements.xml
- localhost:8001/?lang=i18n&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0&create=https://raw.githubusercontent.com/temach/jplang/master/moonspeak/graph/config/workelements.xml


Its possible to add custom data attributes to foreignObject. Right now there is `data-drawio-colors` custom attribute thats added via mxClient.js
To add attributes to foreignObject, grep for it in mxClient.js specifically in function `mxSvgCanvas2D.prototype.addForeignObject()`.


draw.io has configurationKey and settingsKey with similar names '-configuration' and '-config' but they are different!
Configuration: https://www.diagrams.net/doc/faq/configure-diagram-editor

    // change the save changes button to do POST to backend
    // this code is almost identical to the original
    // DrawioFile.prototype.addUnsavedStatus = function(err)
    // {
    //     if (!this.inConflictState && this.ui.statusContainer != null && this.ui.getCurrentFile() == this)
    //     {
    //         if (err instanceof Error && err.message != null && err.message != '')
    //         {
    //             var status = mxUtils.htmlEntities(mxResources.get('unsavedChanges'));
    //             
    //             this.ui.editor.setStatus('<div title="'+ status + '" class="geStatusAlert">' +
    //                 status + ' (' + mxUtils.htmlEntities(err.message) + ')</div>');

    //             // Installs click handler for error message
    //             var links = this.ui.statusContainer.getElementsByTagName('div');
    //             
    //             if (links != null && links.length > 0)
    //             {
    //                 links[0].style.cursor = 'pointer';

    //                 mxEvent.addListener(links[0], 'click', mxUtils.bind(this, function()
    //                 {
    //                     this.ui.showError(mxResources.get('unsavedChanges'), mxUtils.htmlEntities(err.message));
    //                 }));
    //             }
    //         }
    //         else
    //         {
    //             var msg = this.getErrorMessage(err);

    //             if (msg == null && this.lastSaved != null)
    //             {
    //                 var str = this.ui.timeSince(new Date(this.lastSaved));
    //                 
    //                 // Only show if more than a minute ago
    //                 if (str != null)
    //                 {
    //                     msg = mxResources.get('lastSaved', [str]);
    //                 }
    //             }
    //             
    //             if (msg != null && msg.length > 60)
    //             {
    //                 msg = msg.substring(0, 60) + '...';
    //             }

    //             var status = mxUtils.htmlEntities(mxResources.get('unsavedChangesClickHereToSave')) +
    //                 ((msg != null && msg != '') ? ' (' + mxUtils.htmlEntities(msg) + ')' : '');
    //             this.ui.editor.setStatus('<div title="'+ status + '" class="geStatusAlertOrange">' + status +
    //                 ' <img src="' + Editor.saveImage + '"/></div>');
    //             
    //             // Installs click handler for saving
    //             var links = this.ui.statusContainer.getElementsByTagName('div');
    //             
    //             if (links != null && links.length > 0)
    //             {
    //                 links[0].style.cursor = 'pointer';

    //                 mxEvent.addListener(links[0], 'click', mxUtils.bind(this, function()
    //                 {
    //                     this.ui.actions.get((this.ui.mode == null || !this.isEditable()) ?
    //                         'saveAs' : 'save').funct();
    //                 }));
    //             }
    //             else
    //             {
    //                 var status = mxUtils.htmlEntities(mxResources.get('unsavedChanges'));
    //                 
    //                 this.ui.editor.setStatus('<div title="'+ status + '" class="geStatusAlert">' + status +
    //                     ' (' + mxUtils.htmlEntities(err.message) + ')</div>');
    //             }
    //             
    //             if (EditorUi.enableDrafts && (this.getMode() == null || EditorUi.isElectronApp))
    //             {
    //                 this.lastDraftSave = this.lastDraftSave || Date.now();

    //                 if (this.saveDraftThread != null)
    //                 {
    //                     window.clearTimeout(this.saveDraftThread);
    //                     this.saveDraftThread = null;

    //                     // Max delay without saving is double the delay for autosave or 30 sec
    //                     if (Date.now() - this.lastDraftSave > Math.max(2 * EditorUi.draftSaveDelay, 30000))
    //                     {
    //                         this.lastDraftSave = Date.now();
    //                         this.saveDraft();
    //                     }
    //                 }

    //                 this.saveDraftThread = window.setTimeout(mxUtils.bind(this, function()
    //                 {
    //                     this.lastDraftSave = Date.now();
    //                     this.saveDraftThread = null;
    //                     this.saveDraft();
    //                 }), EditorUi.draftSaveDelay || 0);
    //             }
    //         }
    //     }
    // };



After the compiler of ant all has done its job, this is what files were new on the filesystem
root@eda2cff53d36:/tmp/frontend# find . -newermt 2022-12-13 -type f -print
./src/main/webapp/js/viewer-static.min.js
./src/main/webapp/js/extensions.min.js
./src/main/webapp/js/viewer.min.js
./src/main/webapp/js/orgchart.min.js
./src/main/webapp/js/shapes-14-6-5.min.js
./src/main/webapp/js/app.min.js
./src/main/webapp/js/integrate.min.js
./src/main/webapp/js/stencils.min.js
./VERSION
./etc/propgen/README
./etc/propgen/convert.js
./etc/propgen/com/mxgraph/properties/PropGen.java
./etc/propgen/build.xml
./etc/propgen/package-lock.json
./etc/propgen/package.json
./etc/docker/README.md
./etc/integrate/Integrate.js
./etc/dependencies/package.json
./etc/dependencies/README.md
./etc/build/compiler.jar
./etc/build/Xml2Js.java
./etc/build/build.xml
./etc/build/build.properties
./etc/build/Xml2Js.class
./etc/build/base-viewer.min.js
./etc/build/base.min.js


It seems that these are the new JS files:
```
root@eda2cff53d36:/tmp/frontend# find . -newermt 2022-12-13T13:50:00 -type f -print
./src/main/webapp/js/viewer-static.min.js
./src/main/webapp/js/extensions.min.js
./src/main/webapp/js/viewer.min.js
./src/main/webapp/js/orgchart.min.js
./src/main/webapp/js/shapes-14-6-5.min.js
./src/main/webapp/js/app.min.js
./src/main/webapp/js/integrate.min.js
./src/main/webapp/js/stencils.min.js
./etc/build/base-viewer.min.js
./etc/build/base.min.js
```
