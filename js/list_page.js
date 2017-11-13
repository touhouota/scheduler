window.onload = function() {
	// cookieにidがない場合は、loginさせる
	if (!Base.get_cookie('user_id')) {
		// ここに入った場合はidがない
		window.location = "/b1013179/scheduler/index.html";
	}
	// タスクを取得
	const query = "?cmd=task_list&user_id=" + Base.get_cookie("user_id");
	Base.create_request("GET", Base.request_path + query, function() {
		if (this.status == 200 && this.readyState == 4) {
			let response = JSON.parse(this.responseText);
			console.table(response.data);
			const list = Task.create_task_list(response.data);
			document.getElementById("today_list").appendChild(list);

			let times = Task.calc_task_time(response.data);
			Chart.draw("canvas", times.plan, times.real);
		}
	}).send(null);

	// タスク追加ボタンのイベント
	document.getElementById("append_task").addEventListener("click", Task.append_task);

	// timelineを取得するタイマーのセット
	Timeline.set_timer();

	// コメント入力欄のイベント
	// 入力欄の状態によってボタンの表示を変える
	document.getElementById("comment").addEventListener("input", Timeline.check_comment_textarea);
	// コメントの送信を行うためのイベント設定
	const button = document.getElementById("comment_button");
	button.addEventListener("click", Timeline.append);
	button.disabled = true;

	// 今日の日付を表示
	let today = document.getElementById("today");
	let now = new Date();
	today.textContent = [now.getMonth() + 1, "月", now.getDate(), "日"].join("");

	// 仲間の予定ボタンにイベントを追加
	document.querySelector(".members").addEventListener("click", function() {
		// ページ遷移
		window.location = "./members(list_test).html";
	});

	// ログアウトのボタン
	document.getElementById("logout").addEventListener("click", Base.logout);
	// wikiへ飛ばす
	document.getElementById("wiki").addEventListener("click", function() {
		window.open('http://wiki.c.fun.ac.jp/wiki/2017/index.php?SuperScheduler', '_blank');
	});
}

function set_date() {
	let date = document.getElementById('today');
	date.textContent = format_md(now);
	date.setAttribute("datetime", [format_ymd(now), format_hms(now)].join("T") + "+09:00");
}
