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

    // disable all popup banners for now
    EditorUi.prototype.showBanner = function(id, text, onclick, doNotShowAgainOnClose)
    {
        return false;
    }

    // hide the format window after init
    let EditorUiInit = EditorUi.prototype.init;
    EditorUi.prototype.init = function()
    {
        EditorUiInit.apply(this, arguments);
        if (this.formatWindow) {
            this.formatWindow.window.setVisible(false);
        }
        if (this.picker) {
            this.picker.style.display = 'none';
        }
    }


})();


MoonspeakInit = function(app)
{
    this.isMoonspeakDevMode = function() {
        return ['moonspeak.localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);
    }

    let editorUi = app.editor;
    
    let graph = editorUi.graph;

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

    // make zooming slower as main use is on touchscreens
    graph.zoomFactor = 1.02

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
    // handle message events
    let iframeinfo = new Map();

    let onChildMessage = (event, iframe) => {
        console.log(location + " " + document.title + " received:");
        console.log(event.data);

        // this is a message between the sub-iframes
        let info = iframeinfo.get(iframe);
        for (const connectedPort of info.observers) {
            connectedPort.postMessage(event.data);
        }
    };

    let registerChildIframe = (iframe) => {
        let channel = new MessageChannel();
        let info = {
            // contains channels of communicating child iframes
            "observers": new Set(),

            // the communication channel between graph and this iframe
            "iframeport": channel.port1,
        };
        info.iframeport.onmessage = (event) => onChildMessage(event, iframe);
        iframe.onload = () => {
            // if host on dev origin, soften developer pain by relaxing security, else be strict
            let targetOrigin = this.isMoonspeakDevMode() ? "*" : location.origin;
            iframe.contentWindow.postMessage({"info": "port"}, targetOrigin, [channel.port2]);
        };
        iframeinfo.set(iframe, info);
    };

    let addObserver = (sourceIFrame, observerIFrame) => {
        let source = iframeinfo.get(sourceIFrame);
        let observer = iframeinfo.get(observerIFrame);
        source.observers.add(observer.iframeport);
    }

    // sets default uuid for OPEN/SAVE actions
    graph.uuid = 'default';

    // Add OPEN action
    let getGraph = (url, graph, uuid) => {
        mxUtils.get(url + '?' + 'uuid=' + encodeURIComponent(uuid), function(req)
        {
            let node = req.getDocumentElement();
            let dec = new mxCodec(node.ownerDocument);
            dec.decode(node, graph.getModel());

            for (let index in graph.model.cells) {
                let cell = graph.model.cells[index];
                let style = graph.getCurrentCellStyle(cell);
                if (style && style['iframe'] === 1) {
                    registerChildIframe(cell.value);
                }
            }

            for (let index in graph.model.cells) {
                let cell = graph.model.cells[index];
                if (cell.edge) {
                    let edge = cell;
                    let source = graph.model.getTerminal(edge, true);
                    let target = graph.model.getTerminal(edge, false);

                    // interconnect them both ways
                    addObserver(source.value, target.value);
                    addObserver(target.value, source.value);
                }
            }

            // Stores ID for saving
            graph.uuid = uuid;
        });
    }
    //editorUi.actions.addAction('open', function() { getGraph(OPEN_URL, graph, graph.uuid)  });

    // Add SAVE action
    let postGraph = (url, graph) => {
        let enc = new mxCodec();
        let node = enc.encode(graph.getModel());
        let xml = mxUtils.getXml(node);

        mxUtils.post(url + '?' + 'uuid=' + encodeURIComponent(graph.uuid), 'xml=' + encodeURIComponent(xml), function()
        {
            mxUtils.alert('Saved');
        }, function()
        {
            mxUtils.alert('Error');
        });
    }
    //editorUi.actions.addAction('save', function() { postGraph(SAVE_URL, graph)  }, null, null, Editor.ctrlKey + '+S');

    let deleteObserver = (sourceIFrame, observerIFrame) => {
        let source = iframeinfo.get(sourceIFrame);
        let observer = iframeinfo.get(observerIFrame);
        source.observers.delete(observer.iframeport);
    }

    graph.addListener(mxEvent.CELLS_REMOVED, function(sender, evt)
    {
        for (const cell of evt.properties.cells) {
            if (!cell.edge) {
                continue;
            }
            // delete the connection between two iframes
            if (cell.source && cell.target) {
                deleteObserver(cell.source, cell.target);
                deleteObserver(cell.target, cell.source);
            }
        }
    });

    graph.connectionHandler.addListener(mxEvent.CONNECT, function(sender, evt)
    {
        let edge = evt.getProperty('cell');
        let source = graph.getModel().getTerminal(edge, true);
        let target = graph.getModel().getTerminal(edge, false);

        // interconnect them both ways
        addObserver(source.value, target.value);
        addObserver(target.value, source.value);
    });

    let onMessage = (event) =>
    {
        if (event.origin !== location.origin && ! this.isMoonspeakDevMode()) {
            // accept only messages from same origin, but ignore this rule for dev mode
            return;
        }

        console.log(location + " " + document.title + " received:");
        console.log(event.data);

        if (! ("info" in event.data)) {
            console.log("No 'info' field in message, skipping");
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
