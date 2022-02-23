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
    // container.style.background = 'url("images/grid.gif")';

    // Constructs a new editor.  This function invokes the onInit callback upon completion.
    // var config = mxUtils.load('config/uiconfig.xml').getDocumentElement();
    var editor = new mxEditor();

    // Sets the graph container and configures the editor
    // editor.setGraphContainer(container);
    // var config = mxUtils.load('config/diagrameditor.xml').getDocumentElement();
    // var config = mxUtils.load('config/keyhandler-minimal.xml').getDocumentElement();
    // editor.configure(config);

    // graph, such as the rubberband selection, but most parts
    // of the UI are custom in this example.
    var graph = editor.graph;
    var model = graph.model;
    
    // Disables some global features
    graph.setConnectable(true);
    graph.setCellsDisconnectable(false);
    graph.setCellsCloneable(false);
    //graph.swimlaneNesting = false;
    //graph.dropEnabled = true;

    // Creates the graph inside the given container
    // var graph = new mxGraph(container);

    // Change edge tolerance
    graph.setTolerance(20);

    // Enables rubberband (marquee) selection and a handler
    // for basic keystrokes (eg. return, escape during editing).
    // var rubberband = new mxRubberband(graph);
    // var keyHandler = new mxKeyHandler(graph);

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
    // var buttons = document.createElement('div');
    // buttons.style.position = 'absolute';
    // buttons.style.overflow = 'visible';

    // var bs = graph.getBorderSizes();
    // buttons.style.top = (container.offsetTop + bs.y) + 'px';
    // buttons.style.left = (container.offsetLeft + bs.x) + 'px';
    // 
    // var left = 0;
    // var bw = 16;
    // var bh = 16;
    // 
    // if (mxClient.IS_QUIRKS)
    // {
    //     bw -= 1;
    //     bh -= 1;
    // }
    // 
    // function addButton(label, funct)
    // {
    //     var btn = document.createElement('div');
    //     mxUtils.write(btn, label);
    //     btn.style.position = 'absolute';
    //     btn.style.backgroundColor = 'transparent';
    //     btn.style.border = '1px solid gray';
    //     btn.style.textAlign = 'center';
    //     btn.style.fontSize = '10px';
    //     btn.style.cursor = 'hand';
    //     btn.style.width = bw + 'px';
    //     btn.style.height = bh + 'px';
    //     btn.style.left = left + 'px';
    //     btn.style.top = '0px';
    //     
    //     mxEvent.addListener(btn, 'click', function(evt)
    //     {
    //         funct();
    //         mxEvent.consume(evt);
    //     });
    //     
    //     left += bw;
    //     
    //     buttons.appendChild(btn);
    // };
    // 
    // addButton('+', function()
    // {
    //     graph.zoomIn();
    // });
    // 
    // addButton('-', function()
    // {
    //     graph.zoomOut();
    // });

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
