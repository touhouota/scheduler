// タスクの実行時間を計測する部分
function timer(button) {
	var parent = parents(button, "task");
	if (button.getAttribute("status") !== "1") {
		// 1の時は止まる
		console.log("timer stop");
		// 止める処理
		var timer_id = Number(parent.getAttribute("timer_id"));
		clearTimeout(timer_id);
		set_time(parent);
	} else {
		// スタートさせる処理
		console.log("timer start");
		var start = parent.getAttribute("start");
		var stop = parent.getAttribute("stop");
		if (start === undefined) {
			// startがない場合は、新たに属性を追加
			parent.setAttribute("start", Date());
		} else {
			// startがある場合は、現在の時間からタイマーの時間分ずらしたところからスタートする
			if (stop === null) {
				// 今の時間を停止時間とする
				parent.setAttribute("stop", Date());
			}
			// 現在時刻から、開始時間の間の時間を取得。
			var diff = new Date(stop) - new Date(start);
			// スタート時間を、現在時間から上記の差分の時間分引いたろからにする。
			diff = Date.now() - diff;
			parent.setAttribute("start", Date(diff));
		}

		// １秒ごとに時間を計測する
		var tid = setInterval(function() {
			set_time(parent);
		}, 1100);
		parent.setAttribute("timer_id", tid);
	}
}

// タスクの経過時間をブラウザに出力する部分
function set_time(task_dom) {
	var stop = new Date();
	task_dom.setAttribute("stop", stop);
	// 時間の差分(ミリビョウ)
	var diff = stop.getTime() - new Date(task_dom.getAttribute("start"));
	console.log("settime", diff)
	var time = convert_hms_from_seconds(diff / 1000);
	task_dom.querySelector(".real > .time").innerHTML = time;
}
