See the even loop in `mxGraph.prototype.fireMouseEvent = function(evtName, me, sender)`

Need to change the XXX.prototype.mouseDown for the following XXX:

1. constructor: function mxTooltipHandler(graph, delay)
2. constructor: function mxSelectionCellsHandler(graph)
3. mxConnectionHandler
4. mxGraphHandler

To make sure they dont consume pointerdown events which have button==2
Then the event will be processed by the 5th listener: mxPanningHandler
