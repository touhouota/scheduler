var weeks;
window.onload = function() {
	weeks = document.getElementsByClassName("week");
	var today = new Date();
	weeks[0].value = format_ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
	weeks[1].value = format_ymd(today);

	var button = document.getElementById("get_week_task");
	button.addEventListener("click", get_week_tasks);
};

/////////////////////////////
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
		if (json[i].end_detail !== "") {
			end_text.value = json[i].end_detail;
		}
		var task_form = task.cloneNode(true);
		task_form.id = json[i].task_id;
		// イベント類を設定
		// task_form.getElementsByClassName("timer_button")[0].onclick = timer_start;
		// task_form.getElementsByClassName("modal_open")[0].onclick = modal_open;
		// task_form.getElementsByClassName("send_button")[0].onclick = finish_task;

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

function get_week_tasks() {
	var date = get_week(weeks[0], weeks[1]);
	var url = ["?cmd=week_task&start=", date.start, "&end=", date.end, "&user_id=", get_cookie().user_id].join("");
	console.log(url);
	var date = get_week(weeks[0], weeks[1]);

	create_request("GET", request_path + url, function() {
		if (this.status == 200 && this.readyState == 4) {
			var json = JSON.parse(this.responseText);
			document.getElementById("area").appendChild(create_task_list(json.data));
		}
	}).send(null);
}


function get_week(start, end) {
	obj = {
		start: start.value,
		end: end.value
	};
	return obj;
}
