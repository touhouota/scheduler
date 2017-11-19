window.onload = function() {
	// cookieにidがない場合は、loginさせる
	if (!Base.get_cookie('user_id')) {
		// ここに入った場合はidがない
		window.location = "/b1013179/scheduler/index.html";
	}
	// タスクを取得
	const query = "?cmd=task_list&user_id=" + Base.get_cookie("user_id");
	Base.create_request("GET", Base.request_path + query, function() {
		if (this.status == 200 && this.readyState == 4) {
			let response = JSON.parse(this.responseText);
			console.table(response.data);
			if (response.ok) {
				let data = response.data;
				data.forEach(function(item) {
					// todoの作成
					let todo = data.filter(Task.filter("todos"));
					let todo_list = Task.create_task_list(todo);
					document.getElementById("todos").appendChild(todo_list);

					// doneの作成
					let done = data.filter(Task.filter("dones"));
					let done_list = Task.create_task_list(done);
					document.getElementById("dones").appendChild(done_list);
				});
			}
		}
	}).send(null);
}
