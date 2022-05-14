/**
 * Constructs a new moonspeak editor
 */
MoonspeakEditor = function(chromeless, themes, model, graph, editable)
{
	mxEventSource.call(this);
    this.preinit();
    this.editorUi = new EditorUi(new Editor(chromeless, themes, model, graph, editable));
	this.init();
};

/**
 * MoonspeakEditor inherits from mxEventSource
 */
mxUtils.extend(MoonspeakEditor, mxEventSource);

/**
 * ===============================================================
 * Place MoonspeakEditor functionality below
 */

/**
 * This is called before EditorUi.init() and Editor.init()
 * Specifically for hacks that add behaiviour and then call the base function
 */
MoonspeakEditor.prototype.preinit = function()
{
    // hide the left sidebar
    EditorUi.prototype.splitSize = 0;
    EditorUi.prototype.hsplitPosition = 0;

    // hide the footer at bottom of page
    EditorUi.prototype.footerHeight = 0;

    // hide the toolbar at the top of page
    EditorUi.prototype.toolbarHeight = 0;

    // scrollbars must be enabled at all times so iframes do not reload
    Graph.prototype.defaultScrollbars = true;

    // fix some default styling issues
    Graph.prototype.defaultEdgeStyle = {'edgeStyle': 'orthogonalEdgeStyle', 'rounded': '1', 'jettySize': 'auto', 'orthogonalLoop': '1'};

    // this function must be overriden to retain thin scrollbar styling
	let mxGraphView_validateBackgroundStyles = mxGraphView.prototype.validateBackgroundStyles;
    mxGraphView.prototype.validateBackgroundStyles = function()
    {
        // here "this" is an mxGraphView instance
		mxGraphView_validateBackgroundStyles.apply(this, arguments);
        this.graph.container.classList.add("styled-scrollbars");
    }

    // disable creation of top menubar
    EditorUi.prototype.menubarHeight = 0;
    Menus.prototype.createMenubar = function(container)
    {
        return null;
    }

    // ==================================
    // In order to save/open the graph we want to use the mxEditor's save
    // where to post to save the graph
    // mxEditor.prototype.urlPost = "save";

    // // disable EditorUI custom save dialog
    // EditorUi.prototype.saveFile = function(forceDialog) {
    //     var name = 'default';
    //     this.save(name);
    // }

    // // disable EditorUI custom save logic
    // let mxEditorSave = mxEditor.prototype.save;
    // EditorUi.prototype.save = function(name) {
    //     mxEditorSave.apply(this.editorUi.editor, arguments);
    // }

	// this.addAction('save', function() { ui.saveFile(false); }, null, null, Editor.ctrlKey + '+S').isEnabled = isGraphEnabled;
    // ==================================

    // place some functions from top menubar into toolbar
    // var toolbarInit = Toolbar.prototype.init;
    // Toolbar.prototype.init = function()
    // {
    //     toolbarInit.apply(this);
    //     var fileMenu = this.addMenu('', mxResources.get('insert') + ' (tooltip)', true, 'file', null, true);
    //     this.addDropDownArrow(fileMenu, 'geSprite-plus', 38, 48, -4, -3, 36, -8);

    //     // 	var formatMenu = this.addMenu('', mxResources.get('view') + ' (' + mxResources.get('panTooltip') + ')', true, 'viewPanels', null, true);
    //     // 	this.addDropDownArrow(formatMenu, 'geSprite-formatpanel', 38, 50, -4, -3, 36, -8);

    //     // var insertMenu = this.addMenu('', mxResources.get('insert') + ' (' + mxResources.get('doubleClickTooltip') + ')', true, 'insert', null, true);
    //     // this.addDropDownArrow(insertMenu, 'geSprite-plus', 38, 48, -4, -3, 36, -8);


    //     // 		this.edgeShapeMenu = this.addMenuFunction('', mxResources.get('connection'), false, mxUtils.bind(this, function(menu)
    //     // 		{
    //     // 			this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_SHAPE, 'width'], [null, null], 'geIcon geSprite geSprite-connection', null, true).setAttribute('title', mxResources.get('line'));
    //     // 			this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_SHAPE, 'width'], ['link', null], 'geIcon geSprite geSprite-linkedge', null, true).setAttribute('title', mxResources.get('link'));
    //     // 			this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_SHAPE, 'width'], ['flexArrow', null], 'geIcon geSprite geSprite-arrow', null, true).setAttribute('title', mxResources.get('arrow'));
    //     // 			this.editorUi.menus.edgeStyleChange(menu, '', [mxConstants.STYLE_SHAPE, 'width'], ['arrow', null], 'geIcon geSprite geSprite-simplearrow', null, true).setAttribute('title', mxResources.get('simpleArrow'));
    //     // 		}));
    //     // 
    //     // 		this.addDropDownArrow(this.edgeShapeMenu, 'geSprite-connection', 44, 50, 0, 0, 22, -4);
    // }

    // configure how background pages are displayed
    Graph.prototype.defaultPageVisible = false;
    EditorUi.prototype.wheelZoomDelay = 80;
    EditorUi.prototype.buttonZoomDelay = 80;

    // allow div field on nodes and render it directly as iframe
    var mxGraphConvertValueToString = mxGraph.prototype.convertValueToString;
    mxGraph.prototype.convertValueToString = function(cell)
    {
        if (cell.iframe != null) {
            return cell.iframe;
        } else if (mxUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'iframe') {
            // Returns a DOM for the label
            cell.iframe = cell.value;
            return cell.iframe;
        } else {
            return mxGraphConvertValueToString.apply(this, arguments);
        }
    }

    // easier selection of edges
    let sqrtDist = function(ax, ay, bx, by)
    {
        var dx = ax - bx;
        var dy = ay - by;
        var tmp = dx * dx + dy * dy;
        return tmp;
    };

    var mxEdgeHandlerGetHandleForEvent = mxEdgeHandler.prototype.getHandleForEvent;
    mxEdgeHandler.prototype.getHandleForEvent = function(me)
    {
        // call the original
        var handle = mxEdgeHandlerGetHandleForEvent.apply(this, arguments);

        // if handle is null, meaning the edge line was clicked, not any specific marker on the edge
        // then force select one of the end markers (either start or end port)
        if (handle == null && this.bends != null && me.state != null && me.state.cell == this.state.cell)
        {
            var start = this.bends[0];
            var startDist = sqrtDist(me.getGraphX(), me.getGraphY(), start.bounds.getCenterX(), start.bounds.getCenterY());

            var end = this.bends[this.bends.length - 1];
            var endDist = sqrtDist(me.getGraphX(), me.getGraphY(), end.bounds.getCenterX(), end.bounds.getCenterY());

            if (startDist < endDist) {
                return 0;
            } else {
                return this.bends.length - 1;
            }
        }

        return handle;
    };

};

/**
 * This is called after EditorUi.init()
 * Specifically for hacks that drive change in EditorUi
 */
MoonspeakEditor.prototype.init = function()
{
    let graph = this.editorUi.editor.graph;

    // hide the right sidebar
    this.editorUi.toggleFormatPanel(false);

    // hide the left sidebar
    this.editorUi.hsplitPosition = 0;
    this.editorUi.refresh();

    // style fixes
    var stylesheet = graph.getStylesheet();

    var vertexStyle = stylesheet.getDefaultVertexStyle();
    // vertexStyle[mxConstants.STYLE_ROUNDED] = true;

    var edgeStyle = stylesheet.getDefaultEdgeStyle();
	edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.NONE;
	edgeStyle[mxConstants.STYLE_STARTARROW] = mxConstants.NONE;
    // When moving the edge, snap and move the start or end port
    // becasue rigidly moving the whole edge is not useful
    edgeStyle[mxConstants.STYLE_MOVABLE] = false;
    // some things can only be forced if we pre-define graph.defaultEdgeStyle in preinit()
    // edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
    // edgeStyle[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ELBOW;
    // edgeStyle[mxConstants.STYLE_ROUNDED] = 1;
    // graph.currentEdgeStyle = mxUtils.clone(graph.defaultEdgeStyle);

    // Resize IFrame and Rectangle together
    let iframeRectanglePadding = 20;
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

    // Everything is an HTML label now
    // override in instance instead of prototype, because original func is defined during .init()
    let graphIsHtmlLabel = graph.isHtmlLabel;
    graph.isHtmlLabel = function(cell)
    {
        // adjust html label check by checking for iframe style tag (also call the original)
		var style = this.getCurrentCellStyle(cell);
		return (style != null) ? (style['iframe'] == '1' || graphIsHtmlLabel.apply(this, arguments)) : false;
    }

    // Consider all wheel events to be scroll events
    // override in instance instead of prototype, because original func is defined during .init()
    let graphIsZoomWheelEvent = graph.isZoomWheelEvent;
    graph.isZoomWheelEvent = function(evt)
    {
        return true;
    }

    // disable tooltips
    graph.setTooltips(false);

    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // handle message events
    let iframe2info = new Map();

    // do not allow dangling edges, so the only way to break connection is to delete the edge
    graph.setAllowDanglingEdges(false);

    let connectIframes = (s, t) => {
        let info = iframe2info.get(s.iframe);
        info.connectedIFrames.add(t.iframe);

        // handle "source" iframe asking the target iframe to load a plugin
        if (! s.iframe.contentWindow.moonspeakConnect) {
            return;
        }
        let pluginName = null;
        try {
            pluginName = s.iframe.contentWindow.moonspeakConnect(t.iframe.contentWindow.document);
        } catch (error) {
            console.log("Error connecting from" + s.iframe.src + " to " + t.iframe.src);
        }
        if (! pluginName) {
            return;
        }
        let message = {
            "info": "iframe connect",
            "pluginUrl": "/plugins/" + pluginName,
        }
        // tell the target iframe that "source" iframe wants to connect and install a plugin
        t.iframe.contentWindow.postMessage(message, window.location.origin);
    }

    let disconnectIframes = (s, t) => {
        let info = iframe2info.get(s.iframe);
        info.connectedIFrames.delete(t.iframe);
        // disconnect happens without postMessage
        // because its too hard to undo a javascript "install"
    }

    graph.connectionHandler.addListener(mxEvent.CONNECT, function(sender, evt)
    {
        var edge = evt.getProperty('cell');
        var source = graph.getModel().getTerminal(edge, true);
        var target = graph.getModel().getTerminal(edge, false);

        // interconnect them both ways
        connectIframes(source, target);
        connectIframes(target, source);
    });

    graph.addListener(mxEvent.CELLS_REMOVED, function(sender, evt)
    {
        for (const cell of evt.properties.cells) {
            if (!cell.edge) {
                continue;
            }
            // delete the connection between two iframes
            disconnectIframes(cell.source, cell.target);
            disconnectIframes(cell.target, cell.source);
        }
    });

    // Add OPEN action
    let getGraph = (url, graph, id) => {
        mxUtils.get(url + '?' + 'id=' + encodeURIComponent(id), function(req)
        {
            var node = req.getDocumentElement();
            var dec = new mxCodec(node.ownerDocument);
            dec.decode(node, graph.getModel());

            for (var index in graph.model.cells) {
                let cell = graph.model.cells[index];
                if (cell.iframe) {
                    let info = {
                        "connectedIFrames": new Set(),
                    };
                    iframe2info.set(cell.iframe, info);
                }
            }

            for (var index in graph.model.cells) {
                let cell = graph.model.cells[index];
                if (cell.edge) {
                    let edge = cell;
                    let source = graph.model.getTerminal(edge, true);
                    let target = graph.model.getTerminal(edge, false);

                    // interconnect them both ways
                    connectIframes(source, target);
                    connectIframes(target, source);
                }
            }

            // Stores ID for saving
            graph.id = id;
        });
    }
	this.editorUi.actions.addAction('open', function() { getGraph(OPEN_URL, graph, 'default')  });

    // Add SAVE action
    let postGraph = (url, graph) => {
        var enc = new mxCodec();
        var node = enc.encode(graph.getModel());
        var xml = mxUtils.getXml(node);
        
        mxUtils.post(url + '?' + 'id=' + encodeURIComponent(graph.id), 'xml=' + encodeURIComponent(xml), function()
        {
            mxUtils.alert('Saved');
        }, function()
        {
            mxUtils.alert('Error');
        });
    }
	this.editorUi.actions.addAction('save', function() { postGraph(SAVE_URL, graph)  }, null, null, Editor.ctrlKey + '+S');


    window.addEventListener("message", (event) =>
    {
        if (event.origin !== window.top.location.origin) {
            // we only accept messages from the IFrames (must be on the same domain)
            return;
        }

        console.log(window.location + " received:");
        console.log(event.data);

        if (! ("info" in event.data)) {
            console.log("No 'info' field in message, skipping");
            return;
        }

        if (event.data["info"].includes("please register")) {
            let iframe = document.createElement("iframe");
            iframe.src = event.data["src"];
            let result = this.addIframe(iframe);
            let info = {
                "connectedIFrames": new Set(),
            };
            iframe2info.set(iframe, info);
        } else if (event.data["info"].includes("broadcast")) {
            // this is a message between the sub-iframes
            let info = iframe2info.get(event.source.frameElement);
            for (const connectedIFrame of info.connectedIFrames) {
                let iframeWindow = (connectedIFrame.contentWindow || connectedIFrame.contentDocument);
                iframeWindow.postMessage(event.data, window.location.origin);
            }
        } else if (event.data["info"].includes("manager action")) {
            let action_name = event.data["action_name"];
            let action = this.editorUi.actions.get(action_name);
			action.funct();
        } else {
            console.log("Can not understand message info:" + event.data["info"]);
            return;
        }
    });


    // becasue editor initialisations use document.body.appendChild
    // the two deadzones must be added AFTER everyone has initialised
    var divRight = document.createElement('div');
    divRight.className = "bottomright deadzone";
    document.body.appendChild(divRight);

    var divLeft = document.createElement('div');
    divLeft.className = "bottomleft deadzone";
    document.body.appendChild(divLeft);
};


// Inserts a new IFrame at center of screen
MoonspeakEditor.prototype.addIframe = function(iframeElem)
{
    let graph = this.editorUi.editor.graph;
    var parent = graph.getDefaultParent();
    var model = graph.getModel();

    var v1 = null;
    var pt = graph.getCenterInsertPoint();

    // just set containing rect width and height to be similar to Iframe default width and height
    let width = 320;
    let height = 170;

    model.beginUpdate();
    try
    {
        v1 = graph.insertVertex(parent, null, iframeElem, pt.x, pt.y, width, height, 'iframe=1;');
    }
    finally
    {
        model.endUpdate();
    }

    graph.setSelectionCell(v1);

    return {
        "iframe": iframeElem,
        "vertex": v1,
    }
}


// Function to communicate between embedded iframes
MoonspeakEditor.prototype.mapBroadcast = function(event, map)
{
    map.forEach((featureExtraInfo, featureIFrameElem, m) => {
        let iframeWindow = (featureIFrameElem.contentWindow || featureIFrameElem.contentDocument);
        if (iframeWindow !== event.source) {
            iframeWindow.postMessage(event.data, window.top.location.origin);
        };
    });
}


/**
 * ===============================================================
 * Place prototype overrides below
 */

// Overridden to limit zoom to 10% - 600%.
Graph.prototype.zoom = function(factor, center)
{
	factor = Math.max(0.1, Math.min(this.view.scale * factor, 6)) / this.view.scale;
	mxGraph.prototype.zoom.apply(this, arguments);
};

// Render only 4 sizers on each box, not singleSizer, not all sizers
mxVertexHandler.prototype.isSizerVisible = function(index)
{
    return index === 0 || index === 2 || index === 5 || index === 7;
};

// Do not show crosses and green circles that show extra
// focus points when mousing over a shape
mxConstraintHandler.prototype.setFocus = function(me, state, source)
{
    this.destroyIcons();
    this.destroyFocusHighlight();
}
