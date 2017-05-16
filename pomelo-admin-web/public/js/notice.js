Ext.onReady(function() {

	Ext.BLANK_IMAGE_URL = '../ext-4.0.7-gpl/resources/themes/images/default/tree/s.gif';

	var runScriptPanel = Ext.create('Ext.form.FormPanel', {
		bodyPadding: 10,
		autoScroll: true,
		autoShow: true,
		renderTo: Ext.getBody(),
		region: 'center',
		items: [{
			layout: 'column',
			border: false,
			anchor: '95%',
			items: [{
				xtype: 'label',
				text: '公告内容',
				columnWidth: .99
			}]
		}, {
			xtype: 'textareafield',
			height: 150,
			//region: 'center',
			id: 'scriptAreaId',
			anchor: '95%'
		}, {
			layout: 'column',
			anchor: '95%',
			border: false,
			items: [{
				// colspan: 2
				xtype: 'button',
				text: '推送公告',
				handler: saveForm,
				width: 150,
				margin: '10 0 10 100'
			}]
		}]
	});

	// list();
	new Ext.Viewport({
		layout: 'border',
		items: [runScriptPanel]
	});
});

var cancel = function() {
	Ext.getCmp('saveWinId').close();
};

var saveForm = function() {
	var saveForm = Ext.create('Ext.form.Panel', {
		frame: true,
		bodyStyle: 'padding:2px 2px 0',
		width: 300,
		// defaultType: 'textfield',
		// renderTo: Ext.getBody(),
		anchor: '100%',
		fieldDefaults: {
			msgTarget: 'side',
			labelWidth: 50
		},
		items: [],
		buttons: [{
			text: '确认',
			handler: save
		}, {
			text: '取消',
			handler: cancel
		}]
	});

	

	var win = Ext.create('Ext.window.Window', {
		id: 'saveWinId',
		title: '确认框',
		height: 100,
		width: 320,
		layout: 'fit',
		anchor: '100%',
		items: [saveForm]
	});

	win.show();
};

var save = function() {
	var noticeContent = Ext.getCmp('scriptAreaId').getValue();
	console.log("notice content is ", noticeContent);
    var msg = {content: noticeContent};
	window.parent.client.request('notice', msg, function(err) {
		if (err) {
			alert(err);
			return;
		}
		alert('push notice success!');
	});
};