EventDispatcher = {
    bind: function (eventName, eventListener, eventScope) {
        if(!this._eventListeners) {this._eventListeners = [];this._eventScopes = [];}
        if(!this._eventListeners[eventName]){this._eventListeners[eventName] = [];this._eventScopes[eventName] = [];}
        for(var i = 0; i < this._eventListeners[eventName].length; i++){
            if(this._eventScopes[eventName][i] == eventScope && this._eventListeners[eventName][i] == eventListener){
                return;
            }
        }
        this._eventListeners[eventName].push(eventListener);
        this._eventScopes[eventName].push(eventScope);
    },
    unbind: function (eventName, eventListener, eventScope){
        if(typeof this._eventScopes[eventName] == "undefined") return;
        for(var i = 0; i < this._eventListeners[eventName].length; i++){
            if(this._eventScopes[eventName][i] == eventScope && this._eventListeners[eventName][i] == eventListener){
                this._eventListeners[eventName].splice(i, 1);
                this._eventScopes[eventName].splice(i, 1);
                return;
            }
        }
    },
    trigger: function (eventName) {
        if(!this._eventListeners) return;
        var i;
		var event = {sender: this, type: eventName};
		
		if(arguments.length > 1 && typeof arguments[1] == 'object') $.extend(event, arguments[1]);
		
        for (i in this._eventListeners[eventName]){
            this._eventListeners[eventName][i].apply(this._eventScopes[eventName][i], [event]);
        }
    }
};


Component = {
	setModel: function(model){
		this._model = model;
		if(typeof this.modelPropertyChanged == 'function')
			this._model.bind(DBDesigner.Event.PROPERTY_CHANGED, this.modelPropertyChanged, this);
	},

	getModel: function(){
		if(typeof this._model == 'undefined') this._model = null;
		return this._model;
	},

	setUI: function(ui){
		this._ui = ui;
	},

	getUI: function(){
		if(typeof this._ui == 'undefined') this._ui = null;
		return this._ui; 
	}
};
$.extend(Component, EventDispatcher);
ComponentUI = {
	init: function(){
		var templateID = this.getTemplateID();
		if(templateID != null) this.setDom(DBDesigner.templateManager[templateID]);
		if(typeof this.bindEvents == 'function') this.bindEvents();
	},
	
	setTemplateID: function(templateID){
		this._templateID = templateID;
	},
	
	getTemplateID: function(){
		if(typeof this._templateID == 'undefined') this._templateID = null;
		return this._templateID;
	},
	
	setController: function(controller){
		this._controller = controller;
	},
	
	getController: function(){
		if(typeof this._controller == 'undefined') this._controller = null;
		return this._controller;
	},
	
	setDom: function(template){
		this._dom = $(template);
	},
	
	getDom: function(){
		if(typeof this._dom == 'undefined') this._dom = null;
		return this._dom;
	},
	
	find: function(selector){
		if(typeof this._dom == 'undefined') return $();
		return this.getDom().find(selector);
	}
};

ComponentModel = function(){};
$.extend(ComponentUI, EventDispatcher);



DBDesigner = function(data){
	
	
	this.setToolBar();
	this.setCanvas();
	this.setObjectDetail();
	this.setTableDialog();
	this.setTableCollection();
	this.setGlobalUIBehavior();
	
	//this.toolBar.setAction(globals.Action.ADD_TABLE);
	
};

/**
 * Initialize the toolbar
 */
DBDesigner.prototype.setToolBar = function(){
	this.toolBar = new ToolBar();
	this.toolBar.bind(DBDesigner.Event.PROPERTY_CHANGED, this.actionChanged, this);
	/*var a = {};
	a[DBDesigner.Action.SELECT] = true;
	this.toolBar.setActionState(a);*/
};

/**
 * Listener for changes on toolbar's properties
 */
DBDesigner.prototype.actionChanged = function(event){
	if(event.property == 'action'){
		switch(event.newValue){
			case DBDesigner.Action.ADD_TABLE:
				this.canvas.setCapturingPlacement(true);
				break;
			case DBDesigner.Action.SELECT:
				this.canvas.setCapturingPlacement(false);
				break;
		}
	}
};

/**
 * Initialize the canvas
 */
DBDesigner.prototype.setCanvas = function(){
	this.canvas = new Canvas();
	this.canvas.bind(Canvas.Event.PLACEMENT_CAPTURED, this.canvasPlacementCaptured, this);
};

DBDesigner.prototype.canvasPlacementCaptured = function(event){
	//this.tableDialog.getUI().getDom().dialog('open');
	this.toolBar.setAction(DBDesigner.Action.SELECT);
	this.tableDialog.createTable({top:event.top, left:event.left});
};


/**
 * Initialize the objectdetail
 */
DBDesigner.prototype.setObjectDetail = function(){
	this.objectDetail = new ObjectDetail();
	this.objectDetail.bind(DBDesigner.Event.PROPERTY_CHANGED, this.objectDetailChanged, this);
	this.objectDetail.setCollapsed(true);
};

/**
 * Listener for changes on objectDetail's properties
 */
DBDesigner.prototype.objectDetailChanged = function(event){
	switch(event.property){
		case 'collapsed':
			this.canvas.setCollapsed(!event.newValue);
			break;
	}
};

DBDesigner.prototype.setTableDialog = function() {
	this.tableDialog = new TableDialog();
};

DBDesigner.prototype.setTableCollection = function() {
	this.tableCollection = new TableCollection();
};

DBDesigner.prototype.setGlobalUIBehavior = function(){
	$('a.button').live('hover', function(event){ 
		var $this = $(this);
		if(!$this.hasClass('ui-state-disabled')) $this.toggleClass('ui-state-hover'); 
	});
};







DBDesigner.init = function(){
	DBDesigner.app = new DBDesigner();
};/**
 *
 * Class to manage the toolbar of the designer
 *
 */
ToolBar = function() {
	var model = new ToolBarModel();
	model.bind(DBDesigner.Event.PROPERTY_CHANGED, this.modelPropertyChanged, this);
	
	this.setModel(model);
	this.setUI(new ToolBarUI(this));
};

$.extend(ToolBar.prototype, Component);

ToolBar.prototype.setAction = function(action) {
	this.getModel().setAction(action);
};

ToolBar.prototype.getAction = function() {
	return this.getModel().getAction();
};

ToolBar.prototype.setActionState = function(actionState) {
	this.getModel().setActionState(actionState);
};

ToolBar.prototype.getActionState = function() {
	return this.getModel().getActionState();
};

ToolBar.prototype.modelPropertyChanged = function(event) {
	if(event.property == 'action') this.getUI().updateCurrentAction();
	else if(event.property == 'actionState') this.getUI().updateActionState();
	this.trigger(DBDesigner.Event.PROPERTY_CHANGED, event);	
}


// *****************************************************************************


/**
 *
 * The Toolbar Model
 *
 */
ToolBarModel = function(){
	this.setAction(DBDesigner.Action.SELECT);
	this.setActionState({});
};
$.extend(ToolBarModel.prototype, EventDispatcher);


ToolBarModel.prototype.setAction = function(action) {
	var old = this.getAction();
	if(old != action){
		this._action = action;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'action', oldValue: old, newValue: action});	
	}
};

ToolBarModel.prototype.getAction = function() {
	if(typeof this._action == 'undefined') this._action = DBDesigner.Action.SELECT;
	return this._action;
};

ToolBarModel.prototype.setActionState = function(actionState) {
	var _actionState = null;
	var old = this.getActionState();
	if(typeof this._actions == 'undefined'){
		_actionState = {};
		_actionState[DBDesigner.Action.SELECT] = true;
		_actionState[DBDesigner.Action.ADD_TABLE] = true;
		_actionState[DBDesigner.Action.ADD_COLUMN] = true;
		_actionState[DBDesigner.Action.ADD_FOREIGNKEY] = true
		_actionState[DBDesigner.Action.SAVE] = true;
		_actionState[DBDesigner.Action.DROP_TABLE] = false;
	}
	else _actionState = old;
	_actionState = $.extend(_actionState, actionState);
	if(_actionState != old){
		this._actionState = _actionState;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'actionState', oldValue: old, newValue: _actionState});	
	}
};

ToolBarModel.prototype.getActionState = function() {
	return this._actionState;
};


// *****************************************************************************


/**
 *
 * Toolbar View
 *
 */

ToolBarUI = function(controller){
	this.setTemplateID('ToolBar');
	this.setController(controller);
	this.init();
	this.updateCurrentAction();
	this.updateActionState();
	this.getDom().appendTo('body');
};
$.extend(ToolBarUI.prototype, ComponentUI);

ToolBarUI.prototype.bindEvents = function(){
	this.getDom().find('a').bind({
		click: $.proxy(this.buttonPressed, this)
	});
};

ToolBarUI.prototype.buttonPressed = function(event) {
	event.preventDefault();
	
	var $target = $(event.currentTarget);
	var action = DBDesigner.Action.SELECT;
	
	if($target.is('.ui-state-active, .ui-state-disabled')) return;
	if($target.hasClass('add-table')) action = DBDesigner.Action.ADD_TABLE;
	if($target.hasClass('add-column')) action = DBDesigner.Action.ADD_COLUMN;
	if($target.hasClass('add-foreignkey')) action = DBDesigner.Action.ADD_FOREIGNKEY;
	if($target.hasClass('drop-table')) action = DBDesigner.Action.DROP_TABLE;
	if($target.hasClass('save')) action = DBDesigner.Action.SAVE;
	this.getController().setAction(action);
};

ToolBarUI.prototype.updateCurrentAction = function() {
	var model = this.getController().getModel();
	var dom = this.getDom();
	var sel = '.' + this.getCssClass(model.getAction());
	
	dom.find('a').removeClass('ui-state-active').filter(sel).addClass('ui-state-active');
	
};

ToolBarUI.prototype.updateActionState = function() {
	var model = this.getController().getModel();
	var dom = this.getDom();
	var sel = '';
	var actionState = model.getActionState();
	for(var action in actionState){
		sel = '.' + this.getCssClass(action);
		if(actionState[action] === false) dom.find(sel).addClass('ui-state-disabled').removeClass('ui-state-default');
		else dom.find(sel).addClass('ui-state-default').removeClass('ui-state-disabled');
	}
};


ToolBarUI.prototype.getAction = function(cssClass){};
ToolBarUI.prototype.getCssClass = function(action) {
	switch(action){
		case DBDesigner.Action.ADD_TABLE:
			return 'add-table';
		case DBDesigner.Action.ADD_COLUMN:
			return 'add-column';
		case DBDesigner.Action.ADD_FOREIGNKEY:
			return 'add-foreignkey';
		case DBDesigner.Action.DROP_TABLE:
			return 'drop-table';
		case DBDesigner.Action.SAVE:
			return 'save';
		default:
			return 'select';
	}
};


/**
 *
 * Class to manage the component of the designer where tables are drawn
 * 
 */
Canvas = function() {
	var model = new CanvasModel();
	model.bind(DBDesigner.Event.PROPERTY_CHANGED, this.modelPropertyChanged, this);
	
	this.setModel(model);
	this.setUI(new CanvasUI(this));
};
$.extend(Canvas.prototype, Component);
Canvas.Event = {PLACEMENT_CAPTURED: 'placementcaptured'};

/**
 * Sets the collapsed state of the canvas
 * @param b if true, the canvas is collapsed
 *			otherwise, the canvas is expanded
 *			
 */
Canvas.prototype.setCollapsed = function(b) {
	this.getModel().setCollapsed(b);
};

/**
 * Checks the collapsed state of the canvas
 * @return a boolean with the value of the property
 */
Canvas.prototype.isCollapsed = function() {
	return this.getModel().isCollapsed();
};

/**
 * Listener for model updates
 * @param event object with information related to the event triggered
 */
Canvas.prototype.modelPropertyChanged = function(event) {
	var ui = this.getUI();
	switch(event.property){
		case 'capturingPlacement':
		case 'collapsed':
			ui.updateCanvasState();
			break;
	}
	this.trigger(DBDesigner.Event.PROPERTY_CHANGED, event);	
};

/**
 * Sets the canvas to capture the next mousedown action to place a new object in it
 * @param b if true, enable the capture of the next mousedown action
 *			otherwise, disable the capture of the next mousedown action
 */
Canvas.prototype.setCapturingPlacement = function(b) {
	this.getModel().setCapturingPlacement(b);
};

/**
 * Checks the capture state of the canvas
 * @return a boolean with the value of the property
 */
Canvas.prototype.isCapturingPlacement = function() {
	return this.getModel().isCapturingPlacement();
};

Canvas.prototype.triggerPlacementCaptured = function(position) {
	this.trigger(Canvas.Event.PLACEMENT_CAPTURED, position);
};

// *****************************************************************************

/**
 *
 * Model for canvas component 
 * 
 */
CanvasModel = function() {
	
};
$.extend(CanvasModel.prototype, EventDispatcher);


/**
 * Sets the collapsed state of the canvas
 * @param b if true, the canvas is collapsed
 *			otherwise, the canvas is expanded
 *			
 */
CanvasModel.prototype.setCollapsed = function(b) {
	var oldState = this.isCollapsed();
	if(oldState != b){
		this._collapsed = b;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'collapsed', oldValue: oldState, newValue: b});
	}
};

/**
 * Checks the collapsed state of the canvas
 * @return a boolean with the value of the property
 */
CanvasModel.prototype.isCollapsed = function() {
	if(typeof this._collapsed == 'undefined') this._collapsed = false;
	return this._collapsed;
};

/**
 * Sets the canvas to capture the next mousedown action to place a new object in it
 * @param b if true, enable the capture of the next mousedown action
 *			otherwise, disable the capture of the next mousedown action
 */
CanvasModel.prototype.setCapturingPlacement = function(b) {
	var oldState = this.isCapturingPlacement();
	if(oldState != b){
		this._capturingPlacement = b;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'capturingPlacement', oldValue: oldState, newValue: b});
	}
	
};

/**
 * Checks the capture state of the canvas
 * @return a boolean with the value of the property
 */
CanvasModel.prototype.isCapturingPlacement = function() {
	if(typeof this._capturingPlacement == 'undefined') this._capturingPlacement = false;
	return this._capturingPlacement;
};

// *****************************************************************************

/**
 *
 * View for canvas component 
 * 
 */
CanvasUI = function(controller) {
	this.setTemplateID('Canvas');
	this.setController(controller);
	this.init();
	this.getDom().appendTo('body').multiDraggableArea({filter: 'div.db-table'});
};
$.extend(CanvasUI.prototype, ComponentUI);

/**
 * Attaches events to html objects 
 */
CanvasUI.prototype.bindEvents = function() {
	this.getDom().mousedown($.proxy(this.mousePressed, this));
};

/**
 * Event fired when is performed a mousedown action within the canvas element 
 */
CanvasUI.prototype.mousePressed = function(event) {
	var dom = this.getDom();
	var offset = dom.offset();
	var innerCanvas = dom.find('div.inner-canvas');
	var controller = this.getController();
	
    if(event.which == 1 && event.pageX - offset.left < innerCanvas.width() && event.pageY - offset.top < innerCanvas.height()){
		if(controller.isCapturingPlacement()){
			event.stopImmediatePropagation();
			var position = {
                left: event.pageX + dom.scrollLeft() - offset.left,
                top: event.pageY + dom.scrollTop() - offset.top
            };
			controller.triggerPlacementCaptured(position);
		}
		/*
		if(this.model.isAddingTable()){
            event.stopImmediatePropagation();
            var pos = {
                x: event.pageX + this.view.$container.scrollLeft() - this.view.$container.offset().left,
                y: event.pageY + this.view.$container.scrollTop() - this.view.$container.offset().top
            };
            this.model.setNewTablePosition(pos);
            this.model.dispatchEvent(CanvasEvent.NEW_TABLE_POSITION_SET);
        }*/
    }else{
		//Avoid start selection when clicking on scroll bars
        event.stopImmediatePropagation();
    }
};

/**
 * Updates the presentation of the canvas according to the model
 */
CanvasUI.prototype.updateCanvasState = function() {
	var controller = this.getController();
	var isCollapsed = controller.isCollapsed();
	var $canvas = this.getDom();
	var isCapturingPlacement = controller.isCapturingPlacement();
	
	if(isCollapsed && !$canvas.hasClass('canvas-collapsed')) {
		$canvas.addClass('canvas-collapsed');
	}
	else if(!isCollapsed && $canvas.hasClass('canvas-collapsed')) {
		$canvas.removeClass('canvas-collapsed');
	}
	
	if(isCapturingPlacement && $canvas.css('cursor') != 'crosshair'){
		$canvas.css('cursor', 'crosshair');
	}
	else if(!isCapturingPlacement && $canvas.css('cursor') != 'default'){
		$canvas.css('cursor', 'default');
	}
};/**
 * 
 * Class to manage the component used to show table details
 * 
 */
ObjectDetail = function() {
	var model = new ObjectDetailModel();
	model.bind(DBDesigner.Event.PROPERTY_CHANGED, this.modelPropertyChanged, this);
	this.setModel(model);
	this.setUI(new ObjectDetailUI(this));
};
$.extend(ObjectDetail.prototype, Component);

/**
 * Sets the collapsed state of the panel 
 */
ObjectDetail.prototype.setCollapsed = function(b) {
	this.getModel().setCollapsed(b);
};

/**
 * Checks if the panel is collapsed
 */
ObjectDetail.prototype.isCollapsed = function() {
	return this.getModel().isCollapsed();
};

/**
 * Listener for model updates
 * @param event object with information related to the event triggered
 */
ObjectDetail.prototype.modelPropertyChanged = function(event) {
	var ui = this.getUI();
	switch(event.property){
		case 'collapsed':
			ui.updatePanelState();
			break;
	}
	this.trigger(DBDesigner.Event.PROPERTY_CHANGED, event);	
}

// *****************************************************************************

/**
 *
 * The ObjectDetail Model
 * 
 */
ObjectDetailModel = function(){};
$.extend(ObjectDetailModel.prototype, EventDispatcher);

/**
 * Checks if the panel is collapsed
 */
ObjectDetailModel.prototype.isCollapsed = function() {
	if(typeof this._collapsed == 'undefined') this._collapsed = false;
	return this._collapsed;
};

/**
 * Sets the collapsed state of the panel
 * @param b if true, the panel is collapsed
 *			otherwise, the panel is expanded
 */
ObjectDetailModel.prototype.setCollapsed = function(b) {
	var oldState = this.isCollapsed();
	if(oldState != b){
		this._collapsed = b;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'collapsed', oldValue: oldState, newValue: b});
	}
};



// *****************************************************************************


/**
 *
 * The ObjectDetail View
 * 
 */
ObjectDetailUI = function(controller) {
	this.setTemplateID('ObjectDetail');
	this.setController(controller);
	this.init();
	this.getDom().appendTo('body');
};
$.extend(ObjectDetailUI.prototype, ComponentUI);

/**
 * Attaches events to html objects 
 */
ObjectDetailUI.prototype.bindEvents = function() {
	this.find('a.collapse-button').bind({
		click: $.proxy(this.panelStateChange, this)
	});
};

/**
 * Evet fired when the collapse button is clicked
 * @param event object with information related to the event triggered
 */
ObjectDetailUI.prototype.panelStateChange = function(event) {
	event.preventDefault();
	var controller = this.getController();
	controller.setCollapsed(!controller.isCollapsed());
};

/**
 * Updates the presentation of the panel according to its state
 */
ObjectDetailUI.prototype.updatePanelState = function() {
	var isCollapsed = this.getController().isCollapsed();
	var $panel = this.getDom();
	if(isCollapsed && !$panel.hasClass('object-detail-collapsed')) {
		$panel.addClass('object-detail-collapsed')
			.find('a.collapse-button span')
			.removeClass('ui-icon-circle-triangle-s')
			.addClass('ui-icon-circle-triangle-e');
	}
	else if(!isCollapsed && $panel.hasClass('object-detail-collapsed')) {
		$panel.removeClass('object-detail-collapsed')
			.find('a.collapse-button span')
			.removeClass('ui-icon-circle-triangle-e')
			.addClass('ui-icon-circle-triangle-s');
	}
};

TableDialog = function() {	
	this.setModel(new TableDialogModel());
	this.setUI(new TableDialogUI(this));
};

$.extend(TableDialog.prototype, Component);

TableDialog.prototype.createTable = function(position){
	var tableModel = new TableModel();
	var model = this.getModel();
	tableModel.setPosition(position);
	model.setTableModel(tableModel);
	model.setAction(DBDesigner.Action.ADD_TABLE);
	this.getUI().open();
};

TableDialog.prototype.editTable = function(table){
	var model = this.getModel();
	model.setTableModel(table.getModel());
	model.setAction(DBDesigner.Action.EDIT_TABLE);
	this.getUI().open();
};

TableDialog.prototype.saveTable = function(form){
	var model = this.getModel();
	var tableModel = model.getTableModel();
	var action = model.getAction();
	
	if(this.validateForm(form)){
		tableModel.setName(form.name);
		tableModel.setWithoutOIDS(form.withoutOIDS);
		tableModel.setComment(form.comment);
		
		if(action == DBDesigner.Action.ADD_TABLE){
			DBDesigner.app.tableCollection.add(new Table(tableModel));
		}
		
		this.getUI().close();
	}
};

TableDialog.prototype.validateForm = function(form){
	var isValid = true;
	var ui = this.getUI();
	if(form.name == '') {
		ui.showError('table-name', DBDesigner.lang.strtableneedsname);
		isValid = false;
	}
	var tableWithSameName = DBDesigner.app.tableCollection.getTableByName(form.name);
	if(tableWithSameName != null && tableWithSameName.getModel() != this.getTableModel()){
		ui.showError('table-name', DBDesigner.lang.strtableexists);
		isValid = false;
	}
	
	return isValid;
}

TableDialog.prototype.getTableModel = function(){
	return this.getModel().getTableModel();
};

// *****************************************************************************

TableDialogModel = function() {
	
};

$.extend(TableDialogModel.prototype, EventDispatcher);

TableDialogModel.prototype.setTableModel = function(tableModel){
	this._tableModel = tableModel;
};

TableDialogModel.prototype.getTableModel = function(){
	if(typeof this._tableModel == 'undefined') this._tableModel = null;
	return this._tableModel;
};

TableDialogModel.prototype.setAction = function(action){
	this._action = action;
};

TableDialogModel.prototype.getAction = function(){
	if(typeof this._action == 'undefined') this._action = DBDesigner.Action.ADD_TABLE;
	return this._action;
};




// *****************************************************************************

TableDialogUI = function(controller) {
	this.setTemplateID('TableDialog');
	this.setController(controller);
	this.init();
	this.getDom().appendTo('body').dialog({modal: true, autoOpen: false});
};

$.extend(TableDialogUI.prototype, ComponentUI);

TableDialogUI.prototype.bindEvents = function(){
	var dom = this.getDom();
	dom.find('#table-dialog_cancel').click($.proxy(this.close, this));
	dom.find('#table-dialog_save').click($.proxy(this.save, this));
};


TableDialogUI.prototype.open = function(){
	var tableModel = this.getController().getTableModel();
	var dom = this.getDom();
	
	this.cleanErrors();
	
	if(tableModel != null){
		$('#table-dialog_table-name').val(tableModel.getName());
		$('#table-dialog_withoutoids').prop('checked', tableModel.getWithoutOIDS());
		$('#table-dialog_table-comment').val(tableModel.getComment());
		dom.dialog('open');
		window.setTimeout(function(){dom.find('.focusable').focus()}, 500);
	}
};

TableDialogUI.prototype.close = function(){
	this.getDom().dialog('close');
};

TableDialogUI.prototype.save = function(){
	this.cleanErrors();
	
	var form = {
		name: $.trim($('#table-dialog_table-name').val()),
		withoutOIDS: $('#table-dialog_withoutoids').prop('checked'),
		comment: $.trim($('#table-dialog_table-comment').val())
	};
	this.getController().saveTable(form);
};

TableDialogUI.prototype.showError = function(fieldWrapper, message){
	var dom = this.getDom();
	var $fieldWrapper = dom.find('div.' + fieldWrapper);
	var $perror = $fieldWrapper.find('p.ui-state-error');
	if($perror.length == 0) {
		$perror = $('<p class="ui-state-error"></p>');
		$fieldWrapper.append($perror);
	}
	$perror.text(message);
};

TableDialogUI.prototype.cleanErrors = function(){
	this.getDom().find('p.ui-state-error').remove();
};DBObject = {
	setName: function(name){
		var oldName = this.getName();
		if(oldName != name){
			this._name = name;
			this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property:'name', oldValue:oldName, newValue: name});
		}
	},
	getName: function(){
		if(typeof this._name == 'undefined') this._name = '';
		return this._name;
	},
	setComment: function(comment){
		var oldComment = this.getComment();
		if(oldComment != comment){
			this._comment = comment;
			this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property:'comment', oldValue:oldComment, newValue: comment});
		}
	},
	getComment: function(){
		if(typeof this._comment == 'undefined') this._comment = '';
		return this._comment;
	}
};

$.extend(DBObject, EventDispatcher);


Table = function() {
	//If the constructor gets a TableModel object as first parameter, it is set as the model
	//otherwise a new model is created
	
	if(arguments.length > 0 && arguments[0] instanceof TableModel) this.setModel(arguments[0]);
	else this.setModel(new TableModel());
	
	this.setUI(new TableUI(this));
};

$.extend(Table.prototype, Component);

Table.prototype.getName = function(){
	return this.getModel().getName();
};

Table.prototype.modelPropertyChanged = function(event) {
	var ui = this.getUI();
	switch(event.property){
		case 'name':
			ui.updateName(event.newValue);
			break;
		case 'collapsed':
			ui.updateCollapsed(event.newValue);
			break;
	}
	this.trigger(DBDesigner.Event.PROPERTY_CHANGED, event);	
};

Table.prototype.editTable = function(){
	DBDesigner.app.tableDialog.editTable(this);
};

// *****************************************************************************

TableModel = function() {
	
};

$.extend(TableModel.prototype, DBObject);

TableModel.prototype.setPosition = function(position){
	var oldPosition = this.getPosition();
	if(oldPosition.top != position.top || oldPosition.left != position.left){
		$.extend(this._position, position);
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'position', oldValue: oldPosition, newValue: position});
	}
};

TableModel.prototype.getPosition = function(){
	if(typeof this._position == 'undefined') this._position = {top:0, left:0}
	return $.extend({}, this._position);
};

TableModel.prototype.setWithoutOIDS = function(b){
	this._withoutOIDS = b;
}

TableModel.prototype.getWithoutOIDS = function(){
	if(typeof this._withoutOIDS == 'undefined') this._withoutOIDS = true;
	return this._withoutOIDS;
}

TableModel.prototype.isSelected = function(){
	if(typeof this._selected == 'undefined') this._selected = false;
	return this._selected;
};

TableModel.prototype.setSelected = function(b){
	var oldValue = this.isSelected();
	if(oldValue != b){
		this._selected = b;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'selected', oldValue: oldValue, newValue: b});
	}
};

TableModel.prototype.isCollapsed = function(){
	if(typeof this._collapsed == 'undefined') this._collapsed = false;
	return this._collapsed;
};

TableModel.prototype.setCollapsed = function(b){
	var oldValue = this.isCollapsed();
	if(oldValue != b){
		this._collapsed = b;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'collapsed', oldValue: oldValue, newValue: b});
	}
};

// *****************************************************************************

TableUI = function(controller) {
	this.setTemplateID('Table');
	this.setController(controller);
	this.init();
	this.getDom().appendTo('#canvas').multiDraggable({containment: 'parent'});
	this.updateView();
};

$.extend(TableUI.prototype, ComponentUI);

TableUI.prototype.bindEvents = function(){
	var dom = this.getDom();
	dom.bind({
		dragstart: $.proxy(this.onDragStart, this),
		dragstop: $.proxy(this.onDragStop, this)
	});
	dom.find('a.button').click($.proxy(this.onButtonPressed, this));
	dom.find('div.header').dblclick($.proxy(this.onHeaderDblClicked, this));
};

TableUI.prototype.updateView = function(){
	var model = this.getController().getModel();
	this.updatePosition(model.getPosition());
	this.updateName(model.getName());
};

TableUI.prototype.updatePosition = function(position){
	this.getDom().css({top: position.top + 'px', left: position.left + 'px'});
};

TableUI.prototype.updateName = function(name){
	this.find('div.header > span.title').text(name);
	this.updateWidth();
};

TableUI.prototype.onDragStart = function(){
	console.log('dragstart');
};

TableUI.prototype.onDragStop = function(){
	console.log(this.getDom().width());
	console.log(this.find('div.header > span.title').outerWidth());
	
};

TableUI.prototype.onButtonPressed = function(event){
	var model = this.getController().getModel();
	var $button = $(event.currentTarget);
	if($button.is('a.collapse-button')){
		model.setCollapsed(!model.isCollapsed());
	}
	else if($button.is('a.properties-button')){
		
	}
	event.preventDefault();
};

TableUI.prototype.onHeaderDblClicked = function(event){
	if($(event.target).is('div.header, span.title')){
		this.getController().editTable();
	}
};

TableUI.prototype.updateWidth = function(){
	var dom = this.getDom();
	var w = dom.find('div.header > span.title').outerWidth() + 54/*(buttons)*/;
	dom.css({width: w, minWidth: w});
};

TableUI.prototype.updateCollapsed = function(b){
	var dom = this.getDom();
	var hasClass = dom.hasClass('db-table-collapsed');
	if(b && !hasClass){
		dom.addClass('db-table-collapsed')
			.find('a.collapse-button span')
			.removeClass('ui-icon-circle-triangle-s')
			.addClass('ui-icon-circle-triangle-e');
	}
	else if(!b && hasClass){
		dom.removeClass('db-table-collapsed')
			.find('a.collapse-button span')
			.removeClass('ui-icon-circle-triangle-e')
			.addClass('ui-icon-circle-triangle-s');
	}
	this.updateWidth();
};
TableCollection = function(){
	this._tables = [];
	this._selectedTables = [];
};

TableCollection.prototype.getTableByName = function(name){
	for(var i = 0, n = this._tables.length; i < n; i++){
		if(this._tables[i].getName() == name) return this._tables[i];
	}
	return null;
};

TableCollection.prototype.add = function(table){
	this._tables.push(table);
};
