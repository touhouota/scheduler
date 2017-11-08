// タスクの情報が登録されているかを確認する
function check_startable(task) {
	var image_time = task.querySelector(".real > .time").textContent;
	var default_detail = "詳細を決めていませんタスクを実行する前に決めよう！";
	// 詳細の中の予定な空白を削除する
	var task_detail = task.getElementsByClassName("task_detail_text")[0].textContent.replace(/\s/g, '');

	return (image_time === "---") && (task_detail === default_detail);
}

// タスクのクラスをつけたり消したりする
function task_decoration(task, status) {
	if (status === "1") {
		task.getElementsByClassName("end_detail")[0].open = false;
		task.classList.remove("highlight");
		task.children[1].classList.add("task_sub");
	} else {
		task.getElementsByClassName("end_detail")[0].open = true;
		task.classList.add("highlight");
		task.children[1].classList.remove("task_sub");
	}
}

// タスクの状態を更新する
function task_status_change(button) {
	var task = parents(button, "task");
	var task_info = task.dataset;
	var url = [request_path,
		"?cmd=time&task_id=", task.id,
		"&user_id=", user_id,
		"&datetime=", encodeURIComponent(Date())
	].join("");

	if (check_startable === false) {
		// 未着手の時は、事前に情報が登録されているかの確認を行う
		alert("タスクを開始する前に、時間の見積もりや詳細情報を追加しよう！");
		create_modal(click_event.target);
		return;
	}

	var icon = task.getElementsByClassName("task_status")[0];
	// タスクのクラスを付け替える
	task_decoration(task, task_info.status);
	if (task_info.status === "1") {
		// タスク実行時
		icon.src = icon.src.replace(/start.png/, "pause.png");
		task_info.status = 4;
		// タスク状態を保持しておく
		task_status = 4;
		change_favicon(task_status);
		// 一時停止するときは、タスクの時間・メモもおくるぞ
		var time = task.querySelector(".real > .time").textContent;
		url = [
			url, "&time=", convert_seconds_from_hms(time),
			"&status=", 4,
			"&end_detail=", task.end_detail.value
		].join("");
	} else {
		// 実行していない時
		icon.src = icon.src.replace(/[a-z]*.png/, "start.png");
		task_info.status = 1;
		// タスク状態を保持しておく
		task_status = 1;
		change_favicon(task_status);
		url = [url, "&status=", task_info.status].join("");
		var timer_standerd = new Date();
		task_info.stop = timer_standerd;
		var time = task.querySelector(".real > .time").textContent;
		var second = convert_seconds_from_hms(time);
		//console.log("現在時刻と経過時間の誤差", second * 1000);
		task_info.start = new Date(timer_standerd - second * 1000);
	}
	// タイマーを動かす・止める
	timer(task);

	create_request("GET", url, function() {
		if (this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			// console.log(json);
			if (json.ok) {
				new Chart("canvas", json.chart).render();
			}
		}
	}).send(null);
}

function timer(task) {
	var task_info = task.dataset;
	if (task_info.status == 1) {
		// 実行中の時は、タイマー実行
		var timer_standerd = new Date();
		// 経過時間を
		var time = task.querySelector(".real > .time").textContent;
		// 経過時間をmsに変換する
		//
		if (task_info.start === undefined) {
			task_info.start = timer_standerd;
		}
		task_info.stop = timer_standerd;
		// タイマーの準備
		task_info.timer_id = setInterval(function() {
			set_time(task);
		}, 1000);
	} else {
		// タイマーを停止
		clearInterval(task_info.timer_id);
		// timer_idを削除
		task_info.timer_id = null;
	}
}

function set_time(task) {
	var task_info = task.dataset;
	var stop = new Date();
	task_info.stop = stop;
	// 時間の差分(ミリビョウ)
	var diff = stop.getTime() - new Date(task_info.start);
	var time = convert_hms_from_seconds(diff / 1000);
	task.querySelector(".real > .time").textContent = time;
}
