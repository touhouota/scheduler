window.onload = function() {
	const query = "?cmd=task_parent&user_id=" + Base.get_cookie("user_id");
	Base.create_request("GET", Base.request_path + query, function() {
		if (this.status == 200 && this.readyState == 4) {
			let response = JSON.parse(this.responseText);
			// console.table(response.data);
			if (response.ok) {
				let data = response.data;
				let fragment = document.createDocumentFragment();
				for (let i = 0; i < data.length; i++) {
					let task = Task.create_task(data[i]);
					Task.parent.push(data[i].task_id);

					fragment.appendChild(task);
				}
				document.getElementById("todos").appendChild(fragment);
				get_child(data);
				console.log("call child");
			}
		}
	}).send(null);
};


function get_child(parents) {
	let i = 0;

	for (i = 0; i < parents.length; i++) {

		let query = "?cmd=task_child&parent=" + parents[i].task_id + "&user_id=" + Base.get_cookie("user_id");
		Base.create_request("GET", Base.request_path + query, function() {
			if (this.status == 200 && this.readyState == 4) {
				let response = JSON.parse(this.responseText);
				if (response.ok) {
					let data = response.data;
					console.table(data);
					let fragment = document.createDocumentFragment();
					for (let num = 0; num < data.length; num++) {
						Task.child.push(data[num].task_id);
						let subtask = Task.create_task(data[num]);
						subtask.classList.add("sub");
						fragment.appendChild(subtask);
					}
					let sub = document.getElementById("task_id:" + data[0].parent).querySelector(".subtask_list");
					sub.appendChild(fragment);

					let tasks = document.querySelectorAll(".task");
					for (var i = 0; i < tasks.length; i++) {
						ProgressTimer.display(tasks[i]);
					}
				}
			}
		}).send(null);
	}
};