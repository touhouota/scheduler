var user_id = get_cookie().user_id;
//  statusを保持する
var task_status = 0;
var pop;


window.onload = function() {
	// ユーザIDがあるかの確認、ある場合は次に進む
	console.log("onload");
	if (!get_cookie().user_id) {
		// もし、cookieにuser_idがなければログイン画面へ戻す
		window.location = '/b1013179/scheduler/index.html';
	}

	//timeタグに時間をセットする
	set_timetag();
	// document.getElementById("comment").addEventListener("input", check_textarea_value);
	document.getElementById("comment_button").disabled = true;
	document.getElementById("comment").oninput = check_textarea_value;
	// get_comment();
	comment_timer();
	// 今日のリストを取得
	var url = [
		request_path, "?user_id=", user_id, "&cmd=list", "&date=", format_ymd(new Date())
	].join("");

	create_request("GET", url, function() {
		// コールバック関数
		if (this.status == 200 && this.readyState == 4) {
			var position = "task";
			var res = JSON.parse(this.responseText);
			console.log(res);
			if (res.ok) {
				var task_json = res.list;
				if (task_json.length != 0) {
					new Chart("canvas", res.chart).render();
					var form = create_task_list(task_json);
					document.getElementById(position).appendChild(form);
				} else {
					var text = document.createTextNode("今日の予定はまだ立てていないようです。上のボタンから予定を立てよう");
					document.getElementById(position).appendChild(text);
				}
			} else {
				alert("エラーっぽい。\n要素を検証のコンソールのエラーを中原(g2117034@fun.ac.jp)まで送ってください。");
			}
		}
	}).send(null);

	document.getElementById("logout").addEventListener("click", function() {
		document.cookie = "user_id=";
		window.location = "/b1013179/scheduler/index.html";
	});
};

// 使われているブラウザに、input dateが対応しているかの判定
// 対応している:false, 対応していない:true
function check_support_input_date() {
	const userAgent = navigator.userAgent;
	return userAgent.indexOf("Chrome") < 0 || userAgent.indexOf("Edge") > 0;
}

// timeタグに日付の情報を付加
function set_timetag() {
	var now = new Date();
	var date = document.getElementById('today');
	date.textContent = format_md(now);
	date.setAttribute("datetime", [format_ymd(now), format_hms(now)].join("T") + "+09:00");
	pop = document.getElementById("pop");
}

////////////////////////////
// 一つ一つのタスクを作成
/////////////////////////////
function create_task_list(json) {
	var length = json.length;
	var temp = document.createDocumentFragment();
	var template = document.getElementById("task_template");
	for (var i = 0; i < length; i++) {
		var task = template.cloneNode(true);
		var task_info = json[i];
		// console.log("create_task_list", task_info);
		task.id = task_info.task_id;
		// タスクの状態を表すアイコン
		var icon = task.getElementsByClassName("task_status")[0];
		icon.classList.add("task_info");
		var src_regexp = new RegExp(/stop.png/);
		// icon.setAttribute("status", task_info.status);
		task.dataset.status = task_info.status;
		switch (task_info.status) {
			case 1:
				icon.src = icon.src.replace(src_regexp, "start.png");
				task_status = 1;
				change_favicon(task_status);
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

		// タスク名を付加
		task.getElementsByClassName("task_name")[0].textContent = task_info.task;
		// 予想時間
		if (task_info.hour) {
			// 丸め誤差を消す
			var hour = parseFloat(task_info.hour, 10);
			task.querySelector(".image > .time").textContent = Math.round(hour * 1000) / 1000;
		}
		// 経過時間
		if (task_info.time) {
			var time = task_info.time;
			// 経過時間を表示
			task.querySelector(".real > .time").textContent = convert_hms_from_seconds(time);
		}
		if (task_info.status === 1) {
			// 実行状態の時は
			// start => DBの中にあるstart_time - 経過時間(ms)
			// stop => 現在時刻
			// でタイマーを動かす

			// タイマーのスタートとストップを擬似的に作る
			// timeには秒数が入っているので、msに治すために1000倍する
			//task.dataset.start = new Date(Date.now() - Number(time) * 1000);
			var start_time = Date.parse(task_info.start_time);
			task.dataset.start = new Date(start_time - task_info.time * 1000);
			task.dataset.stop = Date();
			// 引数のstatusは4 => 1の時の4を表す
			task_decoration(task, "4");
			console.log("実行するよ");
			timer(task);
		}

		// タスクの詳細
		if (task_info.task_detail) {
			task.getElementsByClassName("task_detail_text")[0].innerHTML = task_info.task_detail.replace(/\r?\n/g, "<br>");
		}
		// タスクの終了時のメモ
		task.getElementsByClassName("end_text")[0].value = task_info.end_detail;
		// taskを実行・停止するためのボタン
		icon.onclick = start_timer;
		// マウスオーバー時、次の状態を表すiconに切り替える
		icon.onmouseover = next_icon;
		// マウスが離れたら、iconを戻す
		icon.onmouseleave = reset_icon;
		// taskを終了したときに押すボタン
		task.getElementsByClassName("task_finish_area")[0].onclick = finish_task;
		// マウスオーバーした時
		task.onmouseover = popup_open;
		task.onmouseleave = popup_close;
		// タスクをFragmentに追加
		if (task_info.status === 2) {
			temp.appendChild(task);
		} else {
			temp.insertBefore(task, temp.firstChild);
		}
	}
	return temp;
}

function start_timer(click_event) {
	var target = click_event.target;
	var task = parents(target, "task");
	var hour = task.querySelector(".image > .time").textContent;
	var default_hour = "---";
	var task_detail = task.getElementsByClassName("task_detail_text")[0].textContent;
	var default_detail = "詳細を決めていませんタスクを実行する前に決めよう！";
	if (hour != default_detail && task_detail != default_detail) {
		console.log("start_timer: タスクの状態を変更");
		task_status_change(target);
	} else {
		alert("タスクを開始する前に、時間の見積もりや詳細情報を追加しよう！");
		create_modal(click_event.target);
	}
}


/////////////////////////////
// 更新をサーバへ送る
/////////////////////////////
function finish_task(click_event) {
	var finish_status = parents(click_event.target, "finish");
	var task = parents(click_event.target, "task");
	var icon = task.getElementsByClassName("task_status")[0];
	//var status = finish_status.getAttribute("status");
	var status = finish_status.dataset.status;
	console.log("finish_task", finish_status, status);
	if (status && status.length === 0) {
		// もし、ボタンを押していないときは何もしない
		return;
	}
	var text = task.end_detail.value;
	//console.log("finish_task", text);
	if (text.length === 0) {
		alert("「振り返り」部分が未入力ですよ");
		return;
	}

	var time = task.querySelector(".real > .time").textContent;
	// console.log("finish_task", time);
	var post = [
		"cmd=finish_task",
		"&user_id=", user_id,
		"&time=", convert_seconds_from_hms(time),
		"&end_detail=", encodeURIComponent(text),
		"&status=", status,
		"&task_id=", task.id,
		// TL追加用の情報
		"&datetime=", encodeURIComponent(Date())
	].join("");
	console.log("finish_task", post);
	create_request("POST", request_path, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			if (json.ok) {
				confirm("保存完了");
				console.log("更新", json);
				// グラフを再描画
				new Chart("canvas", json.chart).render();
				var task = document.getElementById(json.data[0].task_id);
				// タスクの状態を表すアイコンを変更
				var icon = task.getElementsByClassName("task_status")[0];
				var icon_src = ["", "", "succ.png", "nosucc.png"];
				icon.src = icon.src.replace(/[a-z]*.png/, icon_src[json.data[0].status]);
				document.getElementById("task").appendChild(task);
				change_favicon(json.data[0].status);
			} else {
				alert("データの保存に失敗しました\n" + json.data);
			}
		}
	}).send(post);

	// タスク実行時、タイマーを停止する
	// var change_button = task.getElementsByClassName("change_button")[0];
	// timer(change_button);
	task.dataset.status = status;
	timer(task);
	// この時、task_subクラスはないので追加
	task.children[1].classList.add("task_sub");
	// ハイライトを消す
	task.classList.remove("highlight");
}

function only_task_name() {
	var input = prompt("タスク名を入力してください");
	if (input && input.length !== 0) {
		var post = [
			"cmd=name_only",
			"&task=", encodeURIComponent(input),
			"&user_id=", user_id,
			"&date=", format_ymd(new Date()),
		].join("");
		//console.log("only_task_name", post);
		create_request("POST", request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				var json = JSON.parse(this.responseText);
				if (json.ok) {
					var task_area = document.getElementById("task");
					// タスクが登録されていない場合はタスクが登録されていないばあは一旦全てを削除する
					if (task_area.children.length === 0) task_area.textContent = "";
					var task = create_task_list(json.data);
					task_area.appendChild(task);
				}
			}
		}).send(post);
	}
}

// モーダル関連
function create_modal(dom) {
	// フォーカスを外す
	this.blur();
	// バックの黒幕に当たるdivを作成
	var div = document.createElement("div");
	div.id = "modal_back";
	document.body.appendChild(div);

	div.addEventListener("click", remove_modal);
	//var close_button = document.getElementById("close");
	//close_button.addEventListener("click", remove_modal);
	document.body.classList.add("noscroll");

	var modal = null;
	if (dom.classList.contains("task_info")) {
		// domにtask_infoがある場合は、いつものmodalを表示
		modal = document.getElementById("task_info_modify");
	} else if (dom.classList.contains("time_info")) {
		// domにtask_infoがない場合は、時間を変えるmodalを表示
		modal = document.getElementById("time_modify");
	} else {
		return;
	}
	modal.classList.remove("hide");

	//window.addEventListener("resize", centering);
	centering(modal);

	var task = parents(dom, "task");

	if (dom.classList.contains("task_info")) {
		hoge(modal, task);
	} else if (dom.classList.contains("time_info")) {
		fuga(modal, task);
	} else {
		return;
	}

	modal.task_id.value = task.id;
}

function hoge(modal, task) {
	var task_name = task.getElementsByClassName("task_name")[0];
	modal.task_name.value = task_name.textContent;

	var hour = task.querySelector(".image > .time").innerHTML.replace(/<br>/g, "\n");
	if (hour !== "---") {
		hour = parseFloat(hour, 10);
	} else {
		hour = "";
	}
	modal.task_hour.value = hour;

	var detail = task.getElementsByClassName("task_detail_text")[0].innerHTML;
	var default_detail = "詳細を決めていません<br>タスクを実行する前に決めよう！";
	if (detail !== default_detail) {
		modal.task_detail.value = detail.replace(/<br>/g, "\n");
	} else {
		modal.task_detail.value = "";
	}
}

function fuga(modal, task) {
	var time = task.querySelector(".real > .time").innerHTML.replace(/<br>/g, "\n");
	modal.time.value = time;
}

function remove_modal() {
	var remove = document.getElementById("modal_back");
	remove.parentElement.removeChild(remove);

	document.body.classList.remove("noscroll");
	document.getElementById("task_info_modify").classList.add("hide");
	document.getElementById("time_modify").classList.add("hide");

	//window.removeEventListener("resize", centering);
}

function centering(modal) {
	var width = window.innerWidth;
	var height = window.innerHeight;
	// if (modal) {
	// 	modal = document.getElementById("task_info_modify");
	// }
	console.log(modal);
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
		"&task_id=", form.task_id.value
	].join("");
	if (form.id === "task_info_modify") {
		// こちらは、タスクの情報を変更する時
		post = [
			post,
			"&task_name=", form.task_name.value,
			"&hour=", form.task_hour.value,
			"&task_detail=", encodeURIComponent(form.task_detail.value),
		].join("");
	} else {
		// こちらは、時間を編集する時
		post = [
			post,
			"&time=" + convert_seconds_from_hms(form.time.value)
		].join("");
	}
	console.log(post);
	create_request("POST", request_path, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			console.log("callback_send_modify", json);
			if (json.ok) {
				var task = create_task_list(json.data);
				var old_task = document.getElementById(json.data[0].task_id);
				//console.log("callback_send_modify", task);
				old_task.parentElement.replaceChild(task, old_task);
				new Chart("canvas", json.chart).render();
			}
			remove_modal();
		}
	}).send(post);
}

// タスクにマウスオーバーした時の動作
function popup_open(e) {
	var task = parents(e.target, "task");
	if (task.classList.contains("highlight")) return false;

	var task_detail = task.getElementsByClassName("task_detail")[0];
	var pos = task.getBoundingClientRect();
	var style = pop.style;
	style.top = (pos.top / 3) * 2 + window.pageYOffset + "px";
	style.left = pos.left + pos.width * (3 / 4) + window.pageXOffset + "px";
	pop.innerHTML = task_detail.innerHTML;
	pop.classList.add("pop_open");
	pop.classList.remove("hide");
}

function popup_close(e) {
	console.log("leave");
	pop.classList.remove("pop_open");
	pop.classList.add("hide");
	pop.innerHTML = "";
}

// タスク状態によってfaviconを切り替える
function change_favicon(status) {
	var favicon = document.getElementById("favicon");
	if (status == 1) {
		favicon.href = "./image/start.ico";
	} else {
		favicon.href = "./image/stop.ico";
	}
}

// iconにマウスオーバーした時、次の状態を表す
function next_icon(e) {
	var icon = e.target;
	var task = parents(icon, "task");
	icon.dataset.now = task.dataset.status;
	icon.dataset.prev = icon.src;
	if (task.dataset.status == 1) {
		icon.src = "./image/pause.png";
	} else {
		icon.src = "./image/start.png";
	}
}

// iconのマウスオーバーを解除した時
function reset_icon(e) {
	var icon = e.target;
	var icon_data = icon.dataset;
	var task = parents(icon, "task");
	// icon.src = icon.dataset.prev;
	// icon.dataset.prev = null;
	if (icon_data.now === task.dataset.status) {
		icon.src = icon_data.prev;
	}
	icon_data.now = icon_data.prev = null;
	console.log("reset_icon");
}
