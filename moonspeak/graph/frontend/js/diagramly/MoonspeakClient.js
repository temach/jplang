/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 */
MoonspeakClient = function(editorUi)
{
	DrawioClient.call(this, editorUi, 'moonspeakauth');
};

// Extends DrawioClient
mxUtils.extend(MoonspeakClient, DrawioClient);

MoonspeakClient.prototype.baseUrl = 'save';

MoonspeakClient.prototype.SEPARATOR = '|$|';

/**
 * Maximum attachment size of Moonspeak.
 */
MoonspeakClient.prototype.maxFileSize = 10000000 /*10MB*/;

/**
 * Default extension for new files.
 */
MoonspeakClient.prototype.extension = '.xml'; //TODO export to png

/**
 * Authorizes the client, used with methods that can be called without a user click and popup blockers will interfere
 * Show the AuthDialog to work around the popup blockers if the file is opened directly
 */
MoonspeakClient.prototype.authenticate = function(success, error, force)
{
    // always successful
    success();
}

/**
 * 
 */
MoonspeakClient.prototype.getLibrary = function(id, success, error)
{
	this.getFile(id, success, error, false, true);
};

/**
 * 
 */
MoonspeakClient.prototype.getFile = function(id, success, error, denyConvert, asLibrary)
{
	asLibrary = (asLibrary != null) ? asLibrary : false;

	var callback = mxUtils.bind(this, function()
	{
		var ids = id.split(this.SEPARATOR);
		var acceptResponse = true;
		
        // let getGraph = (url, graph, uuid) => {
        //     mxUtils.get(url + '?' + 'uuid=' + encodeURIComponent(uuid), function(req)
        //     {
        //         var node = req.getDocumentElement();
        //         var dec = new mxCodec(node.ownerDocument);
        //         dec.decode(node, graph.getModel());

        //         for (var index in graph.model.cells) {
        //             let cell = graph.model.cells[index];
        //             var style = graph.getCurrentCellStyle(cell);
        //             if (style && style['iframe'] == '1') {
        //                 registerChildIframe(cell.value);
        //             }
        //         }

        //         for (var index in graph.model.cells) {
        //             let cell = graph.model.cells[index];
        //             if (cell.edge) {
        //                 let edge = cell;
        //                 let source = graph.model.getTerminal(edge, true);
        //                 let target = graph.model.getTerminal(edge, false);

        //                 // interconnect them both ways
        //                 addObserver(source.value, target.value);
        //                 addObserver(target.value, source.value);
        //             }
        //         }

        //         // Stores ID for saving
        //         graph.uuid = uuid;
        //     });
        // }
        // getGraph(OPEN_URL, graph, graph.uuid);

        let headers = {};
        let binary = false;
        let graph_uuid = 'default';
            
        timeoutThread = window.setTimeout(mxUtils.bind(this, function()
        {
            acceptResponse = false;
            error({code: App.ERROR_TIMEOUT, retry: callback})
        }), this.ui.timeout);
        
        this.ui.editor.loadUrl(OPEN_URL + '?uuid=' + encodeURIComponent(graph_uuid), mxUtils.bind(this, function(data)
        {
            window.clearTimeout(timeoutThread);
            
            if (acceptResponse)
            {
                let meta = {
                    "uuid": graph_uuid,
                };

                if (asLibrary)
                {
                    success(new MoonspeakLibrary(this.ui, data, meta));
                }
                else
                {
                    success(new MoonspeakFile(this.ui, data, meta));
                }
            }
        }), mxUtils.bind(this, function(err, req)
        {
            window.clearTimeout(timeoutThread);
                
            if (acceptResponse)
            {
                if (req.status == 401)
                {
                    this.authenticate(callback, error, true);
                }
                else
                {
                    error();
                }
            }
        }), binary, null, null, null, headers);

	});
	
	this.authenticate(callback, error);
};

/**
 * 
 */
MoonspeakClient.prototype.insertLibrary = function(filename, data, success, error, cardId)
{
	this.insertFile(filename, data, success, error, true, cardId);
};

/**
 * 
 */
MoonspeakClient.prototype.insertFile = function(filename, data, success, error, asLibrary, cardId)
{
	asLibrary = (asLibrary != null) ? asLibrary : false;
	
	var callback = mxUtils.bind(this, function()
	{
		var fn = mxUtils.bind(this, function(fileData)
		{
			this.writeFile(filename, fileData, cardId, mxUtils.bind(this, function(meta)
			{
				if (asLibrary)
				{
					success(new MoonspeakLibrary(this.ui, data, meta));
				}
				else
				{
					success(new MoonspeakFile(this.ui, data, meta));
				}
			}), error);
		});
						
		if (this.ui.useCanvasForExport && /(\.png)$/i.test(filename))
		{
			this.ui.getEmbeddedPng(mxUtils.bind(this, function(pngData)
			{
				fn(this.ui.base64ToBlob(pngData, 'image/png'));
			}), error, data);
		}
		else
		{
			fn(data);
		}
	});
	
	this.authenticate(callback, error);
};

/**
 * 
 */
MoonspeakClient.prototype.saveFile = function(file, success, error)
{
	// write the file first (with the same name), then delete the old file
	// so that nothing is lost if something goes wrong with deleting
	var ids = file.meta.compoundId.split(this.SEPARATOR);

	var fn = mxUtils.bind(this, function(data)
	{
		this.writeFile(file.meta.name, data, ids[0], function(meta)
		{
			Moonspeak.del('cards/' + ids[0] + '/attachments/' + ids[1], mxUtils.bind(this, function()
			{
				success(meta);
			}), mxUtils.bind(this, function(err)
			{
				if (err != null && err.status == 401)
	    		{
					// KNOWN: Does not wait for popup to close for callback
	    			this.authenticate(callback, error, true);
	    		}
	    		else
	    		{
	    			error();
	    		}
			}));
		}, error);
	});
	
	var callback = mxUtils.bind(this, function()
	{
		if (this.ui.useCanvasForExport && /(\.png)$/i.test(file.meta.name))
		{
			this.ui.getEmbeddedPng(mxUtils.bind(this, function(data)
			{
				fn(this.ui.base64ToBlob(data, 'image/png'));
			}), error, (this.ui.getCurrentFile() != file) ? file.getData() : null);
		}
		else
		{
			fn(file.getData());
		}
	});
	
	this.authenticate(callback, error);
};

/**
 * 
 */
MoonspeakClient.prototype.writeFile = function(filename, data, cardId, success, error)
{
	if (filename != null && data != null)
	{
		if (data.length >= this.maxFileSize)
		{
			error({message: mxResources.get('drawingTooLarge') + ' (' +
				this.ui.formatFileSize(data.length) + ' / 10 MB)'});
			
			return;
		}
		
		var fn = mxUtils.bind(this, function()
		{
		  var acceptResponse = true;
			
		  var timeoutThread = window.setTimeout(mxUtils.bind(this, function()
		  {
			acceptResponse = false;
			error({code: App.ERROR_TIMEOUT, retry: fn});
		  }), this.ui.timeout);
			
		  var formData = new FormData();
		  formData.append('key', Moonspeak.key());
		  formData.append('token', Moonspeak.token());
		  formData.append('file', typeof data === 'string' ? new Blob([data]) : data, filename);
		  formData.append('name', filename);

		  var request = new XMLHttpRequest();
		  request.responseType = 'json';
		  
		  request.onreadystatechange = mxUtils.bind(this, function() 
		  {
		    if (request.readyState === 4)
		    {
		    	window.clearTimeout(timeoutThread);
		    	
		    	if (acceptResponse)
	    		{
		    		if (request.status == 200)
	    			{
		    			var fileMeta = request.response;
		    			fileMeta.compoundId = cardId + this.SEPARATOR + fileMeta.id
		    			success(fileMeta);
	    			}
		    		else if (request.status == 401)
		    		{
		    			this.authenticate(fn, error, true);
		    		}
	    			else
    				{
		    			error();
    				}
	    		}
		    }
		  });
		  
		  request.open('POST', this.baseUrl + 'cards/' + cardId + '/attachments');
		  request.send(formData);
		});
		
		this.authenticate(fn, error);
	}
	else
	{
		error({message: mxResources.get('unknownError')});
	}
};

/**
 * Checks if the client is authorized and calls the next step.
 */
MoonspeakClient.prototype.pickLibrary = function(fn)
{
	this.pickFile(fn);
};

/**
 * 
 */
MoonspeakClient.prototype.pickFolder = function(fn)
{
	this.authenticate(mxUtils.bind(this, function()
	{
	  	// show file select
		this.showMoonspeakDialog(false, fn);
	}), mxUtils.bind(this, function(e)
	{
		this.ui.showError(mxResources.get('error'), e);
	}));
};

/**
 * Checks if the client is authorized and calls the next step.
 */
MoonspeakClient.prototype.pickFile = function(fn, returnObject)
{
	fn = (fn != null) ? fn : mxUtils.bind(this, function(id)
	{
		this.ui.loadFile('T' + encodeURIComponent(id));
	});

	this.authenticate(mxUtils.bind(this, function()
	{
	  	// show file select
		this.showMoonspeakDialog(true, fn);
	}), mxUtils.bind(this, function(e)
	{
		this.ui.showError(mxResources.get('error'), e, mxResources.get('ok'));
	}));
};


/**
 * 
 */
MoonspeakClient.prototype.showMoonspeakDialog = function(showFiles, fn)
{
	var cardId = null;
	var filter = '@me';
	var linkCounter = 0;
	
	var content = document.createElement('div');
	content.style.whiteSpace = 'nowrap';
	content.style.overflow = 'hidden';
	content.style.height = '224px';

	var hd = document.createElement('h3');
	mxUtils.write(hd, showFiles? mxResources.get('selectFile') : mxResources.get('selectCard'));
	hd.style.cssText = 'width:100%;text-align:center;margin-top:0px;margin-bottom:12px';
	content.appendChild(hd);

	var div = document.createElement('div');
	div.style.whiteSpace = 'nowrap';
	div.style.overflow = 'auto';
	div.style.height = '194px';
	content.appendChild(div);

	var dlg = new CustomDialog(this.ui, content);
	this.ui.showDialog(dlg.container, 340, 290, true, true);
	
	dlg.okButton.parentNode.removeChild(dlg.okButton);
	
	var createLink = mxUtils.bind(this, function(label, fn, preview)
	{
		linkCounter++;
		var div = document.createElement('div');
		div.style = 'width:100%;text-overflow:ellipsis;overflow:hidden;vertical-align:middle;' +
			'padding:2px 0 2px 0;background:' + (linkCounter % 2 == 0?
			((Editor.isDarkMode()) ? '#000' : '#eee') :
			((Editor.isDarkMode()) ? '' : '#fff'));
		var link = document.createElement('a');
		link.style.cursor = 'pointer';
		
		if (preview != null)
		{
			var img = document.createElement('img');
			img.src = preview.url;
			img.width = preview.width;
			img.height= preview.height;
			img.style= "border: 1px solid black;margin:5px;vertical-align:middle"
			link.appendChild(img);
		}
		
		mxUtils.write(link,  label);
		mxEvent.addListener(link, 'click', fn);
		
		div.appendChild(link);
		
		return div;
	});
	
	var error = mxUtils.bind(this, function(err)
	{
		this.ui.handleError(err, null, mxUtils.bind(this, function()
		{
			this.ui.spinner.stop();
			this.ui.hideDialog();
		}));
	});

	var selectAtt = mxUtils.bind(this, function()
	{
		linkCounter = 0;
		div.innerText = '';
		this.ui.spinner.spin(div, mxResources.get('loading'));
		
		var callback = mxUtils.bind(this, function()
		{
			Moonspeak.cards.get(cardId + '/attachments', {fields: 'id,name,previews'}, mxUtils.bind(this, function(data)
			{
				this.ui.spinner.stop();
				var files = data;
				div.appendChild(createLink('../ [Up]', mxUtils.bind(this, function()
				{
					selectCard();
				})));
				mxUtils.br(div);
	
				if (files == null || files.length == 0)
				{
					mxUtils.write(div, mxResources.get('noFiles'));
				}
				else
				{
					var listFiles = mxUtils.bind(this, function()
					{
						for (var i = 0; i < files.length; i++)
						{
							(mxUtils.bind(this, function(file)
							{
								div.appendChild(createLink(file.name, mxUtils.bind(this, function()
								{
									this.ui.hideDialog();
									fn(cardId + this.SEPARATOR + file.id);
								}), file.previews != null? file.previews[0] : null));
							}))(files[i]);
						}
					});
					
					listFiles();
				}
			}),
			mxUtils.bind(this, function(req)
			{
	    		if (req.status == 401)
	    		{
	    			this.authenticate(callback, error, true);
	    		}
	    		else if (error != null)
	    		{
	    			error(req);
	    		}	
			}));
		});
		
		callback();
	});
	
	// Adds paging for cards (files limited to 1000 by API)
	var pageSize = 100;
	var nextPageDiv = null;
	var scrollFn = null;

	var selectCard = mxUtils.bind(this, function(page)
	{
		if (page == null)
		{
			linkCounter = 0;
			div.innerText = '';
			page = 1;
		}
		
		this.ui.spinner.spin(div, mxResources.get('loading'));
		
		if (nextPageDiv != null && nextPageDiv.parentNode != null)
		{
			nextPageDiv.parentNode.removeChild(nextPageDiv);
		}
		
		nextPageDiv = document.createElement('a');
		nextPageDiv.style.display = 'block';
		nextPageDiv.style.cursor = 'pointer';
		mxUtils.write(nextPageDiv, mxResources.get('more') + '...');
		
		var nextPage = mxUtils.bind(this, function()
		{
			mxEvent.removeListener(div, 'scroll', scrollFn);
			selectCard(page + 1);
		});
		
		mxEvent.addListener(nextPageDiv, 'click', nextPage);
		
		var callback = mxUtils.bind(this, function()
		{
			Moonspeak.get('search', {
				'query': (mxUtils.trim(filter) == '') ? 'is:open' : filter,
				'cards_limit': pageSize,
				'cards_page': page-1
			},
			mxUtils.bind(this, function(data)
			{
				this.ui.spinner.stop();
				var cards = (data != null) ? data.cards : null;
				
				if (cards == null || cards.length == 0)
				{
					mxUtils.write(div, mxResources.get('noFiles'));
				}
				else
				{
					if (page == 1)
					{
						div.appendChild(createLink(mxResources.get('filterCards') + '...', mxUtils.bind(this, function()
						{
							var dlg = new FilenameDialog(this.ui, filter, mxResources.get('ok'), mxUtils.bind(this, function(value)
							{
								if (value != null)
								{
									filter = value;
									selectCard();
								}
							}), mxResources.get('filterCards'), null, null, 'http://help.trello.com/article/808-searching-for-cards-all-boards');
							this.ui.showDialog(dlg.container, 300, 80, true, false);
							dlg.init();
						})));
						
						mxUtils.br(div);
					}
					
					for (var i = 0; i < cards.length; i++)
					{
						(mxUtils.bind(this, function(card)
						{
							div.appendChild(createLink(card.name, mxUtils.bind(this, function()
							{
								if (showFiles)
								{
									cardId = card.id;
									selectAtt();
								}
								else
								{
									this.ui.hideDialog();
									fn(card.id);
								}
							})));
						}))(cards[i]);
					}
	
					if (cards.length == pageSize)
					{
						div.appendChild(nextPageDiv);
						
						scrollFn = function()
						{
							if (div.scrollTop >= div.scrollHeight - div.offsetHeight)
							{
								nextPage();
							}
						};
						
						mxEvent.addListener(div, 'scroll', scrollFn);
					}
				}
			}),
			mxUtils.bind(this, function(req)
			{
	    		if (req.status == 401)
	    		{
	    			this.authenticate(callback, error, true);
	    		}
	    		else if (error != null)
	    		{
	    			error({message: req.responseText});
	    		}	
			}));
		});
		
		callback();
	});
	
	selectCard();
};

/**
 * Checks if the client is authorized
 */
MoonspeakClient.prototype.isAuthorized = function()
{
	//TODO this may break if Moonspeak client.js is changed
	try
	{
		return localStorage['moonspeak_token'] != null; //Moonspeak.authorized(); doesn't work unless authorize is called first
	}
	catch (e)
	{
		// ignores access denied
	}
	
	return false;
};


/**
 * Logout and deauthorize the user. 
 */
MoonspeakClient.prototype.logout = function()
{
	localStorage.removeItem('moonspeak_token');
	Moonspeak.deauthorize();
};
