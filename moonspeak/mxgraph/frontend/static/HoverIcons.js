/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */

/**
 * Hover icons are used for hover, vertex handler and drag from sidebar.
 */
HoverIcons = function(graph)
{
    this.graph = graph;
    this.init();
};


/**
 * Allows all values in fit.
 */
HoverIcons.prototype.connectionArrowsEnabled = true;

/**
 * Sets the default target for all links in cells.
 */
HoverIcons.prototype.defaultEdgeLength = 80;

/**
 * Up arrow.
 */
HoverIcons.prototype.arrowSpacing = 2;

/**
 * Delay to switch to another state for overlapping bbox. Default is 500ms.
 */
HoverIcons.prototype.updateDelay = 500;

/**
 * Delay to switch between states. Default is 140ms.
 */
HoverIcons.prototype.activationDelay = 140;

/**
 * Up arrow.
 */
HoverIcons.prototype.currentState = null;

/**
 * Up arrow.
 */
HoverIcons.prototype.activeArrow = null;

/**
 * Up arrow.
 */
HoverIcons.prototype.inactiveOpacity = 15;

/**
 * Up arrow.
 */
HoverIcons.prototype.cssCursor = 'copy';

/**
 * Whether to hide arrows that collide with vertices.
 * LATER: Add keyboard override, touch support.
 */
HoverIcons.prototype.checkCollisions = true;

/**
 * Up arrow.
 */
HoverIcons.prototype.arrowFill = '#29b6f2';

/**
 * Helper function for creating SVG data URI.
 */
HoverIcons.prototype.createSvgImage = function(w, h, data, coordWidth, coordHeight)
{
    var tmp = unescape(encodeURIComponent(
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + 'px" height="' + h + 'px" ' +
        ((coordWidth != null && coordHeight != null) ? 'viewBox="0 0 ' + coordWidth + ' ' + coordHeight + '" ' : '') +
        'version="1.1">' + data + '</svg>'));

    return new mxImage('data:image/svg+xml;base64,' + ((window.btoa) ? btoa(tmp) : Base64.encode(tmp, true)), w, h)
};

/**
 * Up arrow.
 */
HoverIcons.prototype.triangleUp = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/triangle-up.png', 26, 14) :
    HoverIcons.prototype.createSvgImage(18, 28, '<path d="m 6 26 L 12 26 L 12 12 L 18 12 L 9 1 L 1 12 L 6 12 z" ' +
    'stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '"/>');

/**
 * Right arrow.
 */
HoverIcons.prototype.triangleRight = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/triangle-right.png', 14, 26) :
    HoverIcons.prototype.createSvgImage(26, 18, '<path d="m 1 6 L 14 6 L 14 1 L 26 9 L 14 18 L 14 12 L 1 12 z" ' +
    'stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '"/>');

/**
 * Down arrow.
 */
HoverIcons.prototype.triangleDown = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/triangle-down.png', 26, 14) :
    HoverIcons.prototype.createSvgImage(18, 26, '<path d="m 6 1 L 6 14 L 1 14 L 9 26 L 18 14 L 12 14 L 12 1 z" ' +
    'stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '"/>');

/**
 * Left arrow.
 */
HoverIcons.prototype.triangleLeft = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/triangle-left.png', 14, 26) :
    HoverIcons.prototype.createSvgImage(28, 18, '<path d="m 1 9 L 12 1 L 12 6 L 26 6 L 26 12 L 12 12 L 12 18 z" ' +
    'stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '"/>');

/**
 * Round target.
 */
HoverIcons.prototype.roundDrop = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/round-drop.png', 26, 26) :
    HoverIcons.prototype.createSvgImage(26, 26, '<circle cx="13" cy="13" r="12" ' +
    'stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '"/>');

/**
 * Refresh target.
 */
HoverIcons.prototype.refreshTarget = new mxImage((mxClient.IS_SVG) ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PGVsbGlwc2UgZmlsbD0iIzI5YjZmMiIgY3g9IjEyIiBjeT0iMTIiIHJ4PSIxMiIgcnk9IjEyIi8+PHBhdGggdHJhbnNmb3JtPSJzY2FsZSgwLjgpIHRyYW5zbGF0ZSgyLjQsIDIuNCkiIHN0cm9rZT0iI2ZmZiIgZmlsbD0iI2ZmZiIgZD0iTTEyIDZ2M2w0LTQtNC00djNjLTQuNDIgMC04IDMuNTgtOCA4IDAgMS41Ny40NiAzLjAzIDEuMjQgNC4yNkw2LjcgMTQuOGMtLjQ1LS44My0uNy0xLjc5LS43LTIuOCAwLTMuMzEgMi42OS02IDYtNnptNi43NiAxLjc0TDE3LjMgOS4yYy40NC44NC43IDEuNzkuNyAyLjggMCAzLjMxLTIuNjkgNi02IDZ2LTNsLTQgNCA0IDR2LTNjNC40MiAwIDgtMy41OCA4LTggMC0xLjU3LS40Ni0zLjAzLTEuMjQtNC4yNnoiLz48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+Cg==' :
    IMAGE_PATH + '/refresh.png', 38, 38);

/**
 * Tolerance for hover icon clicks.
 */
HoverIcons.prototype.tolerance = (mxClient.IS_TOUCH) ? 6 : 0;

/**
 * 
 */
HoverIcons.prototype.init = function()
{
    this.arrowUp = this.createArrow(this.triangleUp, mxResources.get('plusTooltip'));
    this.arrowRight = this.createArrow(this.triangleRight, mxResources.get('plusTooltip'));
    this.arrowDown = this.createArrow(this.triangleDown, mxResources.get('plusTooltip'));
    this.arrowLeft = this.createArrow(this.triangleLeft, mxResources.get('plusTooltip'));

    this.elts = [this.arrowUp, this.arrowRight, this.arrowDown, this.arrowLeft];

    this.resetHandler = mxUtils.bind(this, function()
    {
        this.reset();
    });
    
    this.repaintHandler = mxUtils.bind(this, function()
    {
        this.repaint();
    });

    this.graph.selectionModel.addListener(mxEvent.CHANGE, this.resetHandler);
    this.graph.model.addListener(mxEvent.CHANGE, this.repaintHandler);
    this.graph.view.addListener(mxEvent.SCALE_AND_TRANSLATE, this.repaintHandler);
    this.graph.view.addListener(mxEvent.TRANSLATE, this.repaintHandler);
    this.graph.view.addListener(mxEvent.SCALE, this.repaintHandler);
    this.graph.view.addListener(mxEvent.DOWN, this.repaintHandler);
    this.graph.view.addListener(mxEvent.UP, this.repaintHandler);
    this.graph.addListener(mxEvent.ROOT, this.repaintHandler);
    this.graph.addListener(mxEvent.ESCAPE, this.resetHandler);
    mxEvent.addListener(this.graph.container, 'scroll', this.resetHandler);
    
    // Resets the mouse point on escape
    this.graph.addListener(mxEvent.ESCAPE, mxUtils.bind(this, function()
    {
        this.mouseDownPoint = null;
    }));

    // Removes hover icons if mouse leaves the container
    mxEvent.addListener(this.graph.container, 'mouseleave',  mxUtils.bind(this, function(evt)
    {
        // Workaround for IE11 firing mouseleave for touch in diagram
        if (evt.relatedTarget != null && mxEvent.getSource(evt) == this.graph.container)
        {
            this.setDisplay('none');
        }
    }));
    
    // Resets current state when in-place editor starts
    this.graph.addListener(mxEvent.START_EDITING, mxUtils.bind(this, function(evt)
    {
        this.reset();
    }));
    
    // Resets current state after update of selection state for touch events
    var graphClick = this.graph.click;
    this.graph.click = mxUtils.bind(this, function(me)
    {
        graphClick.apply(this.graph, arguments);
        
        if (this.currentState != null && !this.graph.isCellSelected(this.currentState.cell) &&
            mxEvent.isTouchEvent(me.getEvent()) && !this.graph.model.isVertex(me.getCell()))
        {
            this.reset();
        }
    });
    
    // Checks if connection handler was active in mouse move
    // as workaround for possible double connection inserted
    var connectionHandlerActive = false;
    
    // Implements a listener for hover and click handling
    this.graph.addMouseListener(
    {
        mouseDown: mxUtils.bind(this, function(sender, me)
        {
            connectionHandlerActive = false;
            var evt = me.getEvent();
            
            if (this.isResetEvent(evt))
            {
                this.reset();
            }
            else if (!this.isActive())
            {
                var state = this.getState(me.getState());
                
                if (state != null || !mxEvent.isTouchEvent(evt))
                {
                    this.update(state);
                }
            }
            
            this.setDisplay('none');
        }),
        mouseMove: mxUtils.bind(this, function(sender, me)
        {
            var evt = me.getEvent();
            
            if (this.isResetEvent(evt))
            {
                this.reset();
            }
            else if (!this.graph.isMouseDown && !mxEvent.isTouchEvent(evt))
            {
                this.update(this.getState(me.getState()),
                    me.getGraphX(), me.getGraphY());
            }
            
            if (this.graph.connectionHandler != null &&
                this.graph.connectionHandler.shape != null)
            {
                connectionHandlerActive = true;
            }
        }),
        mouseUp: mxUtils.bind(this, function(sender, me)
        {
            var evt = me.getEvent();
            var pt = mxUtils.convertPoint(this.graph.container,
                mxEvent.getClientX(evt), mxEvent.getClientY(evt))
            
            if (this.isResetEvent(evt))
            {
                this.reset();
            }
            else if (this.isActive() && !connectionHandlerActive &&
                this.mouseDownPoint != null)
            {
                this.click(this.currentState, this.getDirection(), me);
            }
            else if (this.isActive())
            {
                // Selects target vertex after drag and clone if not only new edge was inserted
                if (this.graph.getSelectionCount() != 1 || !this.graph.model.isEdge(
                    this.graph.getSelectionCell()))
                {
                    this.update(this.getState(this.graph.view.getState(
                        this.graph.getCellAt(me.getGraphX(), me.getGraphY()))));
                }
                else
                {
                    this.reset();
                }
            }
            else if (mxEvent.isTouchEvent(evt) || (this.bbox != null &&
                mxUtils.contains(this.bbox, me.getGraphX(), me.getGraphY())))
            {
                // Shows existing hover icons if inside bounding box
                this.setDisplay('');
                this.repaint();
            }
            else if (!mxEvent.isTouchEvent(evt))
            {
                this.reset();
            }
            
            connectionHandlerActive = false;
            this.resetActiveArrow();
        })
    });
};

/**
 * 
 */
HoverIcons.prototype.isResetEvent = function(evt, allowShift)
{
    return mxEvent.isAltDown(evt) || (this.activeArrow == null && mxEvent.isShiftDown(evt)) ||
        (mxEvent.isPopupTrigger(evt) && !this.isCloneEvent(evt));
};

/**
 * 
 */
HoverIcons.prototype.createArrow = function(img, tooltip)
{
    var arrow = null;
    
    if (mxClient.IS_IE && !mxClient.IS_SVG)
    {
        // Workaround for PNG images in IE6
        if (mxClient.IS_IE6 && document.compatMode != 'CSS1Compat')
        {
            arrow = document.createElement(mxClient.VML_PREFIX + ':image');
            arrow.setAttribute('src', img.src);
            arrow.style.borderStyle = 'none';
        }
        else
        {
            arrow = document.createElement('div');
            arrow.style.backgroundImage = 'url(' + img.src + ')';
            arrow.style.backgroundPosition = 'center';
            arrow.style.backgroundRepeat = 'no-repeat';
        }
        
        arrow.style.width = (img.width + 4) + 'px';
        arrow.style.height = (img.height + 4) + 'px';
        arrow.style.display = (mxClient.IS_QUIRKS) ? 'inline' : 'inline-block';
    }
    else
    {
        arrow = mxUtils.createImage(img.src);
        arrow.style.width = img.width + 'px';
        arrow.style.height = img.height + 'px';
        arrow.style.padding = this.tolerance + 'px';
    }
    
    if (tooltip != null)
    {
        arrow.setAttribute('title', tooltip);
    }
    
    arrow.style.position = 'absolute';
    arrow.style.cursor = this.cssCursor;

    mxEvent.addGestureListeners(arrow, mxUtils.bind(this, function(evt)
    {
        if (this.currentState != null && !this.isResetEvent(evt))
        {
            this.mouseDownPoint = mxUtils.convertPoint(this.graph.container,
                    mxEvent.getClientX(evt), mxEvent.getClientY(evt));
            this.drag(evt, this.mouseDownPoint.x, this.mouseDownPoint.y);
            this.activeArrow = arrow;
            this.setDisplay('none');
            mxEvent.consume(evt);
        }
    }));
    
    // Captures mouse events as events on graph
    mxEvent.redirectMouseEvents(arrow, this.graph, this.currentState);
    
    mxEvent.addListener(arrow, 'mouseenter', mxUtils.bind(this, function(evt)
    {
        // Workaround for Firefox firing mouseenter on touchend
        if (mxEvent.isMouseEvent(evt))
        {
            if (this.activeArrow != null && this.activeArrow != arrow)
            {
                mxUtils.setOpacity(this.activeArrow, this.inactiveOpacity);
            }

            this.graph.connectionHandler.constraintHandler.reset();
            mxUtils.setOpacity(arrow, 100);
            this.activeArrow = arrow;
        }
    }));
    
    mxEvent.addListener(arrow, 'mouseleave', mxUtils.bind(this, function(evt)
    {
        // Workaround for IE11 firing this event on touch
        if (!this.graph.isMouseDown)
        {
            this.resetActiveArrow();
        }
    }));
    
    return arrow;
};

/**
 * 
 */
HoverIcons.prototype.resetActiveArrow = function()
{
    if (this.activeArrow != null)
    {
        mxUtils.setOpacity(this.activeArrow, this.inactiveOpacity);
        this.activeArrow = null;
    }
};

/**
 * 
 */
HoverIcons.prototype.getDirection = function()
{
    var dir = mxConstants.DIRECTION_EAST;

    if (this.activeArrow == this.arrowUp)
    {
        dir = mxConstants.DIRECTION_NORTH;
    }
    else if (this.activeArrow == this.arrowDown)
    {
        dir = mxConstants.DIRECTION_SOUTH;
    }
    else if (this.activeArrow == this.arrowLeft)
    {
        dir = mxConstants.DIRECTION_WEST;
    }
        
    return dir;
};

/**
 * 
 */
HoverIcons.prototype.visitNodes = function(visitor)
{
    for (var i = 0; i < this.elts.length; i++)
    {
        if (this.elts[i] != null)
        {
            visitor(this.elts[i]);
        }
    }
};

/**
 * 
 */
HoverIcons.prototype.removeNodes = function()
{
    this.visitNodes(function(elt)
    {
        if (elt.parentNode != null)
        {
            elt.parentNode.removeChild(elt);
        }
    });
};

/**
 *
 */
HoverIcons.prototype.setDisplay = function(display)
{
    this.visitNodes(function(elt)
    {
        elt.style.display = display;
    });
};

/**
 *
 */
HoverIcons.prototype.isActive = function()
{
    return this.activeArrow != null && this.currentState != null;
};

/**
 *
 */
HoverIcons.prototype.drag = function(evt, x, y)
{
    this.graph.popupMenuHandler.hideMenu();
    this.graph.stopEditing(false);

    // Checks if state was removed in call to stopEditing above
    if (this.currentState != null)
    {
        this.graph.connectionHandler.start(this.currentState, x, y);
        this.graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
        this.graph.isMouseDown = true;
        
        // Hides handles for selection cell
        var handler = this.graph.selectionCellsHandler.getHandler(this.currentState.cell);
        
        if (handler != null)
        {
            handler.setHandlesVisible(false);
        }
        
        // Ctrl+shift drag sets source constraint
        var es = this.graph.connectionHandler.edgeState;

        if (evt != null && mxEvent.isShiftDown(evt) && mxEvent.isControlDown(evt) && es != null &&
            mxUtils.getValue(es.style, mxConstants.STYLE_EDGE, null) === 'orthogonalEdgeStyle')
        {
            var direction = this.getDirection();
            es.cell.style = mxUtils.setStyle(es.cell.style, 'sourcePortConstraint', direction);
            es.style['sourcePortConstraint'] = direction;
        }
    }
};

/**
 *
 */
HoverIcons.prototype.getStateAt = function(state, x, y)
{
    return this.graph.view.getState(this.graph.getCellAt(x, y));
};

/**
 *
 */
HoverIcons.prototype.click = function(state, dir, me)
{
    var evt = me.getEvent();
    var x = me.getGraphX();
    var y = me.getGraphY();
    
    var tmp = this.getStateAt(state, x, y);

    if (tmp != null && this.graph.model.isEdge(tmp.cell) && !this.graph.isCloneEvent(evt) &&
        (tmp.getVisibleTerminalState(true) == state || tmp.getVisibleTerminalState(false) == state))
    {
        this.graph.setSelectionCell(tmp.cell);
        this.reset();
    }
    else if (state != null)
    {
        this.execute(state, dir, me);
    }
    
    me.consume();
};

/**
 *
 */
HoverIcons.prototype.execute = function(state, dir, me)
{
    var evt = me.getEvent();

    this.selectCellsForConnectVertex(this.connectVertex(
        state.cell, dir, this.defaultEdgeLength, evt, this.graph.isCloneEvent(evt),
        this.graph.isCloneEvent(evt)), evt, this);
};

/**
 * 
 */
HoverIcons.prototype.reset = function(clearTimeout)
{
    clearTimeout = (clearTimeout == null) ? true : clearTimeout;
    
    if (clearTimeout && this.updateThread != null)
    {
        window.clearTimeout(this.updateThread);
    }

    this.mouseDownPoint = null;
    this.currentState = null;
    this.activeArrow = null;
    this.removeNodes();
    this.bbox = null;
};

/**
 * 
 */
HoverIcons.prototype.repaint = function()
{
    this.bbox = null;
    
    if (this.currentState != null)
    {
        // Checks if cell was deleted
        this.currentState = this.getState(this.currentState);
        
        // Cell was deleted 
        if (this.currentState != null &&
            this.graph.model.isVertex(this.currentState.cell) &&
            this.graph.isCellConnectable(this.currentState.cell))
        {
            var bds = mxRectangle.fromRectangle(this.currentState);
            
            // Uses outer bounding box to take rotation into account
            if (this.currentState.shape != null && this.currentState.shape.boundingBox != null)
            {
                bds = mxRectangle.fromRectangle(this.currentState.shape.boundingBox);
            }

            bds.grow(this.graph.tolerance);
            bds.grow(this.arrowSpacing);
            
            var handler = this.graph.selectionCellsHandler.getHandler(this.currentState.cell);
            
            if (this.isTableRow(this.currentState.cell))
            {
                handler = this.graph.selectionCellsHandler.getHandler(
                    this.graph.model.getParent(this.currentState.cell));
            }
            
            var rotationBbox = null;
            
            if (handler != null)
            {
                bds.x -= handler.horizontalOffset / 2;
                bds.y -= handler.verticalOffset / 2;
                bds.width += handler.horizontalOffset;
                bds.height += handler.verticalOffset;
                
                // Adds bounding box of rotation handle to avoid overlap
                if (handler.rotationShape != null && handler.rotationShape.node != null &&
                    handler.rotationShape.node.style.visibility != 'hidden' &&
                    handler.rotationShape.node.style.display != 'none' &&
                    handler.rotationShape.boundingBox != null)
                {
                    rotationBbox = handler.rotationShape.boundingBox;
                }
            }
            
            // Positions arrows avoid collisions with rotation handle
            var positionArrow = mxUtils.bind(this, function(arrow, x, y)
            {
                if (rotationBbox != null)
                {
                    var bbox = new mxRectangle(x, y, arrow.clientWidth, arrow.clientHeight);
                    
                    if (mxUtils.intersects(bbox, rotationBbox))
                    {
                        if (arrow == this.arrowUp)
                        {
                            y -= bbox.y + bbox.height - rotationBbox.y;
                        }
                        else if (arrow == this.arrowRight)
                        {
                            x += rotationBbox.x + rotationBbox.width - bbox.x;
                        }
                        else if (arrow == this.arrowDown)
                        {
                            y += rotationBbox.y + rotationBbox.height - bbox.y;
                        }
                        else if (arrow == this.arrowLeft)
                        {
                            x -= bbox.x + bbox.width - rotationBbox.x;
                        }
                    }
                }
                    
                arrow.style.left = x + 'px';
                arrow.style.top = y + 'px';
                mxUtils.setOpacity(arrow, this.inactiveOpacity);
            });
            
            positionArrow(this.arrowUp,
                Math.round(this.currentState.getCenterX() - this.triangleUp.width / 2 - this.tolerance),
                Math.round(bds.y - this.triangleUp.height - this.tolerance));
            
            positionArrow(this.arrowRight, Math.round(bds.x + bds.width - this.tolerance),
                Math.round(this.currentState.getCenterY() - this.triangleRight.height / 2 - this.tolerance));
            
            positionArrow(this.arrowDown, parseInt(this.arrowUp.style.left),
                Math.round(bds.y + bds.height - this.tolerance));
            
            positionArrow(this.arrowLeft, Math.round(bds.x - this.triangleLeft.width - this.tolerance),
                parseInt(this.arrowRight.style.top));
            
            if (this.checkCollisions)
            {
                var right = this.graph.getCellAt(bds.x + bds.width +
                        this.triangleRight.width / 2, this.currentState.getCenterY());
                var left = this.graph.getCellAt(bds.x - this.triangleLeft.width / 2, this.currentState.getCenterY()); 
                var top = this.graph.getCellAt(this.currentState.getCenterX(), bds.y - this.triangleUp.height / 2); 
                var bottom = this.graph.getCellAt(this.currentState.getCenterX(), bds.y + bds.height + this.triangleDown.height / 2); 

                // Shows hover icons large cell is behind all directions of current cell
                if (right != null && right == left && left == top && top == bottom)
                {
                    right = null;
                    left = null;
                    top = null;
                    bottom = null;
                }

                var currentGeo = this.graph.getCellGeometry(this.currentState.cell);
                
                var checkCollision = mxUtils.bind(this, function(cell, arrow)
                {
                    var geo = this.graph.model.isVertex(cell) && this.graph.getCellGeometry(cell);
                    
                    // Ignores collision if vertex is more than 3 times the size of this vertex
                    if (cell != null && !this.graph.model.isAncestor(cell, this.currentState.cell) &&
                        !this.graph.isSwimlane(cell) && (geo == null || currentGeo == null ||
                        (geo.height < 3 * currentGeo.height && geo.width < 3 * currentGeo.width)))
                    {
                        arrow.style.visibility = 'hidden';
                    }
                    else
                    {
                        arrow.style.visibility = 'visible';
                    }
                });
                
                checkCollision(right, this.arrowRight);
                checkCollision(left, this.arrowLeft);
                checkCollision(top, this.arrowUp);
                checkCollision(bottom, this.arrowDown);
            }
            else
            {
                this.arrowLeft.style.visibility = 'visible';
                this.arrowRight.style.visibility = 'visible';
                this.arrowUp.style.visibility = 'visible';
                this.arrowDown.style.visibility = 'visible';
            }
            
            if (this.graph.tooltipHandler.isEnabled())
            {
                this.arrowLeft.setAttribute('title', mxResources.get('plusTooltip'));
                this.arrowRight.setAttribute('title', mxResources.get('plusTooltip'));
                this.arrowUp.setAttribute('title', mxResources.get('plusTooltip'));
                this.arrowDown.setAttribute('title', mxResources.get('plusTooltip'));
            }
            else
            {
                this.arrowLeft.removeAttribute('title');
                this.arrowRight.removeAttribute('title');
                this.arrowUp.removeAttribute('title');
                this.arrowDown.removeAttribute('title');
            }
        }
        else
        {
            this.reset();
        }
        
        // Updates bounding box
        if (this.currentState != null)
        {
            this.bbox = this.computeBoundingBox();
            
            // Adds tolerance for hover
            if (this.bbox != null)
            {
                this.bbox.grow(10);
            }
        }
    }
};

/**
 * 
 */
HoverIcons.prototype.computeBoundingBox = function()
{
    var bbox = (!this.graph.model.isEdge(this.currentState.cell)) ? mxRectangle.fromRectangle(this.currentState) : null;
    
    this.visitNodes(function(elt)
    {
        if (elt.parentNode != null)
        {
            var tmp = new mxRectangle(elt.offsetLeft, elt.offsetTop, elt.offsetWidth, elt.offsetHeight);
            
            if (bbox == null)
            {
                bbox = tmp;
            }
            else
            {
                bbox.add(tmp);
            }
        }
    });
    
    return bbox;
};

/**
 * 
 */
HoverIcons.prototype.getState = function(state)
{
    if (state != null)
    {
        var cell = state.cell;
        
        if (!this.graph.getModel().contains(cell))
        {
            state = null;
        }
        else
        {
            // Uses connectable parent vertex if child is not connectable
            if (this.graph.getModel().isVertex(cell) && !this.graph.isCellConnectable(cell))
            {
                var parent = this.graph.getModel().getParent(cell);
                
                if (this.graph.getModel().isVertex(parent) && this.graph.isCellConnectable(parent))
                {
                    cell = parent;
                }
            }
            
            // Ignores locked cells and edges
            if (this.graph.isCellLocked(cell) || this.graph.model.isEdge(cell))
            {
                cell = null;
            }
            
            state = this.graph.view.getState(cell);
            
            if (state != null && state.style == null)
            {
                state = null;
            }
        }
    }
    
    return state;
};

/**
 * 
 */
HoverIcons.prototype.update = function(state, x, y)
{
    if (!this.connectionArrowsEnabled || (state != null &&
        mxUtils.getValue(state.style, 'allowArrows', '1') == '0'))
    {
        this.reset();
    }
    else
    {
        if (state != null && state.cell.geometry != null && state.cell.geometry.relative &&
            this.graph.model.isEdge(state.cell.parent))
        {
            state = null;
        }
        
        var timeOnTarget = null;
        
        // Time on target
        if (this.prev != state || this.isActive())
        {
            this.startTime = new Date().getTime();
            this.prev = state;
            timeOnTarget = 0;
    
            if (this.updateThread != null)
            {
                window.clearTimeout(this.updateThread);
            }
            
            if (state != null)
            {
                // Starts timer to update current state with no mouse events
                this.updateThread = window.setTimeout(mxUtils.bind(this, function()
                {
                    if (!this.isActive() && !this.graph.isMouseDown &&
                        !this.graph.panningHandler.isActive())
                    {
                        this.prev = state;
                        this.update(state, x, y);
                    }
                }), this.updateDelay + 10);
            }
        }
        else if (this.startTime != null)
        {
            timeOnTarget = new Date().getTime() - this.startTime;
        }
        
        this.setDisplay('');
        
        if (this.currentState != null && this.currentState != state && timeOnTarget < this.activationDelay &&
            this.bbox != null && !mxUtils.contains(this.bbox, x, y))
        {
            this.reset(false);
        }
        else if (this.currentState != null || timeOnTarget > this.activationDelay)
        {
            if (this.currentState != state && ((timeOnTarget > this.updateDelay && state != null) ||
                this.bbox == null || x == null || y == null || !mxUtils.contains(this.bbox, x, y)))
            {
                if (state != null && this.graph.isEnabled())
                {
                    this.removeNodes();
                    this.setCurrentState(state);
                    this.repaint();
                    
                    // Resets connection points on other focused cells
                    if (this.graph.connectionHandler.constraintHandler.currentFocus != state)
                    {
                        this.graph.connectionHandler.constraintHandler.reset();
                    }
                }
                else
                {
                    this.reset();
                }
            }
        }
    }
};

/**
 * 
 */
HoverIcons.prototype.setCurrentState = function(state)
{
    if (state.style['portConstraint'] != 'eastwest')
    {
        this.graph.container.appendChild(this.arrowUp);
        this.graph.container.appendChild(this.arrowDown);
    }

    this.graph.container.appendChild(this.arrowRight);
    this.graph.container.appendChild(this.arrowLeft);
    this.currentState = state;
};

/**
 * Selects cells for connect vertex return value.
 */
HoverIcons.prototype.selectCellsForConnectVertex = function(cells, evt, hoverIcons)
{
    // Selects only target vertex if one exists
    if (cells.length == 2 && this.graph.model.isVertex(cells[1]))
    {
        this.graph.setSelectionCell(cells[1]);
        this.graph.scrollCellToVisible(cells[1]);
        
        if (hoverIcons != null)
        {
            // Adds hover icons for cloned vertex or hides icons
            if (mxEvent.isTouchEvent(evt))
            {
                hoverIcons.update(hoverIcons.getState(this.graph.view.getState(cells[1])));
            }
            else
            {
                hoverIcons.reset();
            }
        }
    }
    else
    {
        this.graph.setSelectionCells(cells);
    }
};

/**
 * Adds meta-drag an Mac.
 * @param evt
 * @returns
 */
HoverIcons.prototype.isCloneEvent = function(evt)
{
    return (mxClient.IS_MAC && mxEvent.isMetaDown(evt)) || mxEvent.isControlDown(evt);
};

/**
 * Function: getCellAt
 * 
 * Needs to modify original method for recursive call.
 */
HoverIcons.prototype.getCellAt = function(x, y, parent, vertices, edges, ignoreFn)
{
    if (this.graph.useCssTransforms)
    {
        x = x / this.graph.currentScale - this.graph.currentTranslate.x;
        y = y / this.graph.currentScale - this.graph.currentTranslate.y;
    }
    
    return this.graph.getScaledCellAt.apply(this.graph, arguments);
};

/**
 * Returns true if the given cell is a table cell.
 */
HoverIcons.prototype.isTableCell = function(cell)
{
	return this.graph.model.isVertex(cell) && this.isTableRow(this.graph.model.getParent(cell));
};

/**
 * Returns true if the given cell is a table row.
 */
HoverIcons.prototype.isTableRow = function(cell)
{
	return this.graph.model.isVertex(cell) && this.isTable(this.graph.model.getParent(cell));
};

/**
 * Returns true if the given cell is a table.
 */
HoverIcons.prototype.isTable = function(cell)
{
	var style = this.graph.getCellStyle(cell);
	
	return style != null && style['childLayout'] == 'tableLayout';
};

/**
 * Returns the first parent that is not a part.
 */
HoverIcons.prototype.getCompositeParent = function(cell)
{
	while (this.graph.isPart(cell))
	{
		var temp = this.graph.model.getParent(cell);
		
		if (!this.graph.model.isVertex(temp))
		{
			break;
		}
		
		cell = temp;
	}
	
	return cell;
};


/**
 * Never connects children in stack layouts or tables.
 */
HoverIcons.prototype.isCloneConnectSource = function(source)
{
	var layout = null;

	if (this.graph.layoutManager != null)
	{
		layout = this.graph.layoutManager.getLayout(this.graph.model.getParent(source));
	}
	
	return this.isTableRow(source) || this.isTableCell(source) ||
		(layout != null && layout.constructor == mxStackLayout);
};


/**
 * Adds a connection to the given vertex.
 */
HoverIcons.prototype.connectVertex = function(source, direction, length, evt, forceClone, ignoreCellAt, createTarget, done)
{	
	ignoreCellAt = (ignoreCellAt) ? ignoreCellAt : false;
	
	// Ignores relative edge labels
	if (source.geometry.relative && this.graph.model.isEdge(source.parent))
	{
		return [];
	}
	
	// Uses parent for relative child cells
	while (source.geometry.relative && this.graph.model.isVertex(source.parent))
	{
		source = source.parent;
	}
	
	// Handles clone connect sources
	var cloneSource = this.isCloneConnectSource(source);
	var composite = (cloneSource) ? source : this.getCompositeParent(source);
	
	var pt = (source.geometry.relative && source.parent.geometry != null) ?
		new mxPoint(source.parent.geometry.width * source.geometry.x,
			source.parent.geometry.height * source.geometry.y) :
		new mxPoint(composite.geometry.x, composite.geometry.y);
		
	if (direction == mxConstants.DIRECTION_NORTH)
	{
		pt.x += composite.geometry.width / 2;
		pt.y -= length ;
	}
	else if (direction == mxConstants.DIRECTION_SOUTH)
	{
		pt.x += composite.geometry.width / 2;
		pt.y += composite.geometry.height + length;
	}
	else if (direction == mxConstants.DIRECTION_WEST)
	{
		pt.x -= length;
		pt.y += composite.geometry.height / 2;
	}
	else
	{
		pt.x += composite.geometry.width + length;
		pt.y += composite.geometry.height / 2;
	}

	var parentState = this.graph.view.getState(this.graph.model.getParent(source));
	var s = this.graph.view.scale;
	var t = this.graph.view.translate;
	var dx = t.x * s;
	var dy = t.y * s;
	
	if (parentState != null && this.graph.model.isVertex(parentState.cell))
	{
		dx = parentState.x;
		dy = parentState.y;
	}

	// Workaround for relative child cells
	if (this.graph.model.isVertex(source.parent) && source.geometry.relative)
	{
		pt.x += source.parent.geometry.x;
		pt.y += source.parent.geometry.y;
	}
	
	// Checks actual end point of edge for target cell
	var rect = (!ignoreCellAt) ? new mxRectangle(dx + pt.x * s, dy + pt.y * s).grow(40) : null;
	var tempCells = (rect != null) ? this.graph.getCells(0, 0, 0, 0, null, null, rect) : null;
	var target = (tempCells != null && tempCells.length > 0) ? tempCells.reverse()[0] : null;
	var keepParent = false;
	
	if (target != null && this.graph.model.isAncestor(target, source))
	{
		keepParent = true;
		target = null;
	}
	
	// Checks for swimlane at drop location
	if (target == null)
	{
		var temp = this.graph.getSwimlaneAt(dx + pt.x * s, dy + pt.y * s);
		
		if (temp != null)
		{
			keepParent = false;
			target = temp;
		}
	}
	
	// Checks if target or ancestor is locked
	var temp = target;
	
	while (temp != null)
	{
		if (this.graph.isCellLocked(temp))
		{
			target = null;
			break;
		}
		
		temp = this.graph.model.getParent(temp);
	}
	
	// Checks if source and target intersect
	if (target != null)
	{
		var sourceState = this.graph.view.getState(source);
		var targetState = this.graph.view.getState(target);
		
		if (sourceState != null && targetState != null && mxUtils.intersects(sourceState, targetState))
		{
			target = null;
		}
	}
	
	var duplicate = (!mxEvent.isShiftDown(evt) || mxEvent.isControlDown(evt)) || forceClone;
	
	if (duplicate)
	{
		if (direction == mxConstants.DIRECTION_NORTH)
		{
			pt.y -= source.geometry.height / 2;
		}
		else if (direction == mxConstants.DIRECTION_SOUTH)
		{
			pt.y += source.geometry.height / 2;
		}
		else if (direction == mxConstants.DIRECTION_WEST)
		{
			pt.x -= source.geometry.width / 2;
		}
		else
		{
			pt.x += source.geometry.width / 2;
		}
	}

	// Uses connectable parent vertex if one exists
	// TODO: Fix using target as parent for swimlane
	if (target != null && !this.graph.isCellConnectable(target) && !this.graph.isSwimlane(target))
	{
		var parent = this.graph.getModel().getParent(target);
		
		if (this.graph.getModel().isVertex(parent) && this.graph.isCellConnectable(parent))
		{
			target = parent;
		}
	}
	
	if (target == source || this.graph.model.isEdge(target) ||
		!this.graph.isCellConnectable(target) &&
		!this.graph.isSwimlane(target))
	{
		target = null;
	}
	
	var result = [];
	var swimlane = target != null && this.graph.isSwimlane(target);
	var realTarget = (!swimlane) ? target : null;

	var execute = mxUtils.bind(this.graph, function(targetCell)
	{
		if (createTarget == null || targetCell != null || (target == null && cloneSource))
		{
			this.model.beginUpdate();
			try
			{
				if (realTarget == null && duplicate)
				{
					// Handles relative children
					var cellToClone = (targetCell != null) ? targetCell : source;
					var geo = this.getCellGeometry(cellToClone);
					
					while (geo != null && geo.relative)
					{
						cellToClone = this.getModel().getParent(cellToClone);
						geo = this.getCellGeometry(cellToClone);
					}
					
					// Handles composite cells for cloning
					cellToClone =  (cloneSource) ? source : this.getCompositeParent(cellToClone);
					realTarget = (targetCell != null) ? targetCell : this.duplicateCells([cellToClone], false)[0];
					
					if (targetCell != null)
					{
						this.addCells([realTarget], this.model.getParent(source), null, null, null, true);
					}
					
					var geo = this.getCellGeometry(realTarget);
	
					if (geo != null)
					{
						geo.x = pt.x - geo.width / 2;
						geo.y = pt.y - geo.height / 2;
					}
					
					if (swimlane)
					{
						this.addCells([realTarget], target, null, null, null, true);
						target = null;
					}
					else if (duplicate && target == null && !keepParent && !cloneSource)
					{
						this.addCells([realTarget], this.getDefaultParent(), null, null, null, true);
					}
				}
				
				var edge = ((mxEvent.isControlDown(evt) && mxEvent.isShiftDown(evt) && duplicate) ||
					(target == null && cloneSource)) ? null : this.insertEdge(this.model.getParent(source),
						null, '', source, realTarget, this.createCurrentEdgeStyle());
		
				// Inserts edge before source
				if (edge != null && this.connectionHandler.insertBeforeSource)
				{
					var index = null;
					var tmp = source;
					
					while (tmp.parent != null && tmp.geometry != null &&
						tmp.geometry.relative && tmp.parent != edge.parent)
					{
						tmp = this.model.getParent(tmp);
					}
				
					if (tmp != null && tmp.parent != null && tmp.parent == edge.parent)
					{
						var index = tmp.parent.getIndex(tmp);
						this.model.add(tmp.parent, edge, index);
					}
				}
				
				// Special case: Click on west icon puts clone before cell
				if (target == null && realTarget != null && source.parent != null &&
					cloneSource && direction == mxConstants.DIRECTION_WEST)
				{
					var index = source.parent.getIndex(source);
					this.model.add(source.parent, realTarget, index);
				}
				
				if (edge != null)
				{
					result.push(edge);
				}
				
				if (target == null && realTarget != null)
				{
					result.push(realTarget);
				}
				
				if (realTarget == null && edge != null)
				{
					edge.geometry.setTerminalPoint(pt, false);
				}
				
				if (edge != null)
				{
					this.fireEvent(new mxEventObject('cellsInserted', 'cells', [edge]));
				}
			}
			finally
			{
				this.model.endUpdate();
			}
		}
			
		if (done != null)
		{
			done(result);
		}
		else
		{
			return result;
		}
	});
	
	if (createTarget != null && realTarget == null && duplicate &&
		(target != null || !cloneSource))
	{
		createTarget(dx + pt.x * s, dy + pt.y * s, execute);
	}
	else
	{
		return execute(realTarget);
	}
};


/**
 * These overrides are only added if mxVertexHandler is defined (ie. not in embedded graph)
 */
if (typeof mxVertexHandler != 'undefined')
{
    (function()
    {
        /**
         * Defines the handles for the UI. Uses data-URIs to speed-up loading time where supported.
         */
        // TODO: Increase handle padding
        HoverIcons.prototype.mainHandle = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/handle-main.png', 17, 17) :
            HoverIcons.prototype.createSvgImage(18, 18, '<circle cx="9" cy="9" r="5" stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '" stroke-width="1"/>');
        HoverIcons.prototype.secondaryHandle = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/handle-secondary.png', 17, 17) :
            HoverIcons.prototype.createSvgImage(16, 16, '<path d="m 8 3 L 13 8 L 8 13 L 3 8 z" stroke="#fff" fill="#fca000"/>');
        HoverIcons.prototype.fixedHandle = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/handle-fixed.png', 17, 17) :
            HoverIcons.prototype.createSvgImage(18, 18, '<circle cx="9" cy="9" r="5" stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '" stroke-width="1"/><path d="m 7 7 L 11 11 M 7 11 L 11 7" stroke="#fff"/>');
        HoverIcons.prototype.terminalHandle = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/handle-terminal.png', 17, 17) :
            HoverIcons.prototype.createSvgImage(18, 18, '<circle cx="9" cy="9" r="5" stroke="#fff" fill="' + HoverIcons.prototype.arrowFill + '" stroke-width="1"/><circle cx="9" cy="9" r="2" stroke="#fff" fill="transparent"/>');
        HoverIcons.prototype.rotationHandle = (!mxClient.IS_SVG) ? new mxImage(IMAGE_PATH + '/handle-rotate.png', 16, 16) :
            HoverIcons.prototype.createSvgImage(16, 16, '<path stroke="' + HoverIcons.prototype.arrowFill +
                '" fill="' + HoverIcons.prototype.arrowFill +
                '" d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/>',
                24, 24);
        
        if (mxClient.IS_SVG)
        {
            mxConstraintHandler.prototype.pointImage = HoverIcons.prototype.createSvgImage(5, 5, '<path d="m 0 0 L 5 5 M 0 5 L 5 0" stroke="' + HoverIcons.prototype.arrowFill + '"/>');
        }
        
        mxVertexHandler.TABLE_HANDLE_COLOR = '#fca000';
        mxVertexHandler.prototype.handleImage = HoverIcons.prototype.mainHandle;
        mxVertexHandler.prototype.secondaryHandleImage = HoverIcons.prototype.secondaryHandle;
        mxEdgeHandler.prototype.handleImage = HoverIcons.prototype.mainHandle;
        mxEdgeHandler.prototype.terminalHandleImage = HoverIcons.prototype.terminalHandle;
        mxEdgeHandler.prototype.fixedHandleImage = HoverIcons.prototype.fixedHandle;
        mxEdgeHandler.prototype.labelHandleImage = HoverIcons.prototype.secondaryHandle;
        mxOutline.prototype.sizerImage = HoverIcons.prototype.mainHandle;
        
        if (window.Sidebar != null)
        {
            Sidebar.prototype.triangleUp = HoverIcons.prototype.triangleUp;
            Sidebar.prototype.triangleRight = HoverIcons.prototype.triangleRight;
            Sidebar.prototype.triangleDown = HoverIcons.prototype.triangleDown;
            Sidebar.prototype.triangleLeft = HoverIcons.prototype.triangleLeft;
            Sidebar.prototype.refreshTarget = HoverIcons.prototype.refreshTarget;
            Sidebar.prototype.roundDrop = HoverIcons.prototype.roundDrop;
        }

        // Pre-fetches images (only needed for non data-uris)
        if (!mxClient.IS_SVG)
        {
            new Image().src = HoverIcons.prototype.mainHandle.src;
            new Image().src = HoverIcons.prototype.fixedHandle.src;
            new Image().src = HoverIcons.prototype.terminalHandle.src;
            new Image().src = HoverIcons.prototype.secondaryHandle.src;
            new Image().src = HoverIcons.prototype.rotationHandle.src;
            
            new Image().src = HoverIcons.prototype.triangleUp.src;
            new Image().src = HoverIcons.prototype.triangleRight.src;
            new Image().src = HoverIcons.prototype.triangleDown.src;
            new Image().src = HoverIcons.prototype.triangleLeft.src;
            new Image().src = HoverIcons.prototype.refreshTarget.src;
            new Image().src = HoverIcons.prototype.roundDrop.src;
        }
        
    })();
}
