window.onload = function() {
	if (!Base.get_cookie('user_id')) {
		// ここに入った場合はidがない
		window.location = "/b1013179/scheduler/index.html";
	}
	// タスク取得
	Task.get_parents();

	// コメントを取得するタイマーのセット
	Timeline.set_timer();

	// タスクを追加するボタンを追加
	document.getElementById("append_task").addEventListener("click", Task.append_task);
	// ログアウトのボタン
	document.getElementById("logout").addEventListener("click", Base.logout);
	// 要望ボタン
	document.getElementById("github").addEventListener("click", Base.request);
	// 仲間
	document.getElementById("member").addEventListener("click", Base.member);

	// タスクを監視し、変化があれば数を数え直す
	new MutationObserver(Task.progress_count).observe(document.querySelector(".todo_area"), {
		childList: true,
		subtree: true,
	});


	// コメント入力欄のイベント
	// 入力欄の状態によってボタンの表示を変える
	document.getElementById("comment").addEventListener("input", Timeline.check_comment_textarea);
	// コメントの送信を行うためのイベント設定
	const button = document.getElementById("comment_button");
	button.addEventListener("click", Timeline.append);
	button.disabled = true;


	// このページでNotificationAPIを使うための準備
	Notify.init();
};