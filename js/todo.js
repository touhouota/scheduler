let Task = {
	create_task_list: function(task_list) {
		let fragment = document.createDocumentFragment();
		if (!task_list) {
			// からの場合は何もしない
			return;
		}
		task_list.forEach(function(item) {
			// タスクを作る
			let task = Task.create_task(item);
			fragment.appendChild(task);
		});

		return fragment;
	},

	create_task: function(task_info) {
		let _template = document.getElementById("todo_template");
		let template = document.importNode(_template.content, true);
		let task = template.cloneNode(true).firstElementChild;
		// iconの設定
		Task._setting_task_icon(task, task_info);
		// タスクの情報に関するもの
		Task._setting_task_info(task, task_info);
		// タスクのクラスを付け替える
		// Task._decoration(task, task_info.status);

		// もし、状態が実行中ならそうする
		if (task_info.status === 1) {
			// タイマーを実行する
			ProgressTimer.set(task);
		}
		// タスクの作成
		return task;
	},

	// 引数の状態により、filterを返す
	filter: function(status) {
		if (status === "todos") {
			return function(item) {
				return ![2, 3].includes(item.status);
			}
		} else if (status === "dones") {
			return function(item) {
				return [2, 3].includes(item.status);
			}
		}
	},

	// タスクの追加をサーバへ送る
	append_task: function() {
		var input = prompt("タスク名を入力してください");
		if (!input) {
			// escを押されたとき、テキストがからのとき。
			return;
		}
		// これ以降は、タスクの名前が入力されている
		const post = [
			"cmd=append_task",
			"&task_name=", encodeURIComponent(input),
			"&user_id=", Base.get_cookie('user_id'),
			"&date=", Date(),
		].join("");

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				console.table(response.data);
				if (response.ok) {
					let task = Task.create_task_list(response.data);
					// document.getElementById("today_list").appendChild(task);
					let target = document.getElementById("todos");
					target.insertBefore(task, target.firstElementChild);
				}
			}
		}).send(post);
	},

	// subtask作成を行う。
	create_subtask: function(task_info) {
		let _template = document.getElementById("subtask_template");
		let template = document.importNode(_template.content, true);
		let task = template.cloneNode(true).firstElementChild;

		// iconの設定
		Task._setting_task_icon(task, task_info);
		// タスク情報を付加
		Task._setting_task_info(task, task_info);
	},

	// subtaskを追加する
	append_subtask: function(event) {
		let parent_task = Base.parents(event.target, "task");
		var input = prompt("サブタスク名を入力してください");
		if (!input) {
			// escを押されたとき、テキストがからのとき。
			return;
		}

		// これ以降は、タスクの名前が入力されている
		const post = [
			"cmd=append_subtask",
			"&task_name=", encodeURIComponent(input),
			"&user_id=", Base.get_cookie('user_id'),
			"&date=", Date(),
			"&parent=", parent_task.id.split(":").pop(),
		].join("");

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				console.table(response.data);
				if (response.ok) {
					console.log("hoge");
				}
			}
		}).send(post);
	},


	// タスクの情報を付加する
	_setting_task_info: function(task, info) {
		// idをつける
		task.id = "task_id:" + info.task_id;
		// タスク名
		task.querySelector(".task_name").textContent = info.task_name;

		// 経過時間
		if (info.actual_time) {
			task.dataset.progress = info.actual_time;
		} else {
			task.dataset.progress = 0;
		}

		// 時間を
		let canvas = task.querySelector("canvas");
		let time = (info.actual_time / 60).toFixed(2);
		Chart.draw(canvas, [info.expected_time], [time]);
		// 予想時間
		if (info.expected_time) {
			task.dataset.expected_time = info.expected_time;
		} else {
			task.dataset.expected_time = 0;
		}

		if (info.memo) {
			task.querySelector(".task_detail_text").innerHTML = info.memo.replace(/\r?\n/g, "<br>");
		}

		if (info.start_time) {
			task.dataset.start_time = info.start_time;
		}

		if (info.reflection) {
			task.querySelector(".end_text").innerHTML = info.reflection.replace(/\r?\n/g, "<br>");
		}

		// タスクの状態変化イベント
		task.querySelector(".task_status").addEventListener("click", Task.change_status);

		// タスク情報を更新するときのクリックイベント
		task.querySelector(".modify").addEventListener("click", Modal.create_task_modify);

		task.querySelector(".subtask").addEventListener("click", Task.append_subtask);

		// 終了時のイベントを付加
		task.querySelector(".finish_task").addEventListener("click", Task.finish);
		task.querySelector(".finish_task").addEventListener("click", Modal.create_end_memo);
	},

	// アイコンの設定
	_setting_task_icon: function(task, info) {
		let icon = task.querySelector(".task_status");
		// console.log(icon);
		icon.classList.add("task_info");
		// hogehoge.pngの部分を置換する
		let src_regexp = new RegExp(/[^/]+.png/);
		// icon.setAttribute("status", info.status);
		task.dataset.status = info.status;
		switch (info.status) {
			case 1:
				icon.src = icon.src.replace(src_regexp, "start.png");
				break;
			case 2:
				icon.src = icon.src.replace(src_regexp, "succ.png");
				break;
			case 3:
				icon.src = icon.src.replace(src_regexp, "nosucc.png");
				break;
			case 4:
				icon.src = icon.src.replace(src_regexp, "pause.png");
				break;
		}
		// ファビコンをセットする
		Task.change_favicon(info.status);
	},

	calc_task_time: function(task_list) {
		let plan = [],
			real = [];
		task_list.forEach(function(task) {
			plan.push(task.plan);
			real.push(task.time / 60);
		});

		return {
			plan: plan,
			real: real,
		}
	},

	// サブタスクの情報を付加する
	_setting_subtask: function(task, info) {
		task.querySelector(".task_name").textContent = info.task_name;
	},

	change_favicon: function(status) {
		var favicon = document.getElementById("favicon");
		if (status == 1) {
			favicon.href = "./image/start.ico";
		} else {
			favicon.href = "./image/stop.ico";
		}
	},

	// クリックされたら、状態を更新する
	// 変化した先の状態を送る
	change_status: function(event) {
		let task = Base.parents(event.target, "task");
		// 実行前、タスクの情報が付加されていない場合は一旦止める
		if (Task._check_detail_empty(task) || Task._check_plan_empty(task)) {
			Notify.create_instance("まずは、時間の見積もり・作業内容を決めましょう！");
			Modal.create_task_modify(event);
			return;
		}

		// ここまで来た時は、すべてが登録されているとき
		let progress;

		let query = [
			"cmd=status_change",
			"&user_id=", Base.get_cookie('user_id'),
			// task_id:XXX という形式なので、:で分けて後ろの要素を取得する
			"&task_id=", task.id.split(":").pop(),
		].join("");

		// console.log("status_change", task);

		if (task.dataset.status === '1') {
			let progress = ProgressTimer.calc_diff_seconds(task);
			// console.log("タスクを停止。時間:", progress);
			// タイマーを無効にする
			ProgressTimer.clear(task);
			// 実行中(1)の時は、一時停止にする(4)
			query = [query, "&status=4", "&time=",
				Math.floor(progress),
				"&start_time=", encodeURIComponent(task.dataset.start_time),
			].join("");
		} else {
			// タイマーを実行する
			ProgressTimer.set(task);
			// 実行中(1)以外の時は実行中にする
			query = [query,
				"&status=1",
				"&start_time=",
				encodeURIComponent(task.dataset.start_time),
			].join("");
		}

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				if (response.ok) {
					let task_info = response.data.shift();
					// console.table(task_info);
					let target_task = document.getElementById("task_id:" + task_info.task_id);
					// 新しく来たタスクの情報をもとに、書き換える
					Task._setting_task_info(target_task, task_info);
					Task._setting_task_icon(target_task, task_info);
					Task._decoration(target_task, task_info.status);
				}
			}
		}).send(query);

	},
	// 


	// タスクの内容を決めてあるかの確認
	// true: 決められていない、false: 決められてる
	_check_detail_empty: function(task) {
		if (task.querySelector(".task_detail_text").innerHTML.replace(/\s/g, "").length === 0) {
			return true;
		}
		return false;
	},

	// タスクの時間が決まっているのかを確認する
	_check_plan_empty: function(task) {
		const default_text = '0';
		if (task.dataset.expected_time === default_text) {
			return true;
		}
		return false;
	},

	// タスクの表示を切り替える
	_decoration: function(task, status) {
		// console.log("decoration", status);
		let canvas = task.querySelector(".canvas");
		if (status === 1) {
			// 実行中の印を付ける
			task.classList.add("doing");
			// canvasの大きさを大きくする
			canvas.width = 350;
			canvas.height = 200;

			// タスクを移動させる
			document.getElementById("doing_area").appendChild(task);
		} else {
			// 実行中の印を消す
			task.classList.remove("doing");
			// canvasを初期の大きさに戻す
			canvas.width = 150;
			canvas.height = 100;
			// タスクを移動させる
			let todo = document.getElementById("todos");
			todo.insertBefore(task, todo.firstElementChild);
		}
		// グラフの再描画
		const time = task.dataset.progress / 60;
		Chart.draw(canvas, [task.dataset.expected_time], [time.toFixed(2)]);
	},

	// task終了のイベント
	finish: function(e) {
		let finish_status = Base.parents(e.target, "finish");
		let task = Base.parents(finish_status, "task");
		let status = finish_status.value;
		let task_id = task.id.split(":").pop();
		// console.log("finish_task", status, task_id);
		// 経過時間を計測
		let progress = ProgressTimer.calc_diff_seconds(task);
		// タスクのタイマーを停止
		ProgressTimer.clear(task);

		let query = [
			"cmd=status_change",
			"&task_id=", task_id,
			"&user_id=", Base.get_cookie('user_id'),
			'&status=', status,
			'&start_time=',
			'&time=', progress,
		].join("");

		Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				if (response.ok) {
					let task_info = response.data.shift();
					// console.table(task_info);
					let target_task = document.getElementById("task_id:" + task_info.task_id);
					// 新しく来たタスクの情報をもとに、書き換える
					Task._setting_task_info(target_task, task_info);
					Task._setting_task_icon(target_task, task_info);
					Task._decoration(target_task, task_info.status);
					// 終了したものは終了した場所に置く
					let dones = document.getElementById("dones");
					dones.insertBefore(target_task, dones.firstElementChild);

					// 終わった旨を表示する
					let text = task_info.task + "に区切りをつけました！";
					Notify.create_instance(text);
				}
			}
		}).send(query);
	},

	// タスクの状態ごとに数を数える
	progress_count: function() {
		let tasks = document.querySelectorAll(".task");
		let count = {
			done: 0,
			imperfect: 0,
			todo: 0,
		};

		tasks.forEach(function(item) {
			// console.log(item, item.dataset.status, count.todo);
			switch (Number(item.dataset.status)) {
				case 0:
				case 1:
				case 4:
					count.todo += 1;
					break;
				case 2:
					count.done += 1;
					break;
				case 3:
					count.imperfect += 1;
					break;
				default:
					console.log("naiyou");
			};
		});

		document.querySelectorAll(".num").forEach(function(item) {
			if (item.classList.contains("todo")) {
				item.textContent = count.todo;
			} else if (item.classList.contains("done")) {
				item.textContent = count.done;
			} else {
				item.textContent = count.imperfect;
			}
		});
	},
};