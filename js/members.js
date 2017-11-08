var task_template = document.getElementById("task_template");

document.body.onunload = function() {
	// location.reload();
	console.log("members_task.html => どこかへ");
};

window.onload = function() {
	var date = new Date();
	var date_str = format_ymd(date);
	var date_input = document.getElementById("date");
	date_input.value = date_str;
	date_input.addEventListener("change", change_date);
	adjust_height_size();
	get_list_from_date(date);
	resize_width();
};

window.addEventListener('resize', function() {
	adjust_height_size();
	resize_width();
});

/////////////////////////////
// 日付が変わった時、その日付のやることリストを取得
/////////////////////////////
function get_list_from_date(date) {
	// var date = document.getElementsByName("date")[0].value;
	var date_str = format_ymd(date);
	var url = "?cmd=date&user_id=" + user_id + "&date=" + date_str;
	//console.log(url);
	create_request("GET", request_path + url, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			if (json.ok) {
				console.log(json);
				reset_page();
				create_task(json.data);
			} else {
				console.log("error");
				console.log(json);
			}
		}
	}).send(null);
}

// タスクを作る
function create_task(task_json, status) {
	var length = task_json.length;
	var i = 0;
	var array = [];
	while (i < 4) {
		array.push(document.createDocumentFragment());
		i = i + 1;
	}
	array.push(array[0]);

	var task;
	for (i = 0; i < length; i++) {
		task = __create_task_dom(task_json[i]);
		array[task_json[i].status].appendChild(task);
	}

	if (!isNaN(status)) {
		// statusがある場合はそれにあう要素を返す
		console.log(array[status]);
		return array[status];
	} else {
		// statusがない場合はかく部分に要素を追加する
		for (i = 0; i < 4; i++) {
			document.getElementsByClassName("task_box")[i].appendChild(array[i]);
		}
	}
}

function __create_task_dom(one_task) {
	//console.log(one_task);
	var task = task_template.cloneNode(true);
	task.id = one_task.task_id;
	task.classList.add(one_task.user_id);
	// タスク名を記述
	task.getElementsByClassName("task_name")[0].textContent = one_task.task;

	task.getElementsByClassName("task_sub")[0].classList.add("hide");

	// 状態を付加
	task.dataset.status = one_task.status;

	// タスクの状態を表すアイコンを設定
	var icon = task.getElementsByClassName("task_status")[0];
	var status_array = ["stop", "start", "success", "nosucc", "pause"];
	icon.src = document.getElementById(status_array[one_task.status]).src;

	// ユーザ名を表示
	task.getElementsByClassName("name_area")[0].textContent = one_task.name;

	// 予想時間の設定
	if (one_task.hour !== null) {
		// 時間を少数第５位で四捨五入する
		task.querySelector(".image > .time").textContent = round_at(one_task.hour, 5);
	}

	// 経過時間を設定
	if (one_task.time !== null) {
		var time_text = convert_hms_from_seconds(one_task.time);
		task.querySelector(".real > .time").textContent = time_text;
	}

	// タスクの詳細を設定
	if (one_task.task_detail) {
		var task_detail = one_task.task_detail.replace(/\n/g, "<br>");
		task.getElementsByClassName('task_detail_text')[0].innerHTML = task_detail;
	}

	// タスク終了時のメモを設定
	if (one_task.end_detail) {
		var end_detail = one_task.end_detail.replace(/\n/g, "<br>");
		task.getElementsByClassName('end_text')[0].innerHTML = end_detail;
	}
	return task;
}

function adjust_height_size() {
	var window_height = window.innerHeight;
	var header_height = document.getElementsByTagName("header")[0].offsetHeight;
	var container = document.getElementsByClassName("container")[0];
	container.style.minHeight = (window_height - header_height) + "px";
	console.log((window_height - header_height) + "px");
}

function calc_width() {
	var container = document.getElementsByClassName("container")[0];
	return (container.offsetWidth - 40) / 4;
}

function resize_width() {
	var boxs = document.getElementsByClassName("task_box");
	var scale = calc_width();
	for (var i = 0; i < boxs.length; i++) {
		boxs[i].style.width = scale + "px";
		// boxs[i].style.border = "1px #000 solid";
	}
}

function change_date(e) {
	var date = e.target;
	get_list_from_date(new Date(date.value));
}

var task_boxs = document.getElementsByClassName("task_box");
// 各状態のタスクを初期化する
function reset_page() {
	var length = task_boxs.length;
	for (var i = 0; i < length; i = (i + 1)) {
		task_boxs[i].textContent = "";
	}
}

function create_modal(button) {
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
}

// modalにデータをいれる
function set_form_value(modal, task) {
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
}

// modalを消す
function remove_modal() {
	var remove = document.getElementById("modal_back");
	remove.parentElement.removeChild(remove);

	document.body.classList.remove("noscroll");
	document.getElementById("modify").classList.add("hide");

	window.onresize = null;
}

// 引数をセンタリングする
function centering(modal) {
	var width = window.innerWidth;
	var height = window.innerHeight;

	var modal_width = modal.offsetWidth;
	var modal_height = modal.offsetHeight;
	modal.style.left = ((width - modal_width) / 2) + "px";
	modal.style.top = ((height - modal_height) / 2) + "px";
}

function send_modify(button) {
	var form = parents(button, "modal");
	var post = [
		"cmd=modify",
		"&user_id=", user_id,
		"&task_id=", form.task_id.value,
		"&task_name=", form.task_name.value,
		"&status=", form.status.value,
		"&hour=", form.image_hour.value,
		"&time=", convert_seconds_from_hms(form.process_hour.value),
		"&task_detail=", encodeURIComponent(form.task_detail.value),
		"&end_detail=", encodeURIComponent(form.end_detail.value),
	].join("");

	create_request("POST", request_path, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			console.log("callback_send_modify", json);
			if (json.ok) {
				console.log(json);
				var task = create_task(json.data, json.data[0].status);
				var old_task = document.getElementById(json.data[0].task_id);
				console.log(old_task, task);
				old_task.parentElement.replaceChild(task, old_task);
			}
			remove_modal();
		}
	}).send(post);
}

function round_at(num, at) {
	var pow_num = Math.pow(10, at);
	return Math.round(num * pow_num) / pow_num;
}
