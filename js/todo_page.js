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
			// console.table(response.data);
			if (response.ok) {
				let data = response.data;

				// todoの作成
				let todo = data.filter(Task.filter("todos"));
				// console.log(todo);
				let todo_list = Task.create_task_list(todo);
				document.getElementById("todos").appendChild(todo_list);

				// doneの作成
				let done = data.filter(Task.filter("dones"));
				// console.log(done);
				let done_list = Task.create_task_list(done);
				document.getElementById("dones").appendChild(done_list);

				// タスクの状態を数える
				Task.progress_count();
			}
		}
	}).send(null);

	// タスクを追加するボタンを追加
	document.getElementById("append_task").addEventListener("click", Task.append_task);
	// member
	document.getElementById("member_list").addEventListener("click", Base.member);
	// ログアウトのボタン
	document.getElementById("logout").addEventListener("click", Base.logout);
	// 要望ボタン
	document.getElementById("github").addEventListener("click", Base.request);
	// タスクを監視し、変化があれば数を数え直す
	let mo = new MutationObserver(Task.progress_count);
	mo.observe(document.querySelector(".todo_area"), {
		childList: true,
		subtree: true,
	});


	// コメントを取得するタイマーのセット
	Timeline.set_timer();

	// コメント入力欄のイベント
	// 入力欄の状態によってボタンの表示を変える
	document.getElementById("comment").addEventListener("input", Timeline.check_comment_textarea);
	// コメントの送信を行うためのイベント設定
	const button = document.getElementById("comment_button");
	button.addEventListener("click", Timeline.append);
	button.disabled = true;


	// このページでNotificationAPIを使うための準備
	Notify.init();
}