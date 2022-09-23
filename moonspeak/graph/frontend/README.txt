To view translation keys and disable splash on draw.io use:`
```
https://app.diagrams.net/?lang=i18n&splash=0
```

to set ui, use ui=sketch url parameter


mxClient.4.2.2.js
72139-				// Forces repaint even if not moved to update pointer events
72140-				state.shape.bounds = null;



Looks like there are a few ways to lock the elements:

// edgeStyle[mxConstants.STYLE_POINTER_EVENTS] = 'none';
// edgeStyle["locked"] = '1';
// edgeStyle[mxConstants.STYLE_EDITABLE] = 0;
the same can be applied to default vertexStyle.

OR

// mxShape.prototype.svgPointerEvents = 'none';
