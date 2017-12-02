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

	get_task_info: function(modal, task) {
		// タスク名の取得
		let task_name = task.querySelector(".task_name").textContent;
		// 予想時間の取得
		let plan = task.dataset.expected_time;
		if (plan !== "") {
			plan = parseFloat(plan, 10);
		}

		let time = task.dataset.progress;
		if (time !== "") {
			time = parseFloat(time, 10);
		}
		// タスクの内容の取得
		let explain = task.querySelector(".task_detail_text").innerHTML;
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
		modal.task_id.value = task.id.split(":").pop();
	},

	set_task_memo: function(modal, task) {
		modal.task_id.value = task.id.split(":").pop();
		modal.end_details.value = task.querySelector(".end_text").innerHTML.replace(/<br>/g, "\n");
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
					let task = Task.create_task_list(data);
					let old_task = document.getElementById("task_id:" + data[0].task_id);
					//console.log("callback_send_modify", task);
					old_task.parentElement.replaceChild(task, old_task);
					// new Chart("canvas", response.chart).render();
				}
				Modal.remove();
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