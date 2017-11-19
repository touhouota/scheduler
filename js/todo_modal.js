let Modal = {
	create_task_modify: function(event) {
		// 初期状態を作成
		Modal.init();
		// タスクのmodalの初期化
		let modal = Modal.task_modify_init();
		modal.id = "modify_modal";
		let task = Base.parents(event.target, "task");
		Modal.get_task_info(modal, task);

		document.body.appendChild(modal);

		// 中央に表示
		Modal.centering(modal);
	},

	create_time_modify: function(event) {
		// 初期化
		Modal.init();
		// 時間のmodalを初期化
		let modal = Modal.time_modify_init();
		modal.id = "modify_modal";
		// ターゲットとなるtaskを取得
		let task = Base.parents(event.target, "task");
		Modal.get_time_info(modal, task);

		// documentに追加
		document.body.appendChild(modal);

		// modalを中央揃え
		Modal.centering(modal);
	},

	// すべてのモーダル作成における、初期状態の作成
	init: function(task_info) {
		let div = document.createElement("div");
		div.id = "modal_back";
		// 黒背景をクリックされたら、modalを消す
		div.addEventListener("click", Modal.remove);
		// documentへ追加
		document.body.appendChild(div);

		// スクロールしないように制御
		document.body.classList.add("noscroll");
	},

	// タスク情報のmodalの初期化
	task_modify_init: function() {
		let _modify_modal = document.getElementById("task_modify");
		let modal = document.importNode(_modify_modal.content, true);
		// フォームの内容をサーバへ送るイベント
		modal.querySelector(".modify_button").addEventListener("click", Modal.send_modify);
		// モーダルの「閉じる」を押した時のイベント
		modal.querySelector(".close").addEventListener("click", Modal.remove);
		return modal.firstElementChild;
	},

	// 経過時間の修正modalの初期化
	time_modify_init: function() {
		let _modify_modal = document.getElementById("time_modify");
		let modal = document.importNode(_modify_modal.content, true);
		// フォームの内容をサーバへ送るイベント
		modal.querySelector(".modify_button").addEventListener("click", Modal.send_modify);
		// モーダルの閉じるを押した時のイベント
		modal.querySelector(".close").addEventListener("click", Modal.remove);

		return modal.firstElementChild;
	},

	get_task_info: function(modal, task) {
		// タスク名の取得
		let task_name = task.querySelector(".task_name").textContent;
		// 予想時間の取得
		let plan = task.querySelector(".image > .time").textContent;
		if (plan !== "---") {
			plan = parseFloat(plan, 10);
		} else {
			plan = "";
		}
		// タスクの内容の取得
		let explain = task.querySelector(".task_detail_text").innerHTML;
		console.log(explain);
		let default_detail = "詳細を決めていません<br>タスクを実行する前に決めよう！";
		if (explain !== default_detail) {
			explain = explain.replace(/<br>/g, "\n");
		} else {
			explain = "";
		}

		modal.task_name.value = task_name;
		modal.task_hour.value = plan;
		modal.task_detail.value = explain;
		modal.task_id.value = task.id.split(":").pop();
	},

	get_time_info: function(modal, task) {
		// taskにある経過時間を取得し、:で分ける
		let _time = task.querySelector(".time_area > .real").textContent.split("：").pop();
		let time = _time.split(":");
		console.log(time);
		// それぞれを、指定する
		modal.hour.value = Number(time[0]);
		modal.minute.value = Number(time[1]);
		modal.second.value = Number(time[2]);
		// タスクidを付加
		modal.task_id.value = task.id.split(":").pop();
	},

	centering: function(modal) {
		let width = window.innerWidth;
		let height = window.innerHeight;

		console.log(modal);
		let modal_width = modal.offsetWidth;
		let modal_height = modal.offsetHeight;
		modal.style.left = ((width - modal_width) / 2) + "px";
		modal.style.top = ((height - modal_height) / 2) + "px";
	},

	remove: function() {
		// modal本体を削除
		let modal = document.getElementById("modify_modal");
		document.body.removeChild(modal);


		// 背景の黒を削除
		let remove_target = document.getElementById("modal_back");
		remove_target.parentElement.removeChild(remove_target);

		document.body.classList.remove("noscroll");
	},

	send_modify: function(event) {
		let form = Base.parents(event.target, "modal");
		post = [
			"cmd=task_modify",
			"&user_id=" + Base.get_cookie('user_id'),
			"&task_id=" + form.task_id.value,
		].join("");

		// TODO: switchに書き換え
		if (form.classList.contains("task_modify")) {
			// こちらは、タスクの情報を変更する時
			post = [
				post,
				"&task_name=", form.task_name.value,
				"&hour=", form.task_hour.value,
				"&task_detail=", encodeURIComponent(form.task_detail.value),
			].join("");
		} else if (form.classList.contains("time_modify")) {
			// 時間の修正に関する修正
			let hour = Number(form.hour.value);
			let min = Number(form.minute.value);
			let sec = Number(form.second.value);
			post = [
				post,
				"&time=", (hour * 3600) + (min * 60) + sec,
			].join("");
		}

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				console.table(response.data);
				if (response.ok) {
					const data = response.data;
					let task = Task.create_task_list(data);
					let old_task = document.getElementById("task_id:" + data[0].task_id);
					//console.log("callback_send_modify", task);
					old_task.parentElement.replaceChild(task, old_task);
					// new Chart("canvas", response.chart).render();
				}
				Modal.remove();
			}
		}).send(post);
	}
}
