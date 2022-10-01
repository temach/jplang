To view translation keys and disable splash on draw.io use:`
```
https://app.diagrams.net/?lang=i18n&splash=0
```

to set ui, use ui=sketch url parameter


mxClient.4.2.2.js
72139-				// Forces repaint even if not moved to update pointer events
72140-				state.shape.bounds = null;



Looks like there are a few ways to lock the elements:

// edgeStyle[mxConstants.STYLE_POINTER_EVENTS] = 'none';
// edgeStyle["locked"] = '1';
// edgeStyle[mxConstants.STYLE_EDITABLE] = 0;
the same can be applied to default vertexStyle.

OR

// mxShape.prototype.svgPointerEvents = 'none';


Load line, see https://www.diagrams.net/doc/faq/supported-url-parameters :
localhost:8001/?lang=i18n&splash=0&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0&url=https://raw.githubusercontent.com/temach/jplang/master/moonspeak/graph/config/workelements.xml

older config line:
localhost:8001/?lang=i18n&dev=1&ui=sketch&noFileMenu=1&plugins=0&gapi=0&math=0&create=https://raw.githubusercontent.com/temach/jplang/master/moonspeak/graph/config/workelements.xml


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

