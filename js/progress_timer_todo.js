let ProgressTimer = {
	timer: null,

	set: function(task_element) {
		console.log("ProgressTimer, set");
		// セットされた時間を記録
		if (!task_element.dataset.start_time) {
			task_element.dataset.start_time = Date();
		}
		Task.child[task_element.id] = true;
	},

	clear: function(task_element) {
		console.log("ProgressTimer, clear");
		// タイマーを止める
		clearInterval(task_element.dataset.progressTimer_id);

		// タスクの時間を再表示
		ProgressTimer.display(task_element);

		// 設定した諸々を消す
		task_element.dataset.progressTimer_id = '';
		task_element.dataset.start_time = '';
		Task.child[task_element.id] = false;
	},

	display: function(task) {
		// タスクの進捗により、グラフを更新する
		let canvas = task.querySelector(".canvas");
		let plan = [],
			real = [];
		if (!task.querySelector(".subtask_list").children.length) {
			let _plan_time = Number(task.dataset.expected_time);
			plan.push(_plan_time || 0);

			let _real_time = ProgressTimer.calc_diff_seconds(task) / 60;
			_real_time = Math.floor(_real_time * 100) / 100;
			real.push(_real_time || 0);
		} else {
			let subtasks = task.querySelector(".subtask_list").children;
			let i = 0;
			let length = subtasks.length;
			for (i = 0; i < length; i += 1) {
				let plan_time = Number(subtasks[i].dataset.expected_time);
				plan.push(plan_time || 0);
				let real_time = Number(subtasks[i].dataset.progress) / 60;
				real_time = Math.floor(real_time * 100) / 100;
				real.push(real_time || 0);
			}
		}
		// console.log(plan, real);
		Chart.draw(canvas, plan, real);
	},

	watch: function() {
		ProgressTimer.timer = setInterval(function() {
			for (let key in Task.child) {
				let parent = null;
				if (Task.child[key]) {
					console.log(Task.child[key]);
					let task = document.getElementById(key);
					ProgressTimer.display(task);
					parent = Base.parents(task.parentElement, "task");
					// 親要素があれば、親も表示変更
					if (parent instanceof Node) {
						console.log("start: parent:", parent);
						ProgressTimer.display(parent);
					}
				}
			}
		}, 1000);
	},

	calc_diff_seconds: function(task_element) {
		// 指定されたタスクの経過時間を取得 => ミリ秒に変換
		let progress = parseInt(task_element.dataset.progress || 0, 10) * 1000;
		if (isNaN(progress)) {
			// NaNの場合は、0とする
			progress = 0;
		}
		let start_time = Date.parse(task_element.dataset.start_time || Date());
		let now = new Date();

		// これまでの経過時間 + タスク開始時間と現在時間の差分を返す
		let diff_millis = progress + (now.getTime() - start_time);
		// タスクの進行状況を記録する
		task_element.dataset.progress = (diff_millis / 1000) || 0;
		return (diff_millis / 1000) || 0;
	},

	// 秒数をhh:mm:ddに変換
	convert_hms_from_seconds: function(seconds) {
		var argv_sec = seconds;
		var hour = Math.floor(argv_sec / (60 * 60));
		argv_sec -= hour * (60 * 60);
		if (hour < 10) hour = ["0", hour].join("");

		var min = Math.floor(argv_sec / 60);
		argv_sec -= min * 60;
		if (min < 10) min = ["0", min].join("");

		var sec = Math.floor(argv_sec);
		if (sec < 10) sec = ["0", sec].join("");

		return [hour, ":", min, ":", sec].join("");
	},
};