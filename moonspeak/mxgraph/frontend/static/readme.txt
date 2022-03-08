===================
The event loop in `mxGraph.prototype.fireMouseEvent = function(evtName, me, sender)` invokes all mouse related handlers.

===================
To make right mouse button a panning-only button, need to change XXX.prototype.mouseDown.

XXX.prototype.mouseDown for the following XXX:

1. mxTooltipHandler
2. mxSelectionCellsHandler
3. mxConnectionHandler
4. mxGraphHandler

To make sure they dont consume pointerdown events which have button==2
Then the event will be processed by the 5th listener: mxPanningHandler

===================

