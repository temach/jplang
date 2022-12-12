/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 */
MoonspeakLibrary = function(ui, data, meta)
{
	MoonspeakFile.call(this, ui, data, meta);
};

//Extends mxEventSource
mxUtils.extend(MoonspeakLibrary, MoonspeakFile);

/**
 * Overridden to avoid updating data with current file.
 */
MoonspeakLibrary.prototype.doSave = function(title, success, error)
{
	this.saveFile(title, false, success, error);
};

/**
 * Returns the location as a new object.
 * @type mx.Point
 */
MoonspeakLibrary.prototype.open = function()
{
	// Do nothing - this should never be called
};
