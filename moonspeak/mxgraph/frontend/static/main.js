


var FEATURES = new Map();
var EDITOR = null;




// Program starts here. Creates a sample graph in the
// DOM node with the specified ID. This function is invoked
// from the onLoad event handler of the document (see below).
function initGraph(container, toolbar)
{
    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported())
    {
        // Displays an error message if the browser is not supported.
        mxUtils.error('Browser is not supported!', 200, false);
        return;
    }

    // Change container style
    // container.style.position = 'absolute';
    // container.style.overflow = 'hidden';
    // container.style.left = '0px';
    // container.style.top = '0px';
    // container.style.right = '0px';
    // container.style.bottom = '0px';
    container.style.background = 'url("images/grid.gif")';

    // mxGraph.prototype.allowDanglingEdges = false;
    // mxPanningHandler.prototype.ignoreCell = false;

    // Disable mxConnectionHandler initiating connections from the center of a shape
    // also disables border highlight when moving mouse over shape center
    // var mxGraphIsIgnoreTerminalEvent = mxGraph.prototype.isIgnoreTerminalEvent;
    // mxGraph.prototype.isIgnoreTerminalEvent = function(evt)
    // {
    //     if (evt.buttons == 0) {
    //         // just mousing over, ignore such events
    //         return true;
    //     }
    //     return mxGraphIsIgnoreTerminalEvent.call(this, arguments);
    // };
    

    // Adjust hanlders to make sure right click is only for panning
    // var mxSelectionCellsHandlerMouseDown = mxSelectionCellsHandler.prototype.mouseDown;
    // mxSelectionCellsHandler.prototype.mouseDown = function(sender, me)
    // {
    //     if (me.evt.button !== 2)
    //     {
    //         // works because there is a variable called "this.graph" in the scope, which is critical
    //         return mxSelectionCellsHandlerMouseDown.apply(this, arguments);
    //     }
    // };

    // var mxConnectionHandlerMouseDown = mxConnectionHandler.prototype.mouseDown;
    // mxConnectionHandler.prototype.mouseDown = function(sender, me)
    // {
    //     if (me.evt.button !== 2)
    //     {
    //         // works because there is a variable called "this.graph" in the scope, which is critical
    //         return mxConnectionHandlerMouseDown.apply(this, arguments);
    //     }
    // };

    // var mxGraphHandlerMouseDown = mxGraphHandler.prototype.mouseDown;
    // mxGraphHandler.prototype.mouseDown = function(sender, me)
    // {
    //     if (me.evt.button !== 2)
    //     {
    //         // works because there is a variable called "this.graph" in the scope, which is critical
    //         return mxGraphHandlerMouseDown.apply(this, arguments);
    //     }
    // };


    // Constructs a new editor.  This function invokes the onInit callback upon completion.
    // var config = mxUtils.load('config/uiconfig.xml').getDocumentElement();
    EDITOR = new mxEditor();

    // Sets the graph container and configures the editor
    EDITOR.setGraphContainer(container);
    // var config = mxUtils.load('config/uiconfig.xml').getDocumentElement();
    var config = mxUtils.load('config/keyhandler-minimal.xml').getDocumentElement();
    EDITOR.configure(config);

    // graph, such as the rubberband selection, but most parts
    // of the UI are custom in this example.
    var graph = EDITOR.graph;
    var model = graph.model;

    // Do not allow multiple edges between any two components, this is a DAG
    graph.setMultigraph(false);
    // Disables some global features
    graph.setConnectable(true);
    // graph.setCellsDisconnectable(false);
    graph.setCellsCloneable(false);
    //graph.swimlaneNesting = false;
    //graph.dropEnabled = true;

    // Change edge tolerance
    graph.setTolerance(20);

    // Render only 4 sizers on each box, not singleSizer, not all sizers
    mxVertexHandler.prototype.isSizerVisible = function(index)
    {
        return index === 0 || index === 2 || index === 5 || index === 7;
    };

    // Creates hover icons and hides hover icons when cells are moved
    var hoverIcons = new HoverIcons(graph);

    if (graph.graphHandler != null)
    {
        var graphHandlerStart = graph.graphHandler.start;
        
        graph.graphHandler.start = function()
        {
            if (hoverIcons != null)
            {
                hoverIcons.reset();
            }
            
            graphHandlerStart.apply(this, arguments);
        };
    }

    //================================================
    // Scroll graph using scroll bars
	graph.setPanning(true);
	
	/**
	 * Specifies the size of the size for "tiles" to be used for a graph with
	 * scrollbars but no visible background page. A good value is large
	 * enough to reduce the number of repaints that is caused for auto-
	 * translation, which depends on this value, and small enough to give
	 * a small empty buffer around the graph. Default is 400x400.
	 */
	graph.scrollTileSize = new mxRectangle(0, 0, 100, 100);
	
	/**
	 * Returns the padding for pages in page view with scrollbars.
	 */
	graph.getPagePadding = function()
	{
		return new mxPoint(Math.max(0, Math.round(graph.container.offsetWidth - 34)),
				Math.max(0, Math.round(graph.container.offsetHeight - 34)));
	};
	
	/**
	 * Returns the size of the page format scaled with the page size.
	 */
	graph.getPageSize = function()
	{
		return (this.pageVisible) ? new mxRectangle(0, 0, this.pageFormat.width * this.pageScale,
				this.pageFormat.height * this.pageScale) : this.scrollTileSize;
	};
	
	/**
	 * Returns a rectangle describing the position and count of the
	 * background pages, where x and y are the position of the top,
	 * left page and width and height are the vertical and horizontal
	 * page count.
	 */
	graph.getPageLayout = function()
	{
		var size = (this.pageVisible) ? this.getPageSize() : this.scrollTileSize;
		var bounds = this.getGraphBounds();

		if (bounds.width == 0 || bounds.height == 0)
		{
			return new mxRectangle(0, 0, 1, 1);
		}
		else
		{
			// Computes untransformed graph bounds
			var x = Math.ceil(bounds.x / this.view.scale - this.view.translate.x);
			var y = Math.ceil(bounds.y / this.view.scale - this.view.translate.y);
			var w = Math.floor(bounds.width / this.view.scale);
			var h = Math.floor(bounds.height / this.view.scale);
			
			var x0 = Math.floor(x / size.width);
			var y0 = Math.floor(y / size.height);
			var w0 = Math.ceil((x + w) / size.width) - x0;
			var h0 = Math.ceil((y + h) / size.height) - y0;
			
			return new mxRectangle(x0, y0, w0, h0);
		}
	};

	// Fits the number of background pages to the graph
	graph.view.getBackgroundPageBounds = function()
	{
		var layout = this.graph.getPageLayout();
		var page = this.graph.getPageSize();
		
		return new mxRectangle(this.scale * (this.translate.x + layout.x * page.width),
				this.scale * (this.translate.y + layout.y * page.height),
				this.scale * layout.width * page.width,
				this.scale * layout.height * page.height);
	};
	
	graph.getPreferredPageSize = function(bounds, width, height)
	{
		var pages = this.getPageLayout();
		var size = this.getPageSize();
		
		return new mxRectangle(0, 0, pages.width * size.width, pages.height * size.height);
	};
	
	/**
	 * Guesses autoTranslate to avoid another repaint (see below).
	 * Works if only the scale of the graph changes or if pages
	 * are visible and the visible pages do not change.
	 */
	var graphViewValidate = graph.view.validate;
	graph.view.validate = function()
	{
		if (this.graph.container != null && mxUtils.hasScrollbars(this.graph.container))
		{
			var pad = this.graph.getPagePadding();
			var size = this.graph.getPageSize();
			
			// Updating scrollbars here causes flickering in quirks and is not needed
			// if zoom method is always used to set the current scale on the graph.
			var tx = this.translate.x;
			var ty = this.translate.y;
			this.translate.x = pad.x / this.scale - (this.x0 || 0) * size.width;
			this.translate.y = pad.y / this.scale - (this.y0 || 0) * size.height;
		}
		
		graphViewValidate.apply(this, arguments);
	};
	
	var graphSizeDidChange = graph.sizeDidChange;
	graph.sizeDidChange = function()
	{
		if (this.container != null && mxUtils.hasScrollbars(this.container))
		{
			var pages = this.getPageLayout();
			var pad = this.getPagePadding();
			var size = this.getPageSize();
			
			// Updates the minimum graph size
			var minw = Math.ceil(2 * pad.x / this.view.scale + pages.width * size.width);
			var minh = Math.ceil(2 * pad.y / this.view.scale + pages.height * size.height);
			
			var min = graph.minimumGraphSize;
			
			// LATER: Fix flicker of scrollbar size in IE quirks mode
			// after delayed call in window.resize event handler
			if (min == null || min.width != minw || min.height != minh)
			{
				graph.minimumGraphSize = new mxRectangle(0, 0, minw, minh);
			}
			
			// Updates auto-translate to include padding and graph size
			var dx = pad.x / this.view.scale - pages.x * size.width;
			var dy = pad.y / this.view.scale - pages.y * size.height;
			
			if (!this.autoTranslate && (this.view.translate.x != dx || this.view.translate.y != dy))
			{
				this.autoTranslate = true;
				this.view.x0 = pages.x;
				this.view.y0 = pages.y;

				// NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
				// BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
				// SHOULD MOVE TRANSLATE/SCALE TO VIEW.
				var tx = graph.view.translate.x;
				var ty = graph.view.translate.y;

				graph.view.setTranslate(dx, dy);
				graph.container.scrollLeft += (dx - tx) * graph.view.scale;
				graph.container.scrollTop += (dy - ty) * graph.view.scale;

				this.autoTranslate = false;
				return;
			}

			graphSizeDidChange.apply(this, arguments);
		}
	};


    //================================================
    // Disable highlight of cells when dragging from toolbar
    graph.setDropEnabled(false);

    // Uses the port icon while connections are previewed
    graph.connectionHandler.getConnectImage = function(state)
    {
        return new mxImage(state.style[mxConstants.STYLE_IMAGE], 16, 16);
    };

    // Centers the port icon on the target port
    graph.connectionHandler.targetConnectImage = true;

    // Disables drilling into non-swimlanes.
	graph.isValidRoot = function(cell)
	{
		return this.isValidDropTarget(cell);
	}

	// Does not allow selection of locked cells
	graph.isCellSelectable = function(cell)
	{
		return !this.isCellLocked(cell);
	};

	// Everything is an HTML label now
	graph.isHtmlLabel = function(cell)
	{
		return true;
	}

    // graph.isClipping
    graph.setAutoSizeCells(true);
    mxGraph.prototype.autoSizeCellsOnAdd = true;

    graph.addListener(mxEvent.CELLS_RESIZED, function(sender, evt)
    {
      var cells = evt.getProperty('cells');
      
      if (cells != null)
      {
        for (var i = 0; i < cells.length; i++)
        {
          let cell = cells[i];
          let geo = graph.getCellGeometry(cell);
          cell.value.style.width = (geo.width - 10) + "px";
          cell.value.style.height = (geo.height - 10) + "px";
        }
      }
    });

    // var mxCellRendererRedrawLabel = mxCellRenderer.prototype.redrawLabel;
    // mxCellRenderer.prototype.redrawLabel = function(state, forced)
    // {
    //     var value = this.graph.model.getValue(state.cell)
    //     if (value.nodeName !== "iframe")
    //     {
    //         // works because there is a variable called "this.graph" in the scope, which is critical
    //         return mxCellRendererRedrawLabel.apply(this, arguments);
    //     }
    // };




    // let shadowHost = document.createElement("div");
    // let shadowRoot = shadowHost.attachShadow({mode: 'open'});
    // shadowRoot.appendChild(iframe);

    var mxGraphConvertValueToString = mxGraph.prototype.convertValueToString;
    graph.convertValueToString = function(cell)
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

    // Add graph elements
    // addSidebarIcon(graph, sidebar, "temp.html", 'images/icons48/table.png');
    // addSidebarIcon(graph, sidebar, "temp.html", 'images/icons48/earth.png');
    // addSidebarIcon(graph, sidebar, "temp.html", 'images/icons48/gear.png');
    // addSidebarIcon(graph, sidebar, "temp.html", 'images/icons48/server.png');
    // addSidebarIcon(graph, sidebar, shadowHost, 'images/icons48/earth.png');
    // addSidebarIcon(graph, sidebar, shadowHost, 'images/icons48/gear.png');
    // addSidebarIcon(graph, sidebar, shadowHost, 'images/icons48/keys.png');
    // addSidebarIcon(graph, sidebar, shadowHost, 'images/icons48/mail_new.png');
    // addSidebarIcon(graph, sidebar, shadowHost, 'images/icons48/server.png');

    // Configures: tooltips, new connections and panning
    // graph.setPanning(true);
    // graph.panningHandler.useLeftButtonForPanning = true;
    graph.setTooltips(false);
    graph.setConnectable(true);

    // Set minWidth and minHeight for cells
    var cellStyle = graph.getStylesheet().getDefaultVertexStyle();
    cellStyle['minWidth'] = 250;
    cellStyle['minHeight'] = 200;

    var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
    graph.getPreferredSizeForCell = function(cell)
    {
      var result = graphGetPreferredSizeForCell.apply(this, arguments);
      var thisCellStyle = this.getCellStyle(cell);
      
      if (thisCellStyle['minWidth'] > 0)
      {
        result.width = Math.max(thisCellStyle['minWidth'], result.width);
      }
      if (thisCellStyle['minHeight'] > 0)
      {
        result.height = Math.max(thisCellStyle['minHeight'], result.height);
      }
    
      return result;
    };


    // Set edge style
    // Changes the default style for edges "in-place" and assigns
    // an alternate edge style which is applied in mxGraph.flip
    // when the user double clicks on the adjustment control point
    // of the edge. The ElbowConnector edge style switches to TopToBottom
    // if the horizontal style is true.
    var style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mxConstants.STYLE_ROUNDED] = true;
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
    graph.alternateEdgeStyle = 'elbow=vertical';

    // When moving the edge, snap and move the start or end port
    // becasue rigidly moving the whole edge is not useful
    style[mxConstants.STYLE_MOVABLE] = 0;

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


    // Creates a new DIV that is used as a toolbar and adds
    // toolbar buttons.
    var spacer = document.createElement('div');
    spacer.style.display = 'inline';
    spacer.style.padding = '8px';

    addToolbarButton(EDITOR, toolbar, 'delete', 'Delete', 'images/delete2.png');

    toolbar.appendChild(spacer.cloneNode(true));

    addToolbarButton(EDITOR, toolbar, 'undo', '', 'images/undo.png');
    addToolbarButton(EDITOR, toolbar, 'redo', '', 'images/redo.png');

    toolbar.appendChild(spacer.cloneNode(true));

    addToolbarButton(EDITOR, toolbar, 'zoomIn', '', 'images/zoom_in.png', true);
    addToolbarButton(EDITOR, toolbar, 'zoomOut', '', 'images/zoom_out.png', true);
    addToolbarButton(EDITOR, toolbar, 'fit', '', 'images/fit_to_size.png', true);

    // Sets initial scrollbar positions
    window.setTimeout(function()
    {
        var bounds = graph.getGraphBounds();
        var width = Math.max(bounds.width, graph.scrollTileSize.width * graph.view.scale);
        var height = Math.max(bounds.height, graph.scrollTileSize.height * graph.view.scale);
        graph.container.scrollTop = Math.floor(Math.max(0, bounds.y - Math.max(20, (graph.container.clientHeight - height) / 4)));
        graph.container.scrollLeft = Math.floor(Math.max(0, bounds.x - Math.max(0, (graph.container.clientWidth - width) / 2)));
    }, 0);
};

function addSidebarIcon(graph, sidebar, label, image)
{
	// Function that is executed when the image is dropped on
	// the graph. The cell argument points to the cell under
	// the mousepointer if there is one.
	var funct = function(graph, evt, cell, x, y)
	{
		var parent = graph.getDefaultParent();
		var model = graph.getModel();
		
		var v1 = null;
		
		model.beginUpdate();
		try
		{

            let iframe = document.createElement("iframe");
            iframe.src = label;

			// NOTE: For non-HTML labels the image must be displayed via the style
			// rather than the label markup, so use 'image=' + image for the style.
			// as follows: v1 = graph.insertVertex(parent, null, label,
			// pt.x, pt.y, 120, 120, 'image=' + image);
			// v1 = graph.insertVertex(parent, null, label, x, y, 120, 120);
			v1 = graph.insertVertex(parent, null, iframe, x, y, 120, 120);
		}
		finally
		{
			model.endUpdate();
		}
		
		graph.setSelectionCell(v1);
	}
	
	// Creates the image which is used as the sidebar icon (drag source)
	var img = document.createElement('img');
	img.setAttribute('src', image);
	img.style.width = '48px';
	img.style.height = '48px';
	img.title = 'Drag this to the diagram to create a new vertex';
	sidebar.appendChild(img);
	
	var dragElt = document.createElement('div');
	dragElt.style.border = 'dashed black 1px';
	dragElt.style.width = '120px';
	dragElt.style.height = '120px';
	  					
	// Creates the image which is used as the drag icon (preview)
	var ds = mxUtils.makeDraggable(img, graph, funct, dragElt, 0, 0, true, true);
	ds.setGuidesEnabled(true);
};



function addToolbarButton(editor, toolbar, action, label, image, isTransparent)
{
    var button = document.createElement('button');
    button.style.fontSize = '10';
    if (image != null)
    {
        var img = document.createElement('img');
        img.setAttribute('src', image);
        img.style.width = '16px';
        img.style.height = '16px';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '2px';
        button.appendChild(img);
    }
    if (isTransparent)
    {
        button.style.background = 'transparent';
        button.style.color = '#FFFFFF';
        button.style.border = 'none';
    }
    mxEvent.addListener(button, 'click', function(evt)
    {
        editor.execute(action);
    });
    mxUtils.write(button, label);
    toolbar.appendChild(button);
};


function sqrtDist(ax, ay, bx, by)
{
    var dx = ax - bx;
    var dy = ay - by;
    var tmp = dx * dx + dy * dy;
    return tmp;
};


function addIframe(iframeElem, graph, x, y) {
    var parent = graph.getDefaultParent();
    var model = graph.getModel();
    
    var v1 = null;

    x = 100;
    y = 200;
    
    var iframe = null;
    model.beginUpdate();
    try
    {
        v1 = graph.insertVertex(parent, null, iframeElem, x, y, 120, 120);
    }
    finally
    {
        model.endUpdate();
    }
    
    graph.setSelectionCell(v1);
    return {
        "iframe": iframe,
        "vertex": v1,
    }
}


function mapBroadcast(event, map) {
    map.forEach((featureExtraInfo, featureIFrameElem, m) => {
        let iframeWindow = (featureIFrameElem.contentWindow || featureIFrameElem.contentDocument);
        if (iframeWindow !== event.source) {
            iframeWindow.postMessage(event.data, window.top.location.origin);
        };
    });
}


// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", (event) => {
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
        let result = addIframe(iframe, EDITOR.graph, 100, 100)
        if (result !== null) {
            let featureExtraInfo = {};
            FEATURES.set(iframe, featureExtraInfo);
        }

    } else if (event.data["info"].includes("broadcast")) {
        mapBroadcast(event, FEATURES);

    } else {
        console.log("Can not understand message info:" + event.data["info"]);
        return;
    }
});
