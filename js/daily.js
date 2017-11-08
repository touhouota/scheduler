var sended = false;
var user_id = get_cookie().user_id;

window.onload = function() {
	check_userid();
	document.getElementById("date").value = format_ymd(new Date());
	get_list_from_date();
	document.getElementById("tabs").addEventListener("click", function(e) {
		var target = e.target;
		var id = target.classList[1];
		var areas = document.getElementById("other_area").children;
		console.log(id);
		if (id === "all" || id === undefined) {
			for (var i = 0; i < areas.length; i++) {
				areas[i].classList.remove("hide");
			}
		} else {
			for (var j = 0; j < areas.length; j++) {
				//console.log(areas[j].id);
				if (areas[j].id === id) {
					areas[j].classList.remove("hide");
				} else {
					areas[j].classList.add("hide");
				}
			}
		}
	});
};

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

		//textarea をPタグに置き換え
		var end_d = end_detail.cloneNode(true);
		var end_p = document.createElement("p");
		if (json[i].end_detail !== "") {
			end_p.innerHTML = json[i].end_detail;
			end_text.value = json[i].end_detail;
		} else {
			end_p.textContent = "";
			end_text.value = "";
		}

		end_d.replaceChild(end_p, end_d.getElementsByClassName("end_text")[0]);

		var task_form = task.cloneNode(true);
		console.log(task_form.getElementsByClassName("end_detail")[0]);
		console.log(end_d);
		//task_form.replaceChild(task_form.getElementsByClassName("end_detail")[0], end_d);

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
		} else {
			var start = new Date(json[i].start_time);
			var finish = new Date(json[i].finish_time);
			if (!isNaN(start.getTime()) && !isNaN(finish.getTime())) {
				var diff_time = new Date(Date.now() - (finish - start));
				task_form.setAttribute("start", new Date(Date.now() - diff_time));
				task_form.setAttribute("stop", Date());
			}
		}
		var modalButton = task_form.getElementsByClassName("modal_open")[0];
		modalButton.parentElement.removeChild(modalButton);

		temp.appendChild(task_form);

	}
	return temp;
}


/////////////////////////////
// get_list_from_dateのコールバック
/////////////////////////////
function callback_get_list_from_date() {
	if (this.status == 200 && this.readyState == 4) {
		//console.log(this.responseText);
		var json = JSON.parse(this.responseText);
		if (json.ok) {
			var my_area = document.getElementById("my_area");
			my_area.textContent = "";
			var other_area = document.getElementById("other_area");
			other_area.textContent = "";
			var tabs = document.getElementById("other_tab");
			tabs.textContent = "";
			if (json.data.length !== 0) {
				console.log(user_id);
				for (var key in json.data) {
					console.log(key);

					if (key == user_id) {
						// 自分の時
						my_area.appendChild(create_task_list(json.data[key]));
					} else {
						// 自分以外の時
						var div = document.createElement("div");
						div.appendChild(document.createTextNode(key + "さん"));
						var tab = document.createElement("span");
						tab.classList.add("tab");
						tab.classList.add(key);
						tab.textContent = key;
						tabs.appendChild(tab);
						div.id = key;
						div.classList.add("task_area");
						div.appendChild(create_task_list(json.data[key]));
						other_area.appendChild(div);
					}
				}
			} else {
				my_area.textContent = "その日は、リストを作っていないようです...";
			}
		}
	}
}

/////////////////////////////
// 日付が変わった時、その日付のやることリストを取得
/////////////////////////////
function get_list_from_date() {
	var date = document.getElementsByName("date")[0].value;
	var url = "?cmd=date&user_id=" + get_cookie().user_id + "&date=" + date;
	//console.log(url);
	var request = create_request("GET", "/b1013179/scheduler/ruby/command.rb" + url, callback_get_list_from_date);
	request.send(null);
}
