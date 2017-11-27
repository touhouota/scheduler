let Members = {
	// 状態を保持する
	status_array: ["stop", "start", "success", "nosucc", "pause"],

	create_task: function(task_data) {
		let i = 0;
		let array = [];
		for (i = 0; i < 4; i++) {
			array.push(document.createDocumentFragment());
		}
		// 状態が4のものは、0と扱う
		array.push(array[0]);

		let _template = document.getElementById("task_template");
		let _task = document.importNode(_template.content, true);

		// タスクの情報を付加する
		task_data.forEach(function(item) {
			let task = _task.cloneNode(true);
			Members._setting_task_info(task, item);
			array[item.status].appendChild(task);
		});

		let task_box = document.getElementsByClassName("task_box");
		for (i = 0; i < 4; i++) {
			task_box[i].appendChild(array[i]);
		}
		task_box[0].appendChild(array[4]);
	},

	change_date: function(e) {
		let date = e.target;
		Members.get_list_from_date(new Date(date.value));
	},

	get_list_from_date: function(date) {
		let date_str = Base.format_ymd(date);

		let query = [
			"?cmd=date",
			"&user_id=", Base.get_cookie('user_id'),
			"&date=", date_str
		].join("")

		Base.create_request("GET", Base.request_path + query, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				if (response.ok) {
					Members.reset_page();
					Members.create_task(response.data);
				}
			}
		}).send(null);
	},

	// タスクの情報を付加する
	_setting_task_info: function(dom, task_info) {
		let task = dom.querySelector(".task");
		task.id = "task_id:" + task_info.task_id;
		task.classList.add(task_info.user_id);
		// タスク名を付加
		task.querySelector(".task_name").textContent = task_info.task;

		// タスクの状態を付加
		task.dataset.status = task_info.status;

		// タスクのアイコンを設定する
		console.log(Members.status_array[task_info.status]);
		task.querySelector(".task_status").src = document.getElementById(Members.status_array[task_info.status]).src;

		// ユーザ名の表示
		task.querySelector(".name_area").textContent = task_info.name;

		// 時間の設定
		if (task_info.hour !== null) {
			// 時間を少数5位で四捨五入する
			task.querySelector(".image > .time").textContent = Base.round_at(task_info.hour, 5);
		}

		// タスクの詳細を設定
		if (task_info.task_detail) {
			let task_detail = task_info.task_detail.replace(/\n/g, "<br>");
			task.querySelector(".task_detail_text").innerHTML = task_detail;
		}

		// 他市区の終了時メモを設定
		if (task_info.end_detail) {
			let end_detail = task_info.end_detail.replace(/\n/g, "<br>");
			task.querySelector(".end_detail").innerHTML = end_detail;
		}
	},

	calc_width: function() {
		var container = document.getElementsByClassName("container")[0];
		return (container.offsetWidth - 40) / 4;
	},

	resize_width: function() {
		var boxs = document.getElementsByClassName("task_box");
		var scale = calc_width();
		for (var i = 0; i < boxs.length; i++) {
			boxs[i].style.width = scale + "px";
			// boxs[i].style.border = "1px #000 solid";
		}
	},

	create_modal: function() {
		var task = parents(button, "task");
		// タスクが自分のものでないときは何もしない
		if (!task.classList.contains(user_id)) return;
		this.blur();
		var div = document.createElement("div");
		div.id = "modal_back";
		document.body.appendChild(div);
		div.addEventListener("click", remove_modal);
		document.body.classList.add("noscroll");

		// modalは消えているはずなのでクラスを消す
		var modal = document.getElementById("modify");
		modal.classList.remove("hide");

		// modalを画面の真ん中におく
		window.onresize = function() {
			centering(modal);
		};
		centering(modal);

		// タスク内容をmodalにセットする
		set_form_value(modal, task);
	},

	set_form_value: function(modal, task) {
		// タスク名
		modal.task_name.value = task.querySelector(".task_name").textContent;
		// タスクの状態
		modal.status.value = task.dataset.status;
		// 予想時間
		modal.image_hour.value = task.querySelector(".image > .time").textContent;
		// 経過時間
		modal.process_hour.value = task.querySelector(".real > .time").textContent;
		// タスク詳細
		var task_detail = task.querySelector(".task_detail_text").innerHTML.replace(/<br>/g, "\n");
		var default_detail = "詳細を決めていません\nタスクを実行する前に決めよう！";
		if (task_detail !== default_detail) {
			modal.task_detail.value = task_detail;
		}
		// 終了時のメモ
		var end_detail = task.querySelector(".end_text").innerHTML.replace(/<br>/g, "\n");
		if (end_detail !== "メモがない") {
			modal.end_detail.value = end_detail;
		}
		// タスクid
		modal.task_id.value = task.id;
	},

	remove_modal: function() {
		var remove = document.getElementById("modal_back");
		remove.parentElement.removeChild(remove);

		document.body.classList.remove("noscroll");
		document.getElementById("modify").classList.add("hide");

		window.onresize = null;
	},

	reset_page: function() {
		let task_box = document.getElementsByClassName("task_box");
		let length = task_box.length;
		for (var i = 0; i < length; i = (i + 1)) {
			task_box[i].textContent = "";
		}
	},

	centering: function(modal) {
		var width = window.innerWidth;
		var height = window.innerHeight;

		var modal_width = modal.offsetWidth;
		var modal_height = modal.offsetHeight;
		modal.style.left = ((width - modal_width) / 2) + "px";
		modal.style.top = ((height - modal_height) / 2) + "px";
	},
}
