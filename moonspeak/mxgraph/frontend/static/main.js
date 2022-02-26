// Program starts here. Creates a sample graph in the
// DOM node with the specified ID. This function is invoked
// from the onLoad event handler of the document (see below).
function initGraph(container, toolbar, sidebar, status)
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

    // Disable mxConnectionHandler initiating connections from the center of a shape
    // also disables border highlight when moving mouse over shape center
    var mxGraphIsIgnoreTerminalEvent = mxGraph.prototype.isIgnoreTerminalEvent;
    mxGraph.prototype.isIgnoreTerminalEvent = function(evt)
    {
        if (evt.buttons == 0) {
            // just mousing over, ignore such events
            return true;
        }
        return mxGraphIsIgnoreTerminalEvent.call(this, arguments);
    };
    

    // Adjust hanlders to make sure right click is only for panning
    var mxSelectionCellsHandlerMouseDown = mxSelectionCellsHandler.prototype.mouseDown;
    mxSelectionCellsHandler.prototype.mouseDown = function(sender, me)
    {
        if (me.evt.button !== 2)
        {
            // works because there is a variable called "this.graph" in the scope, which is critical
            return mxSelectionCellsHandlerMouseDown.apply(this, arguments);
        }
    };

    var mxConnectionHandlerMouseDown = mxConnectionHandler.prototype.mouseDown;
    mxConnectionHandler.prototype.mouseDown = function(sender, me)
    {
        if (me.evt.button !== 2)
        {
            // works because there is a variable called "this.graph" in the scope, which is critical
            return mxConnectionHandlerMouseDown.apply(this, arguments);
        }
    };

    var mxGraphHandlerMouseDown = mxGraphHandler.prototype.mouseDown;
    mxGraphHandler.prototype.mouseDown = function(sender, me)
    {
        if (me.evt.button !== 2)
        {
            // works because there is a variable called "this.graph" in the scope, which is critical
            return mxGraphHandlerMouseDown.apply(this, arguments);
        }
    };


    // Constructs a new editor.  This function invokes the onInit callback upon completion.
    // var config = mxUtils.load('config/uiconfig.xml').getDocumentElement();
    var editor = new mxEditor();

    // Sets the graph container and configures the editor
    editor.setGraphContainer(container);
    // var config = mxUtils.load('config/uiconfig.xml').getDocumentElement();
    var config = mxUtils.load('config/keyhandler-minimal.xml').getDocumentElement();
    editor.configure(config);

    // graph, such as the rubberband selection, but most parts
    // of the UI are custom in this example.
    var graph = editor.graph;
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

    // When moving the edge, snap and move the start or end port
    // becasue rigidly moving the whole edge is not useful
    graph.graphHandler.setMoveEnabled(false);
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

    // Defines an icon for creating new connections in the connection handler.
    // This will automatically disable the highlighting of the source vertex.
    // mxConnectionHandler.prototype.connectImage = new mxImage('images/connector.gif', 16, 16);

    // Configures: tooltips, new connections and panning
    graph.setPanning(true);
    // graph.panningHandler.useLeftButtonForPanning = true;
    graph.setTooltips(false);
    graph.setConnectable(true);

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

    // Adds zoom buttons in top, left corner
    var buttons = document.createElement('div');
    buttons.style.position = 'absolute';
    buttons.style.overflow = 'visible';

    var bs = graph.getBorderSizes();
    buttons.style.top = (container.offsetTop + bs.y) + 'px';
    buttons.style.left = (container.offsetLeft + bs.x) + 'px';
    
    var left = 0;
    var bw = 16;
    var bh = 16;
    
    if (mxClient.IS_QUIRKS)
    {
        bw -= 1;
        bh -= 1;
    }
    
    function addButton(label, funct)
    {
        var btn = document.createElement('div');
        mxUtils.write(btn, label);
        btn.style.position = 'absolute';
        btn.style.backgroundColor = 'transparent';
        btn.style.border = '1px solid gray';
        btn.style.textAlign = 'center';
        btn.style.fontSize = '10px';
        btn.style.cursor = 'hand';
        btn.style.width = bw + 'px';
        btn.style.height = bh + 'px';
        btn.style.left = left + 'px';
        btn.style.top = '0px';
        
        mxEvent.addListener(btn, 'click', function(evt)
        {
            funct();
            mxEvent.consume(evt);
        });
        
        left += bw;
        
        buttons.appendChild(btn);
    };
    
    addButton('+', function()
    {
        graph.zoomIn();
    });
    
    addButton('-', function()
    {
        graph.zoomOut();
    });

    // Creates a new DIV that is used as a toolbar and adds
    // toolbar buttons.
    var spacer = document.createElement('div');
    spacer.style.display = 'inline';
    spacer.style.padding = '8px';

    addToolbarButton(editor, toolbar, 'delete', 'Delete', 'images/delete2.png');

    toolbar.appendChild(spacer.cloneNode(true));

    addToolbarButton(editor, toolbar, 'undo', '', 'images/undo.png');
    addToolbarButton(editor, toolbar, 'redo', '', 'images/redo.png');

    // Displays useful hints in a small semi-transparent box.
    var hints = document.createElement('div');
    hints.style.position = 'absolute';
    hints.style.overflow = 'hidden';
    hints.style.width = '230px';
    hints.style.bottom = '56px';
    hints.style.height = '86px';
    hints.style.right = '20px';
    
    hints.style.background = 'black';
    hints.style.color = 'white';
    hints.style.fontFamily = 'Arial';
    hints.style.fontSize = '10px';
    hints.style.padding = '4px';

    mxUtils.setOpacity(hints, 50);
    
    mxUtils.writeln(hints, '- Drag an image from the sidebar to the graph');
    mxUtils.writeln(hints, '- Doubleclick on a table or column to edit');
    mxUtils.writeln(hints, '- Shift- or Rightclick and drag for panning');
    mxUtils.writeln(hints, '- Move the mouse over a cell to see a tooltip');
    mxUtils.writeln(hints, '- Click and drag a table to move and connect');
    mxUtils.writeln(hints, '- Shift- or Rightclick to show a popup menu');
    document.body.appendChild(hints);

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    var parent = graph.getDefaultParent();
                    
    // Adds cells to the model in a single step
    graph.getModel().beginUpdate();
    try
    {
        var v1 = graph.insertVertex(parent, null, 'Hello,', 120, 120, 80, 30);
        var v2 = graph.insertVertex(parent, null, 'World!', 400, 250, 80, 30);
        var e1 = graph.insertEdge(parent, null, '', v1, v2, 'edgeStyle=orthogonalEdgeStyle;');
        var e2 = graph.insertEdge(parent, null, '', v2, v1, 'edgeStyle=orthogonalEdgeStyle;');
    }
    finally
    {
        // Updates the display
        graph.getModel().endUpdate();
    }

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

