window.onload = function() {
	// タスクを取得
	const query = "?cmd=task_list&user_id=" + Base.get_cookie("user_id");
	Base.create_request("GET", Base.request_path + query, function() {
		if (this.status == 200 && this.readyState == 4) {
			let response = JSON.parse(this.responseText);
			console.table(response.data);
			const list = Task.create_task_list(response.data);
			document.getElementById("today_task").appendChild(list);
		}
	}).send(null);

	document.getElementById("append_task").addEventListener("click", Task.append_task);
}

function set_date() {
	const date = document.getElementById('today');
	date.textContent = format_md(now);
	date.setAttribute("datetime", [format_ymd(now), format_hms(now)].join("T") + "+09:00");
}
