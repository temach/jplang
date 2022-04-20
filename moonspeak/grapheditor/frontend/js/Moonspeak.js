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

    // scrollbars must be enabled at all times so iframes do not reload
    Graph.prototype.defaultScrollbars = true;

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

    // configure how background pages are displayed
    Graph.prototype.defaultPageVisible = false;
    EditorUi.prototype.wheelZoomDelay = 80;
    EditorUi.prototype.buttonZoomDelay = 80;

    // allow div field on nodes and render it directly as iframe
    var mxGraphConvertValueToString = mxGraph.prototype.convertValueToString;
    mxGraph.prototype.convertValueToString = function(cell)
    {
        if (cell.div != null) {
            return cell.div;
        } else if (mxUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'iframe') {
            // Returns a DOM for the label
            cell.div = cell.value;
            return cell.div;
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
    this.features = new Map();

    window.addEventListener("message", (event) => 
    {
        if (event.origin !== window.top.location.origin) {
            // we only accept messages from the IFrames (must be on the same domain)
            return;
        }

        console.log("mxgraph received: ");
        console.log(event.data);

        if (! ("info" in event.data)) {
            console.log("No 'info' field in message, skipping");
            return;
        }

        if (event.data["info"].includes("created feature")) {
            let iframe = document.createElement("iframe");
            iframe.src = event.data["src"];
            let result = this.addIframe(iframe)
            if (result !== null) {
                let featureExtraInfo = {};
                this.features.set(iframe, featureExtraInfo);
            }

        } else if (event.data["info"].includes("broadcast")) {
            this.mapBroadcast(event, this.features);

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
