Ext.onReady(function(){

	Ext.BLANK_IMAGE_URL ='../ext-4.0.7-gpl/resources/themes/images/default/tree/s.gif'; 
	
	var userStore = Ext.create('Ext.data.Store', {
		id:'userStoreId',
		autoLoad:false,
		pageSize:5,
		fields:['roomId','jackPot','totalBet','usersNumber'],
		proxy: {
			type: 'memory',
			reader: {
				type: 'json',
				root: 'requests'
			}
		}
	});

	/**
	 * userGrid,detail users' message
	 */
	var userGrid=Ext.create('Ext.grid.Panel', {
		id:'userGridId',
		region:'center',
	    store: userStore,
	    columns:[
			{xtype:'rownumberer',width:50,sortable:false},
			{text:'roomId',width:150,dataIndex:'roomId'},
			{text:'jackPot',dataIndex:'jackPot',width:100},
			{text:'totalBet',dataIndex:'totalBet',width:100},
			{text:'usersNumber',dataIndex:'usersNumber',width:100}
		]
	});

	var viewport=new Ext.Viewport({
		layout:'border',
		items:[{
			region:'north',
			height:30,
			contentEl:roomManager
		}, userGrid]
	});
});

var STATUS_INTERVAL = 5 * 1000; // 60 seconds
/*
socket.on('connect', function(){
	socket.emit('announce_web_client');
	socket.emit('webMessage', {method: 'getOnlineUser'});

	socket.on('getOnlineUser',function(msg){  
		var totalConnCount = msg.totalConnCount;
		var loginedCount = msg.loginedCount;
		var onlineUserList = msg.onlineUserList
		var store = Ext.getCmp('userGridId').getStore();
		contentUpdate(totalConnCount, loginedCount);
		store.loadData(onlineUserList);
	});
});*/

setInterval(function() {
	window.parent.client.request('roomManager', {hello:'world'}, function(err, msg) {
		if(err) {
			console.error('fail to request roomManager user:');
			console.error(err);
			return;
		}

		var rooms = [];

		if(!err && !!msg){
			console.log('response---',msg);
			rooms = msg;
		}

		var totalConnCount = 0, loginedCount = 0;

		totalConnCount += rooms.length;

		rooms.forEach(function(room) {
			loginedCount += room.usersNumber;
		});

		contentUpdate(totalConnCount, loginedCount);
		var store = Ext.getCmp('userGridId').getStore();
		console.log(rooms);
		store.loadData(rooms);
	});
}, STATUS_INTERVAL);

function contentUpdate(totalConnCount, loginedCount){
	document.getElementById("totalConnCount").innerHTML = totalConnCount;
	document.getElementById("loginedCount").innerHTML = loginedCount;
}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
