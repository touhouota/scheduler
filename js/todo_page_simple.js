window.onload = function() {
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
};