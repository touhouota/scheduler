let ProgressTimer = {

	set: function(task_element) {
		console.log("ProgressTimer, set");
		// セットされた時間を記録
		if (!task_element.dataset.start_time) {
			task_element.dataset.start_time = Date();
		}
		// 1秒ごとに表示をし直す
		task_element.dataset.progressTimer_id = setInterval(function(task) {
			console.log("ProgressTimer, timer");
			ProgressTimer.display(task);
		}, 1000, task_element);
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
	},

	display: function(task) {
		// タスクの進捗により、グラフを更新する
		let canvas = task.querySelector(".canvas");
		let plan = [],
			real = [];
		if (!task.querySelector(".subtask_area").children.length) {
			// 予想時間を取得
			plan.push(task.dataset.expected_time);
			// 実際の作業時間を計測
			const second = ProgressTimer.calc_diff_seconds(task) / 60;
			real.push(seconds.toFixed(2));
		} else {
			let subtasks = task.querySelector(".subtask_area").children;
			let i = 0;
			let length = subtasks.length;
			for (i = 0; i < length; i += 1) {
				plan.push(Number(subtasks[i].dataset.plan));
				real.push(Number(subtasks[i].dataset.real));
			}
			console.log(plan, real);
		}
		Chart.draw(canvas, plan, real);
	},

	calc_diff_seconds: function(task_element) {
		// 指定されたタスクの経過時間を取得 => ミリ秒に変換
		let progress = parseInt(task_element.dataset.progress) * 1000;
		let start_time = Date.parse(task_element.dataset.start_time);
		let now = new Date();

		// これまでの経過時間 + タスク開始時間と現在時間の差分を返す
		let diff_millis = progress + (now.getTime() - start_time);
		return diff_millis / 1000;
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