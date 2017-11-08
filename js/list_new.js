var user_id = get_cookie().user_id;
var task_status = 1;

window.onbeforeunload = function() {
	// タスク実行時の時、確認する
	if (task_status == -1) {
		var str = "タスクを実行中です\n本当にページを移動・更新しますか？";
		return confirm(str);
	}
};

window.onload = function() {
	// ユーザIDがあるかの確認、ある場合は次に進む
	check_userid();
	var now = new Date();
	var date = document.getElementById('today');
	date.textContent = format_md(now);
	date.datetime = now.toISOString();

	get_comment();
	comment_timer();
	// 今日のリストを取得
	var url = [
		request_path, "?user_id=", user_id, "&cmd=list", "&date=", format_ymd(now)
	].join("");
	create_request("GET", url, function() {
		// コールバック関数
		if (this.status == 200 && this.readyState == 4) {
			var position = "task";
			var all = JSON.parse(this.responseText);
			new Chart("canvas", all.chart).render();
			var json = all.list;
			if (json.length !== 0) {
				var form = create_task_list(json);
				document.getElementById(position).appendChild(form);
			} else {
				var text = document.createTextNode("今日の予定はまだ立てていないようです。上のボタンから予定を立てよう");
				document.getElementById(position).appendChild(text);
			}
		}
	}).send(null);
};

////////////////////////////
// 一つ一つのタスクを作成
/////////////////////////////
function create_task_list(json) {
	var length = json.length;
	var temp = document.createDocumentFragment();
	for (var i = 0; i < length; i++) {
		// タスクの名前を設定
		task_name.textContent = json[i].task;
		// 予想時間の設定
		if (json[i].hour) {
			image.textContent = ["予想時間： ", json[i].hour, "時間"].join("");
		} else {
			image.textContent = ["予想時間： ", "なし"].join("");
		}

		// 時間の
		if (json[i].time) {
			real_time.textContent = convert_hms_from_seconds(json[i].time);
		} else {
			real_time.textContent = "00:00:00";
		}

		switch (json[i].status) {
			case 2:
				comp_radio.checked = true;
				break;
			case 3:
				noncomp_radio.checked = true;
				break;
			default:
				comp_radio.checked = false;
				noncomp_radio.checked = false;
				break;
		}
		if (json[i].task_detail) {
			task_detail_text.innerHTML = json[i].task_detail.replace(/\r?\n/g, "<br>");
		} else {
			task_detail_text.innerHTML = "詳細を決めていません<br>タスクを始める前に決めよう！";
		}

		end_text.value = json[i].end_detail;

		var task_form = task.cloneNode(true);
		task_form.id = json[i].task_id;
		// イベント類を設定
		task_form.getElementsByClassName("timer_button")[0].onclick = timer_start;
		task_form.getElementsByClassName("modal_open")[0].onclick = create_modal;
		task_form.getElementsByClassName("send_button")[0].onclick = finish_task;

		if (json[i].time) {
			// start: 経過時間から、擬似的にstartを作る
			var time = json[i].time * 1000;
			task_form.setAttribute("start", new Date(Date.now() - time));
			task_form.setAttribute("stop", Date());
		}
		temp.appendChild(task_form);
	}
	return temp;
}

function timer_start() {
	var task = parents(this, "task");
	var hour = task.getElementsByClassName("image")[0].textContent;
	var default_hour = "予想時間： なし";
	var task_detail = task.getElementsByClassName("task_detail")[0].textContent;
	var default_detail = "詳細を決めていませんタスクを始める前に決めよう！";
	if (hour != default_detail && task_detail != default_detail) {
		timer(this);
		task_status_change(this);
	} else {
		alert("タスクを開始する前に、時間の見積もりや詳細情報を追加しよう！");
	}
}

// タスクの進捗が変化した時の処理
function task_status_change(button) {
	task_status *= -1;
	var task = parents(button, "task");
	// タスクにクラスを追加・削除する
	toggle_class(task, "highlight");
	toggle_class(task.children[1], "task_sub");
	toggle_class(task.getElementsByClassName("send_button")[0], "hidden");
	var url = [request_path,
		"?cmd=time&task_id=", task.id,
		"&user_id=", user_id,
		"&datetime=", encodeURIComponent(Date())
	].join("");
	if (task_status < 0) {
		task.getElementsByClassName("end_detail")[0].open = true;
	} else {
		task.getElementsByClassName("end_detail")[0].open = false;
	}
	switch (button.value) {
		case "1":
			// タスク実行時
			url = [url, "&status=", button.value].join("");
			break;
		case "4":
			// 一時停止時
			var time = task.getElementsByClassName("time")[0].innerHTML.replace(/\r?\n|\s|　/, "");
			url = [
				url, "&time=", convert_seconds_from_hms(time),
				"&status=", button.value,
				"&end_detail=", task.end_detail.value
			].join("");
			break;
		default:
			alert("存在しないステータス");
			return;
	}
	//console.log("task_status_change", url);
	create_request("GET", url, null).send(null);
}

/////////////////////////////
// 更新をサーバへ送る
/////////////////////////////
function finish_task(click_event) {
	var task = parents(click_event.target, "task");

	var text = task.end_detail.value;
	//console.log("finish_task", text);
	if (text.length === 0) {
		alert("「振り返り」部分が未入力ですよ");
		return;
	}
	var radio = task.finish_type.value;

	if (radio.length === 0) {
		alert("完了・未達成を選んでください");
		return;
	}
	//console.log("finish_task", radio);
	if (radio.length === 0) {
		alert("完了 or 未達成のどちらかを選んでください");
		return;
	}
	var time = task.getElementsByClassName("time")[0].textContent;

	var post = [
		"cmd=finish_task",
		"&user_id=", user_id,
		"&time=", convert_seconds_from_hms(time),
		"&end_detail=", text,
		"&status=", radio,
		"&task_id=", task.id,
		// TL追加用の情報
		"&datetime=", encodeURIComponent(Date())
	].join("");

	create_request("POST", request_path, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			if (json.ok) {
				confirm("保存完了");
				//console.log("更新", json);
				// グラフを再描画
				new Chart("canvas", json.chart).render();
			} else {
				alert("データの保存に失敗しました\n" + json.data);
			}
		}
	}).send(post);

	// タスク実行時、タイマーを停止する
	if (task.timer_button.value == 1) {
		timer(task.timer_button);
		// この時、task_subクラスはないので追加
		task.children[1].classList.add("task_sub");
	}
	// ハイライトを消す
	task.getElementsByClassName("send_button")[0].classList.add("hidden");
	task.classList.remove("highlight");
	task_status = 1;
}

function only_task_name() {
	var input = prompt("タスク名を入力してください");
	if (input && input.length !== 0) {
		var post = [
			"cmd=name_only",
			"&task=", encodeURIComponent(input),
			"&user_id=", user_id,
			"&date=", format_ymd(new Date())
		].join("");
		//console.log("only_task_name", post);
		create_request("POST", request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				var json = JSON.parse(this.responseText);
				//console.log("callback_only_task_name", json);
				if (json.ok) {
					var task = create_task_list(json.data);
					//temp.appendChild(task);
					document.getElementById("task").appendChild(task);
				}
			}
		}).send(post);
	}
}

// モーダル関連

function create_modal(click_event) {
	// フォーカスを外す
	this.blur();
	// バックの黒幕に当たるdivを作成
	var div = document.createElement("div");
	div.id = "modal_back";
	document.body.appendChild(div);

	div.addEventListener("click", remove_modal);
	var close_button = document.getElementById("close");
	close_button.addEventListener("click", remove_modal);
	document.body.classList.add("noscroll");

	var modal = document.getElementById("modal_area");
	modal.classList.remove("hide");

	window.addEventListener("resize", centering);
	centering();

	var task = parents(click_event.target, "task");
	var task_name = task.getElementsByClassName("task_name")[0];
	modal.task_name.value = task_name.textContent;

	var hour = task.getElementsByClassName("image")[0].textContent.split(" ")[1];
	if (hour !== "なし") {
		hour = parseFloat(hour, 10);
	} else {
		hour = "";
	}
	modal.task_hour.value = hour;

	var detail = task.getElementsByClassName("task_detail")[0];
	detail = detail.innerHTML;
	var default_detail = "詳細を決めていません<br>タスクを始める前に決めよう！";
	if (detail !== default_detail) {
		modal.task_detail.value = detail.replace(/<br>/g, "\n");
	} else {
		modal.task_detail.value = "";
	}
	modal.task_id.value = task.id;
}

function remove_modal() {
	var remove = document.getElementById("modal_back");
	remove.parentElement.removeChild(remove);

	document.body.classList.remove("noscroll");
	document.getElementById("modal_area").classList.add("hide");

	window.removeEventListener("resize", centering);
}

function centering() {
	var width = window.innerWidth;
	var height = window.innerHeight;

	var modal = document.getElementById("modal_area");
	var modal_width = modal.offsetWidth;
	var modal_height = modal.offsetHeight;
	modal.style.left = ((width - modal_width) / 2) + "px";
	modal.style.top = ((height - modal_height) / 2) + "px";
}

// 変更情報をサーバへ送る
function send_modify(modal) {
	var form = parents(modal, "modal");
	var post = [
		"cmd=modify",
		"&user_id=", user_id,
		"&task_name=", form.task_name.value,
		"&hour=", form.task_hour.value,
		"&task_detail=", encodeURIComponent(form.task_detail.value),
		"&task_id=", form.task_id.value
	].join("");
	create_request("POST", request_path, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			console.log("callback_send_modify", json);
			if (json.ok) {
				var task = create_task_list(json.data);
				var old_task = document.getElementById(json.data[0].task_id);
				//console.log("callback_send_modify", task);
				old_task.parentElement.replaceChild(task, old_task);
			}
			remove_modal();
		}
	}).send(post);
}
