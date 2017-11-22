let task_page = '/b1013179/scheduler/todo.html'

window.onload = function() {
	// ログイン済みの時は、スキップ
	if (can_skip_login()) {
		console.log("skipできるよ！");
		// window.location = '/b1013179/scheduler/list.html';
		window.location = task_page;
	}
	console.log("skipできないよ！！");
}

// ログインをスキップしたい
function can_skip_login() {
	// ユーザIDがあれば、falseを返す
	// つまり、check_userid === falseの時はskip出来る
	if (check_userid()) {
		return false;
	}
	return true;
}

// formの情報を取得し、URLとする
function get_form() {
	var id = document.forms[0].user_id.value;
	if (id) {
		return "?cmd=exist&user_id=" + id;
	} else {
		return "";
	}
}

function callback_create_user() {
	if (this.status == 200 && this.readyState == 4) {
		var json = JSON.parse(this.responseText);
		console.log(json);
		if (json.ok) {
			document.cookie = "user_id=" + json.data.user_id;
			// window.location = "/b1013179/scheduler/list.html";
			window.location = task_page;
		} else {
			alert("作成に失敗しました。\n" + json.data);
		}
	}
}

// ユーザを作成するようにサーバへ要求する
function create_user() {
	var url = "?cmd=create&user_id=" + document.forms[0].user_id.value;
	create_request("GET", request_path + url, callback_create_user).send(null);
}

// login関数のコールバック関数
function callback_login() {
	if (this.status == 200 && this.readyState == 4) {
		var json = JSON.parse(this.responseText);
		console.log(json);
		if (json.ok) {
			// この階層は、データのレスポンスがきちんと行われた時に入る
			if (json.data !== null) {
				document.cookie = "user_id=" + json.data.user_id;
				// window.location = "./list.html";
				window.location = task_page;
			} else {
				if (confirm("ユーザ情報がありませんでした。\n新しく作りますか？")) {
					create_user();
				} else {
					alert("入力内容をもう一度確認してください");
				}
			}
		} else {
			// ここに来るときは、サーバで何らかのエラー
			alert("サーバエラーっぽい");
			console.log(json);
		}
	}
}

// ログインする
function login() {
	var url = get_form();
	console.log(request_path + url);
	if (url.length) {
		create_request("GET", request_path + url, callback_login).send(null);
		console.log("send");
	} else {
		console.log("からだよ");
	}
	return false;
}