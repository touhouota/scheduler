let Task = {
	create_task_list: function(task_list) {
		let fragment = document.createDocumentFragment();
		let todo_fragment = document.createDocumentFragment();
		let done_fragment = document.createDocumentFragment();
		let _template = document.getElementById("task_template");
		let template = document.importNode(_template.content, true);
		if (!task_list) {
			// からの場合は何もしない
			return;
		}
		task_list.forEach(function(item) {
			let task = template.cloneNode(true).firstElementChild;
			// iconの設定
			Task._setting_task_icon(task, item);
			// タスクの情報に関するもの
			Task._setting_task_info(task, item);
			// タスクのクラスを付け替える
			Task._decoration(task, item.status);

			// もし、状態が実行中ならそうする
			if (item.status === 1) {
				// タイマーを実行する
				ProgressTimer.set(task);
			}

			console.log(item.status);
			if ([2, 3].includes(item.status)) {
				// 完了しているものは、doneの位置に
				done_fragment.appendChild(task);
			} else {
				// 完了していないものはtodoの位置に
				todo_fragment.appendChild(task);
			}
		});
		// todo / doneの順番にする
		fragment.appendChild(todo_fragment);
		fragment.appendChild(done_fragment);
		return fragment;
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
					let target = document.getElementById("today_list");
					target.insertBefore(task, target.firstElementChild);
				}
			}
		}).send(post);
	},


	// タスクの情報を付加する
	_setting_task_info: function(task, info) {
		// idをつける
		task.id = "task_id:" + info.task_id;
		// タスク名
		task.querySelector(".task_name").textContent = info.task;

		// 時間が計画されていれば、それを表示
		if (info.hour) {
			task.querySelector(".image > .time").textContent = Base.round_at(info.hour, 5);
		}

		// 経過時間
		if (info.time) {
			task.dataset.progress = info.time;
			task.querySelector(".real > .time").textContent = ProgressTimer.convert_hms_from_seconds(info.time);
		} else {
			task.dataset.progress = 0;
		}



		if (info.task_detail) {
			task.querySelector(".task_detail_text").innerHTML = info.task_detail.replace(/\r?\n/g, "<br>");
		}

		if (info.start_time) {
			task.dataset.start_time = info.start_time;
		}

		// タスクの状態変化イベント
		task.querySelector(".task_status").addEventListener("click", Task.change_status);

		// タスク情報を更新するときのクリックイベント
		task.querySelector(".modal_open").addEventListener("click", Modal.create_task_modify);

		// タスクの経過時間修正用のmodalにイベント
		task.querySelector(".time_modal_open").addEventListener("click", Modal.create_time_modify);

		// 終了時のイベントを付加
		task.querySelector(".task_finish_area").addEventListener("click", Task.finish);
	},

	// アイコンの設定
	_setting_task_icon: function(task, info) {
		let icon = task.querySelector(".task_status");
		console.log(icon);
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
			plan.push(task.hour * 60);
			real.push(task.time / 60);
		});

		console.table(plan);
		console.table(real);

		return {
			plan: plan,
			real: real,
		}
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
			alert("まずは、時間の見積もり・作業内容を決めましょう！");
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

		console.log("status_change", task);

		if (task.dataset.status === '1') {
			let progress = ProgressTimer.calc_diff_seconds(task);
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

	// タスクの内容を決めてあるかの確認
	// true: 決められていない、false: 決められてる
	_check_detail_empty: function(task) {
		const default_text = "詳細を決めていません<br>タスクを実行する前に決めよう！";
		if (task.querySelector(".task_detail_text").innerHTML === default_text) {
			return true;
		}
		return false;
	},

	// タスクの時間が決まっているのかを確認する
	_check_plan_empty: function(task) {
		const default_text = '---';
		if (task.querySelector(".image > .time").textContent === default_text) {
			return true;
		}
		return false;
	},

	// タスクの表示を切り替える
	_decoration: function(task, status) {
		console.log("decoration", status);
		if (status === 1) {
			task.getElementsByClassName("end_detail")[0].open = true;
			task.classList.add("highlight");
			task.querySelector(".task_sub").classList.remove("hide");
		} else {
			console.log("閉じるはず");
			task.getElementsByClassName("end_detail")[0].open = false;
			task.classList.remove("highlight");
			task.querySelector(".task_sub").classList.add("hide");
		}
	},

	// task終了のイベント
	finish: function(e) {
		let finish_status = Base.parents(e.target, "finish");
		let task = Base.parents(finish_status, "task");
		let status = finish_status.dataset.status;
		let task_id = task.id.split(":").pop();
		console.log("finish_task", status, task_id);
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

					// 終わった旨を表示する
					let text = task_info.task + "に区切りをつけました！";
					alert(text);
				}
			}
		}).send(query);
	},
}
