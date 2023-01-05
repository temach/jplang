/**
 * Pre-init step to fixup prototypes
 * This is called before EditorUi.init() and Editor.init()
 * Specifically for hacks that add behaiviour and then call the base function
 */
(function()
{
    // Render only 4 sizers on each box, not singleSizer, not all sizers
    mxVertexHandler.prototype.isSizerVisible = function(index)
    {
        return index === 0 || index === 2 || index === 5 || index === 7;
    };

    // in a few places the code directly references these global constructors 
    // because it expects DriveClient.js/DropboxClient.js/etc to be loaded 
    window.DriveFile = null;
    window.DriveLibrary = null;
    window.DropboxFile = null;
    window.DropboxLibrary = null;
    window.OneDriveFile = null;
    window.OneDriveLibrary = null;
    window.GitHubFile = null;
    window.GitHubLibrary = null;
    window.GitLabFile = null;
    window.GitLabLibrary = null;
    window.TrelloFile = null;
    window.TrelloLibrary = null;

    Sidebar.prototype.init = function()
    {
        this.entries = [];

        // Uses search.xml index file instead (faster load times)
        this.addStencilsToIndex = false;

        // Contains additional tags for shapes
        this.shapetags = {};

        // Adds tags from compressed text file for improved searches
        this.tagIndex = null;
    };

    // handle setting and unsetting pointer-event correctly for 
    // iframes and backing shapes when they are locked/unlocked
    let mxCellRendererRedraw = mxCellRenderer.prototype.redraw;
    mxCellRenderer.prototype.redraw = function(state, force, rendering)
    {
        mxCellRendererRedraw.apply(this, arguments);

        if (state.shape && state.shape.node) {
            if (state.view.graph.isCellLocked(state.cell)) {
                state.shape.node.dataset.moonspeakLocked = true;
                state.shape.node.setAttribute("pointer-events", "none");

                if (state.style.iframe) {
                    // iframes are stored as Text value, so we must mark them in addition to marking the underlying rect
                    state.text.value.dataset.moonspeakLocked = true;
                    state.text.value.setAttribute("pointer-events", "auto");

                    // mozilla hack
                    state.text.node.setAttribute("pointer-events", "none");
                    state.text.node.firstChild.setAttribute("pointer-events", "none");
                    state.text.node.style.pointerEvents = "none";
                    state.text.node.firstChild.style.pointerEvents = "none";
                }
            } else {
                delete state.shape.node.dataset.moonspeakLocked;
                state.shape.node.setAttribute("pointer-events", "auto");

                if (state.style.iframe) {
                    // iframes are stored as Text value, so we must mark them in addition to marking the underlying rect
                    delete state.text.value.dataset.moonspeakLocked;
                    state.text.value.setAttribute("pointer-events", "none");

                    state.text.node.setAttribute("pointer-events", "auto");
                    state.text.node.firstChild.setAttribute("pointer-events", "auto");
                    state.text.node.style.pointerEvents = "auto";
                    state.text.node.firstChild.style.pointerEvents = "auto";
                }

            }
        }
    }

    // Do not show crosses and green circles that show extra
    // focus points when mousing over a shape
    mxConstraintHandler.prototype.setFocus = function(me, state, source)
    {
        this.destroyFocusHighlight();
    }

    // consider all iframes as nodes
    let mxUtilsIsNode = mxUtils.isNode;
    mxUtils.isNode = function(value, nodeName, attributeName, attributeValue)
    {
        return (value && value.nodeName && value.nodeName.toLowerCase() === "iframe") || mxUtilsIsNode.apply(this, arguments);
    }

    // allow div field on nodes and render it directly as iframe
    let mxGraphConvertValueToString = mxGraph.prototype.convertValueToString;
    mxGraph.prototype.convertValueToString = function(cell)
    {
        let style = this.getCurrentCellStyle(cell);
        if (style && style['iframe'] === 1) {
            return cell.value;
        } else {
            return mxGraphConvertValueToString.apply(this, arguments);
        }
    }

    // do not load too many fonts for speedup
    Menus.prototype.defaultFonts = ['Helvetica', 'Verdana', 'Times New Roman'];

    // change menu that appears on right click on background
    Menus.prototype.createPopupMenu = function(menu, cell, evt)
    {
        menu.smartSeparators = true;

        this.addPopupMenuHistoryItems(menu, cell, evt);
        this.addPopupMenuEditItems(menu, cell, evt);
        // this.addPopupMenuStyleItems(menu, cell, evt);
        this.addPopupMenuArrangeItems(menu, cell, evt);
        // this.addPopupMenuCellItems(menu, cell, evt);
        // this.addPopupMenuSelectionItems(menu, cell, evt);
    };

    // disable all popup banners for now
    EditorUi.prototype.showBanner = function(id, text, onclick, doNotShowAgainOnClose)
    {
        return false;
    }

    // hide layers mxWindow
    EditorUi.prototype.showLayersDialog = function() {
        return;
    }

    // hide the format window after init
    let EditorUiInit = EditorUi.prototype.init;
    EditorUi.prototype.init = function()
    {
        EditorUiInit.apply(this, arguments);
        if (this.formatWindow) {
            this.formatWindow.window.setVisible(false);
        }
        // allow side toolbar picker to display
        // if (this.picker) {
        //     this.picker.style.display = 'none';
        // }
    }

})();


// This runs after the App has done its init.
// Specifically for hacks that must be done after everything has been initialised.
MoonspeakUi = function(app)
{
    // declare fields
    this.iframeinfo = new Map();

    // make pinch zooming slower, but do not go lower than .05 because of implicit dependencies
    this.zoomFactorPinchMax = 0.067;

    // run the init logic
    this.runInit(app);
};

MoonspeakUi.prototype.runInit = function(app)
{
    let editorUi = app.editor;
    let graph = editorUi.graph;

    // on file loaded, make iframe message connections
    // this.graph.getModel().addListener(mxEvent.CHANGE, funct);
    editorUi.addListener('fileLoaded', mxUtils.bind(this, function(editorUi)
    {
        let graph = editorUi.graph;
        let moonUi = editorUi.moonspeakUi;

        for (var index in graph.model.cells) {
            let cell = graph.model.cells[index];
            var style = graph.getCurrentCellStyle(cell);
            if (style && style['iframe'] == '1') {
                moonUi.registerChildIframe(cell.value);
            }
        }

        for (var index in graph.model.cells) {
            let cell = graph.model.cells[index];
            if (cell.edge) {
                let edge = cell;
                let source = graph.model.getTerminal(edge, true);
                let target = graph.model.getTerminal(edge, false);

                // interconnect them both ways
                moonUi.addObserver(source.value, target.value);
                moonUi.addObserver(target.value, source.value);
            }
        }
    }));


    let pointer_down_handler = (event) => {
        if (event.isPrimary == false) {
            // tell all iframes to stream events to graph
            // as we dont know which one of them will have the other pointerdown event
            for (const [iframe, info] of this.iframeinfo.entries()) {
                let message = {
                    type: 'pleaseStreamEvents',
                    value: true,
                };
                info.iframeport.postMessage(message);
            }
        }
    };

    let pointer_up_handler = (event) => {
        // tell all iframes that event streaming is not needed anymore
        for (const [iframe, info] of this.iframeinfo.entries()) {
            let message = {
                type: 'pleaseStreamEvents',
                value: false,
            };
            info.iframeport.postMessage(message);
        }
    };

    graph.container.addEventListener('pointerdown', pointer_down_handler);
    // use same handler for pointer{up,cancel,out,leave} events
    graph.container.addEventListener('pointerup', pointer_up_handler);
    graph.container.addEventListener('pointercancel', pointer_up_handler);
    graph.container.addEventListener('pointerout', pointer_up_handler);
    graph.container.addEventListener('pointerleave', pointer_up_handler);

    let dispatchPointerEvent = (event, type, targetElem) => {
        const pointerEvent = new PointerEvent(type, {
            ...event,
        });

        // re-dispatch the pointer event on the target element
        targetElem.dispatchEvent(pointerEvent);
    }


    // style fixes
    let stylesheet = graph.getStylesheet();

    let vertexStyle = stylesheet.getDefaultVertexStyle();

    let edgeStyle = stylesheet.getDefaultEdgeStyle();
    edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.NONE;
    edgeStyle[mxConstants.STYLE_STARTARROW] = mxConstants.NONE;
    edgeStyle[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL;
    edgeStyle[mxConstants.STYLE_ROUNDED] = true;
    edgeStyle[mxConstants.STYLE_JETTY_SIZE] = 'auto';
    edgeStyle[mxConstants.STYLE_ORTHOGONAL_LOOP] = true;
    // When moving the edge, snap and move the start or end port
    // becasue rigidly moving the whole edge is not useful
    edgeStyle[mxConstants.STYLE_MOVABLE] = false;

    // override the setVisible function for floating formatWindow
    if (app.formatWindow) {
        let formatWindowSetVisible = app.formatWindow.window.setVisible;
        app.formatWindow.window.setVisible = function(visible) {
            // always set to invisible
            formatWindowSetVisible.bind(this, false);
        }
    }

    // override in instance instead of prototype, because original func is defined during .init()
    let graphIsHtmlLabel = graph.isHtmlLabel;
    graph.isHtmlLabel = function(cell)
    {
        // adjust html label check by checking for iframe style tag (also call the original)
        let style = this.getCurrentCellStyle(cell);
        return (style != null) ? (style['iframe'] === 1 || graphIsHtmlLabel.apply(this, arguments)) : false;
    }

    // pinch zooming is clamped with this.zoomFactorPinchMax to be slower on mobile and touchpads
    // but mouse and buttons zoom is kept aggressive
    graph.zoomFactor = 1.2;

    // Consider all wheel events to be scroll events
    // override in instance instead of prototype, because original func is defined during .init()
    let graphIsZoomWheelEvent = graph.isZoomWheelEvent;
    graph.isZoomWheelEvent = function(evt)
    {
        if (evt.target.nodeName && evt.target.nodeName.toLowerCase() === "iframe") {
            // iframe get the event anyway, without reaching this listener
            // so if we are here, we must ignore it
            return false;
        }
        return true;
    }

    // Resize IFrame and Rectangle together
    let iframeRectanglePadding = 16;
    graph.addListener(mxEvent.CELLS_RESIZED, function(sender, evt)
    {
      var cells = evt.getProperty('cells');

      if (cells != null)
      {
        for (var i = 0; i < cells.length; i++)
        {
          let cell = cells[i];
          let geo = this.getCellGeometry(cell);
          if (cell.value.style)
          {
              cell.value.style.width = (geo.width - iframeRectanglePadding) + "px";
              cell.value.style.height = (geo.height - iframeRectanglePadding) + "px";
              cell.value.style.border = 'none';
          }
        }
      }
    });


    // disable tooltips
    graph.setTooltips(false);

    // do not allow dangling edges, so the only way to break connection is to delete the edge
    graph.setAllowDanglingEdges(false);

    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    graph.addListener(mxEvent.CELLS_REMOVED, function(sender, evt)
    {
        for (const cell of evt.properties.cells) {
            if (!cell.edge) {
                continue;
            }
            // delete the connection between two iframes
            if (cell.source && cell.target) {
                this.deleteObserver(cell.source, cell.target);
                this.deleteObserver(cell.target, cell.source);
            }
        }
    });

    graph.connectionHandler.addListener(mxEvent.CONNECT, function(sender, evt)
    {
        let edge = evt.getProperty('cell');
        let source = graph.getModel().getTerminal(edge, true);
        let target = graph.getModel().getTerminal(edge, false);

        // interconnect them both ways
        this.addObserver(source.value, target.value);
        this.addObserver(target.value, source.value);
    });

    let onMessage = (event) =>
    {
        if (event.origin !== location.origin && ! this.isMoonspeakDevMode()) {
            // accept only messages from same origin, but ignore this rule for dev mode
            return;
        }

        console.log(location + " " + document.title + " received:");
        console.log(event.data);

        if ((typeof event.data !== 'object') || ! ("info" in event.data)) {
            console.log("event.data is not an object or no 'info' field in event.data, skipping");
            return;
        }

        if (event.data["info"].includes("please feature")) {
            let iframe = document.createElement("iframe");
            iframe.src = event.data["src"];
            registerChildIframe(iframe);
            let result = this.addIframe(iframe);
        } else if (event.data["info"].includes("manager action")) {
            let action_name = event.data["action_name"];
            let action = editorUi.actions.get(action_name);
            action.funct();
        if (["pointerdown", "pointerup", "pointermove"].includes(event.data["info"])) {
            dispatchPointerEvent(event.data["pointerEvent"], event.data["info"], graph.container);
        } else {
            console.log("Can not understand message info:" + event.data["info"]);
            return;
        }
    };

    window.addEventListener("message", onMessage);

    // becasue editor initialisations use document.body.appendChild
    // the two deadzones must be added AFTER everyone has initialised
    // let divRight = document.createElement('div');
    // divRight.className = "bottomright deadzone";
    // document.body.appendChild(divRight);

    // let divLeft = document.createElement('div');
    // divLeft.className = "bottomleft deadzone";
    // document.body.appendChild(divLeft);

    // trigger loading of saved graph from backend
    // let action = editorUi.actions.get("open");
    // action.funct();
};

MoonspeakUi.prototype.addObserver = function(sourceIFrame, observerIFrame)
{
    let source = this.iframeinfo.get(sourceIFrame);
    let observer = this.iframeinfo.get(observerIFrame);
    source.observers.add(observer.iframeport);
};

MoonspeakUi.prototype.deleteObserver = function(sourceIFrame, observerIFrame)
{
    let source = this.iframeinfo.get(sourceIFrame);
    let observer = this.iframeinfo.get(observerIFrame);
    source.observers.delete(observer.iframeport);
};

MoonspeakUi.prototype.registerChildIframe = function(iframe)
{
    let channel = new MessageChannel();
    let info = {
        // contains channels of communicating child iframes
        "observers": new Set(),

        // the communication channel between graph and this iframe
        "iframeport": channel.port1,
    };
    info.iframeport.onmessage = (event) => this.onChildMessage(event, iframe);
    iframe.onload = () => {
        // if host on dev origin, soften developer pain by relaxing security, else be strict
        let targetOrigin = this.isMoonspeakDevMode() ? "*" : location.origin;
        iframe.contentWindow.postMessage({"info": "port"}, targetOrigin, [channel.port2]);
    };
    this.iframeinfo.set(iframe, info);
};

MoonspeakUi.prototype.onChildMessage = function(event, iframe)
{
    console.log(location + " " + document.title + " received:");
    console.log(event.data);

    // this is a message between the sub-iframes
    let info = this.iframeinfo.get(iframe);
    for (const connectedPort of info.observers) {
        connectedPort.postMessage(event.data);
    }
};

MoonspeakUi.prototype.isMoonspeakDevMode = function()
{
    // having 192.168.42.156 here allows debugging via usb tethering on android
    // set permanent computer address to this IP, then load it from the phone
    // then you dont have to run the router component
    return ['moonspeak.localhost', '127.0.0.1', '0.0.0.0', '192.168.42.156'].includes(location.hostname);
};

MoonspeakUi.prototype.clampPinchZoom = function(value)
{
    return Math.max(1 - this.zoomFactorPinchMax, Math.min(value, 1 + this.zoomFactorPinchMax));
}
