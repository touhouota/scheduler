let Task = {
	parent: [],
	child: [],
	tree: {},
	create_task_list: function(task_list) {
		let fragment = document.createDocumentFragment();
		if (!task_list) {
			// からの場合は何もしない
			return;
		}
		task_list.forEach(function(item) {
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

		// もし、状態が実行中ならそうする
		if (task_info.status === 1) {
			// タイマーを実行する
			ProgressTimer.set(task);
		}
		// タスクの作成
		return task;
	},

	get_parents: function() {
		const query = "?cmd=task_parent&user_id=" + Base.get_cookie("user_id");
		Base.create_request("GET", Base.request_path + query, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				// console.table(response.data);
				if (response.ok) {
					let data = response.data;
					let fragment = document.createDocumentFragment();
					for (let i = 0; i < data.length; i++) {
						let task_info = data[i];
						let task = Task.create_task(task_info);
						Task.tree[task_info.task_id] = [];
						Task.parent.push(task_info.task_id);

						fragment.appendChild(task);
					}
					document.getElementById("todos").appendChild(fragment);
					// 親の処理が終われば、子供を取得
					Task.get_child();
				}
			}
		}).send(null);
	},

	get_child: function() {
		let parents = Object.keys(Task.tree);
		console.log(parents);
		parents.forEach(function(parent_id) {
			let query = [
				"?cmd=task_child",
				"&parent=", parent_id,
				"&user_id=" + Base.get_cookie("user_id"),
			].join("");
			Base.create_request("GET", Base.request_path + query, function() {
				if (this.status == 200 && this.readyState == 4) {
					let response = JSON.parse(this.responseText);
					if (response.ok) {
						let data = response.data;
						console.table(data);

						// 子供がいない場合は、何もしない
						if (response.data.length === 0) {
							return;
						}
						// 子供をひとまとめにするfragment作成
						let fragment = document.createDocumentFragment();

						data.forEach(function(item) {
							Task.tree[item.parent].push(item.task_id)
							Task.child.push(item.task_id);
							let subtask = Task.create_task(item);
							subtask.classList.add("sub");
							fragment.appendChild(subtask);
						});

						let sub = document.getElementById("task_id:" + data[0].parent).querySelector(".subtask_list");
						sub.appendChild(fragment);

						let tasks = document.querySelectorAll(".task");
						for (i = 0; i < tasks.length; i++) {
							ProgressTimer.display(tasks[i]);
						}
					}
				}
			}).send(null);
		});
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
		let subtask = template.cloneNode(true).firstElementChild;


		// タスク情報を付加
		Task._setting_subtask(subtask, task_info);

		return subtask;
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

		// 予想時間
		if (info.expected_time) {
			task.dataset.expected_time = info.expected_time;
			task.querySelector(".plan_time").textContent = info.expected_time;
		} else {
			task.dataset.expected_time = 0;
		}

		// グラフを描画
		ProgressTimer.display(task);

		if (info.memo) {
			task.querySelector(".memo").innerHTML = info.memo.replace(/\r?\n/g, "<br>");
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

		// サブタスクを追加する
		task.querySelector(".subtask").addEventListener("click", Modal.create_subtask);

		// 親タスクを終わらせる
		task.querySelector(".finish").addEventListener("click", Task.finish);

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

	// サブタスクの情報を付加する
	_setting_subtask: function(task, info) {
		console.log("setting_subtask");
		console.table(info);
		task.querySelector(".task_name").textContent = info.task_name;
		task.id = "task_id:" + info.task_id;
		// 親タスクの情報
		task.dataset.parent = info.parent;

		// タスクに予想時間の情報を付加
		if (info.expected_time) {
			task.dataset.plan = info.expected_time;
			task.querySelector(".plan").textContent = task.dataset.plan;
			task.querySelector(".plan > .time").textContent = task.dataset.plan;
		}

		// 実際の作業時間を付加
		if (info.actual_time) {
			task.querySelector(".real > .time").textContent = info.actual_time;
			task.dataset.progress = info.actual_time;
		}

		// タスクの情報を付加
		if (info.memo) {
			// 改行文字をbrタグに置き換え。
			task.querySelector(".memo").innerHTML = info.memo.replace(/\r?\n/g, "<br>");
		}

		// タスクの状態変化のためのイベント
		task.querySelector(".task_status").addEventListener("click", Task.change_status);

		// タスク情報を更新するときのクリックイベント
		task.querySelector(".modify").addEventListener("click", Modal.create_task_modify);
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
					// Task._decoration(target_task, task_info.status);
				}
			}
		}).send(query);

	},
	// 


	// タスクの内容を決めてあるかの確認
	// true: 決められていない、false: 決められてる
	_check_detail_empty: function(task) {
		if (task.querySelector(".memo").innerHTML.replace(/\s/g, "").length === 0) {
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
					// Task._decoration(target_task, task_info.status);
					// 終了したものは終了した場所に置く
					let dones = document.getElementById("dones");
					console.log("finish_task, target_task", target_task);
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

	// subtaskの数を数える
	subtask_count: function() {
		let tasks = document.getElementById("todos").children;
		let i = 0,
			length = tasks.length;
		for (i = 0; i < length; i += 1) {
			// console.log("subtask", tasks[i]);
			// subtask_listの子供を配列として貰おう
			let subs = tasks[i].querySelector(".subtask_list").children;
			// その大きさをつけよう
			tasks[i].querySelector(".todo_num").textContent = subs.length;
			if (subs.length === 0) {
				tasks[i].querySelector(".subtask_area").classList.add("hide");
				tasks[i].querySelector(".finish").classList.remove("hide");
			} else {
				tasks[i].querySelector(".subtask_area").classList.remove("hide");
				tasks[i].querySelector(".finish").classList.add("hide");
			}
		}
	},
};