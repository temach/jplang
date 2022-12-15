To view translation keys and disable splash on draw.io use:`
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

Load line for when running with docker on localhost (note: must have ending slash "/" after graph):
http://moonspeak.localhost/router/route/graph-demouser-bbb/?lang=xxxxxx


Load line, see https://www.diagrams.net/doc/faq/supported-url-parameters :
http://localhost:8001/?lang=i18n&dev=1&test=1&mode=moonspeak&gh=0&gl=0&splash=0&ui=sketch&noFileMenu=1&plugins=0&gapi=0&print-csp=1&math=0#Mimport?uuid=default



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
