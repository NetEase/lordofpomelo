__resources__["/taskPanelView.js"] = {meta: {mimetype: "application/javascript" }, data: function(exports, require, module, __filename, __dirname) {
	var app = require('app');
	var consts = require('consts');
	var mainPanel = require('mainPanelView');
	var dataApi = require('dataApi');
	var taskHandler = require('taskHandler');
	var pomelo = window.pomelo;
	var clientManager = require('clientManager');
	var $panel, $questBtn;

	var init = function() {
		$panel = $('#taskPanel');
    $questBtn = $('#mainPanel .m-nav .itm03');

		// close
		$panel.find('.u-close').on('click', function() {
			hide();
			mainPanel.removeNavSelect();
		});
		initList();
	};

	var show = function() {
		$panel.show();
	};

	var hide = function() {
		$panel.fadeOut(200);
	};

	var initList = function() {
		var $ul = $panel.find('.drama .task-list');
		var $intro = $panel.find('.intro .introcnt');
		var $adward = $panel.find('.adward .adwardcnt');
		var $notice = $panel.find('.layercnt.zx').children('p.u-tlt');
		var $state = $panel.find('.intro p.u-tlt');
    var $btn = $panel.find('.opt .u-btn');
		app.getCurPlayer().getTasks(function(tasks) {
			var li = '';
			for (var t in tasks) {
				li += ('<li data-id="' + t + '">' + tasks[t].name + '</li>');
			} 
			if (li !== '') {
				$ul.html(li);
				var $lis = $ul.find('li').on('click', function() {
					var $this = $(this);
					if ($this.hasClass('selected')) {
						return;
					}
					var oldTaskId = $lis.filter('.selected').removeClass('selected').data('id');
					if (oldTaskId) {
						tasks[oldTaskId].removeAllListeners();
					}
					$this.addClass('selected');
					selecte($this.data('id'));
				});
				$lis.eq(0).trigger('click');
			} else {
				$ul.html('');
				$intro.html('');
				$adward.html('');
				$state.html('');
				$notice.html('<span>There is not new task to be completed!</span>'); 
			}
		});
    $btn.off().on('click', function() {
      var type = $btn.data('type');
      var taskId = $ul.find('li.selected').eq(0).data('id');
      if (!taskId) { 
        return;
      }
      //console.log(type);
      if (type === 'accept') {
				taskHandler.exec('startTask', {taskId: taskId});
      } else if (type === 'commit') {
				taskHandler.exec('handoverTask');
      }
    });
	};

	var selecte = function(id) {
		var $intro = $panel.find('.intro .introcnt');
		var $adward = $panel.find('.adward .adwardcnt');
		app.getCurPlayer().getTasks(function(tasks) {
			var task = tasks[id];
			if (task) {
				$intro.html(task.acceptTalk);
				var equips = [];
				if (task.item) {
					task.item.split(';').forEach(function(k){
						equips.push(dataApi.equipment.findById(k).englishName);
					});
				}
				$adward.html('</br><p>Experience: ' + task.exp + '</p><p>Equipments: ' + equips.join(', ')  + '</p>');

				setState(task);
				task.on('change:state', function() {
					setState(this);
				});
			}
		});
	}; 

	var setState = function(task) {
		var $state = $panel.find('.intro p.u-tlt');
		var $btn = $panel.find('.opt .u-btn');
		if (task.taskState === undefined) {
			$state.html('');
      $questBtn.removeClass('f2').addClass('f1');
			$btn.html('Accept').data('type', 'accept').show();
			return;
		}
		var totalCount = 0;
		for (var i in task.completeCondition) {
			totalCount += task.completeCondition[i];
		}
		if (!task.taskData) {
			task.taskData = {};
		}
		
		if (task.taskState == 1) {
			$btn.html('Commit').data('type', 'commit').show();
      $questBtn.removeClass('f1').addClass('f2');
		} else {
			$btn.hide().removeData('type');
      $questBtn.removeClass('f1 f2');
		}

		var html = '<span> Progress：' + (task.taskData.mobKilled || 0) + '/' + totalCount + '</span>';
		$state.html('<span>Status：'+ (task.taskState === 0 ? 'Doing' : 'Done') +'</span>' + html);
		$state.find('a.toNPC').on('click', function() {
			toNpc();
			hide();
			mainPanel.removeNavSelect();
			return;
		});

		$state.find('a.accept').on('click', function() {
			if (typeof(task.taskState) === 'undefined') {
				taskHandler.exec('startTask', {taskId: task.id});
			}
		});

		$state.find('a.hand').on('click', function() {
			if (task.taskState === consts.TaskState.COMPLETED_NOT_DELIVERY) {
				taskHandler.exec('handoverTask');
			}
		});
	};

	var toNpc = function() {
		var player = app.getCurPlayer();
		var endX = 880, endY = 550;
		if (pomelo.areaId === '2') {
			endX = 1480;
			endY = 1030;
		}
		var startPos = player.getSprite().getPosition();
		var param = {
			startX: startPos.x,
			startY: startPos.y,
			endX: endX,
			endY: endY
		};
		clientManager.move(param);
	};

  module.exports = {
    init: init,
    show: show,
    hide: hide,
    initList: initList
  };
}
};

