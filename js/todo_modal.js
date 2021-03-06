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

		// モーダル内のタスク名入力欄にフォーカスを入れる。
		modal.querySelector("[name=task_name]").focus();

		// 中央に表示
		Modal.centering(modal);
	},

	create_end_memo: function(event) {
		// 初期化
		Modal.init();
		// 終了時のmodalを初期化
		let modal = Modal.end_memo_init();
		modal.id = "modify_modal";
		// ターゲットとなるtaskを取得
		let task = Base.parents(event.target, "task");
		console.log("memo", task);
		Modal.set_task_memo(modal, task);

		// documentに追加
		document.body.appendChild(modal);
		// テキストエリアにfocusを当てる(Firefoxのための処理)
		modal.querySelector("[name=end_details]").focus();

		// modalを中央揃え
		Modal.centering(modal);
	},

	create_subtask: function(event) {
		Modal.init();
		// サブタスクのモーダル初期化
		let modal = Modal.subtask_init();
		modal.id = "modify_modal";
		// 親要素を取得
		let parent_task = Base.parents(event.target, "task");
		Modal.set_parent_info(modal, parent_task);

		document.body.appendChild(modal);
		// モーダル内のタスク名入力欄にフォーカスを入れる。
		modal.querySelector("[name=task_name]").focus();

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
		// ↑イベント
		modal.querySelectorAll(".up").forEach(function(item) {
			item.addEventListener("click", {
				button: "UP",
				handleEvent: Modal.change_plan,
			});
		});
		// ↓イベント
		modal.querySelectorAll(".down").forEach(function(item) {
			item.addEventListener("click", {
				button: "DOWN",
				handleEvent: Modal.change_plan,
			});
		});

		// フォームの内容をサーバへ送るイベント
		modal.querySelector(".modify_button").addEventListener("click", Modal.send_modify);
		// モーダルの「閉じる」を押した時のイベント
		modal.querySelector(".close").addEventListener("click", Modal.remove);
		return modal.firstElementChild;
	},

	// 経過時間の修正modalの初期化
	end_memo_init: function() {
		let _modify_modal = document.getElementById("end_details");
		let modal = document.importNode(_modify_modal.content, true);
		// フォームの内容をサーバへ送るイベント
		modal.querySelector(".modify_button").addEventListener("click", Modal.send_modify);
		// モーダルの閉じるを押した時のイベント
		modal.querySelector(".close").addEventListener("click", Modal.remove);

		return modal.firstElementChild;
	},

	subtask_init: function() {
		const _modal = document.getElementById("subtask_modal");
		let modal = document.importNode(_modal.content, true);

		// フォームの内容をサーバへ送るイベント
		modal.querySelector(".modify_button").addEventListener("click", Modal.send_subtask);
		// モーダルの閉じるを押した時のイベント
		modal.querySelector(".close").addEventListener("click", Modal.remove);

		// ↑イベント
		modal.querySelectorAll(".up").forEach(function(item) {
			item.addEventListener("click", {
				button: "UP",
				handleEvent: Modal.change_plan,
			});
		});
		// ↓イベント
		modal.querySelectorAll(".down").forEach(function(item) {
			item.addEventListener("click", {
				button: "DOWN",
				handleEvent: Modal.change_plan,
			});
		});

		return modal.firstElementChild;
	},

	get_task_info: function(modal, task) {
		// タスク名の取得
		let task_name = task.querySelector(".task_name").textContent;
		// 予想時間の取得
		let plan = task.dataset.expected_time;
		console.log(plan);
		if (plan !== "") {
			plan = parseFloat(plan, 10);
		}

		let time = task.dataset.progress;
		if (time !== "") {
			time = parseFloat(time, 10);
		}
		// タスクの内容の取得
		let explain = task.querySelector(".memo").innerHTML.trim();
		console.log(explain);
		// から文字を省いて、大きさが0 => 何も入っていない
		if (explain.replace(/\s+/g, "").length !== 0) {
			explain = explain.replace(/<br>/g, "\n");
		} else {
			explain = "";
		}

		modal.task_name.value = task_name;
		modal.task_plan.value = plan;
		modal.task_time.value = Math.round(time / 60);
		modal.task_detail.value = explain;
		modal.parent.value = task.dataset.parent || "";
		modal.task_id.value = task.id.split(":").pop();
	},

	set_task_memo: function(modal, task) {
		modal.task_id.value = task.id.split(":").pop();
		modal.end_details.value = task.querySelector(".end_text").innerHTML.replace(/<br>/g, "\n");
	},

	// サブタスク用の初期情報を追加
	set_parent_info: function(modal, task) {
		// 親タスク名を表示
		modal.querySelector(".parent_name").textContent = task.querySelector(".task_name").textContent;
		modal.querySelector("[name=parent]").value = task.id.split(":").pop();

	},

	centering: function(modal) {
		let width = window.innerWidth;
		let height = window.innerHeight;

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
		let post = null;
		if (form.classList.contains("task_modify")) {
			post = [
				"cmd=task_modify",
				"&user_id=" + Base.get_cookie('user_id'),
				"&task_id=" + form.task_id.value,
				"&parent=", form.parent.value,
				"&task_name=", form.task_name.value,
				"&plan=", form.task_plan.value,
				"&time=", Number(form.task_time.value) * 60,
				"&task_detail=", encodeURIComponent(form.task_detail.value),
			].join("");
		} else if (form.classList.contains("end_memo")) {
			post = [
				"cmd=task_modify",
				"&user_id=" + Base.get_cookie("user_id"),
				"&task_id=" + form.task_id.value,
				"&parent=", form.parent.value,
				"&end_detail=" + form.end_details.value,
			].join("");
		} else {
			return;
		}

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				console.table(response.data);
				if (response.ok) {
					const data = response.data;
					let new_task = Task.create_task(data[0]);
					let old_task = document.getElementById("task_id:" + data[0].task_id);
					old_task.parentElement.replaceChild(new_task, old_task);

					if (data[0].parent === null) {
						// parentに値がなければ、親タスク
						Task.get_child(data[0].task_id);
					} else {
						new_task.classList.add("sub");
					}
				}
				Modal.remove();
			}
		}).send(post);
	},

	send_subtask: function(event) {
		console.log("send_subtask");
		let form = Base.parents(event.target, "modal");
		let post = [
			"cmd=append_subtask",
			"&task_name=" + form.task_name.value,
			"&user_id=" + Base.get_cookie("user_id"),
			"&plan=" + form.task_plan.value,
			"&task_detail=" + form.memo.value,
			"&parent=" + form.parent.value,
			"&date=" + Date(),
		].join("");

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				console.table(response.data);
				if (response.ok) {
					const data = response.data[0];
					let subtask = Task.create_task(data);
					subtask.classList.add("sub");
					let task = document.getElementById("task_id:" + data.parent);
					// サブタスク追加時、親にはparentクラスをつける
					task.classList.add("parent");
					task.querySelector(".subtask_list").appendChild(subtask);

					// サブタスクを作ったら、追加する
					Task.child["task_id:" + data.task_id] = false;
				}
				// modalを初期化
				form.reset();
				// 入力欄にfocus
				form.task_name.focus();
			}
		}).send(post);
	},

	change_plan: function(event) {
		let button = event.target;
		let modal = Base.parents(button, "modal");
		let modify = null;
		if (button.classList.contains("plan_button")) {
			modify = modal.querySelector(".modal_plan");
		} else if (button.classList.contains("real_button")) {
			modify = modal.querySelector(".modal_real");
		} else {
			// ここに入る場合は、想定外の場合
			return;
		}
		let time = Number(modify.value);

		if (this.button === "UP") {
			time += 5;
		} else if (this.button === "DOWN") {
			time -= 5;
		}

		// 0 より小さくしない
		if (time < 0) {
			time = 0;
		}

		modify.value = time;
	},
};