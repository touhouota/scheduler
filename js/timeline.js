// commentのタイマーID
let comment_timer_id;

function check_textarea_value() {
	var comment = document.getElementById("comment");
	var button = document.getElementById("comment_button");
	if (comment.value.length === 0) {
		button.disabled = true;
	} else {
		button.disabled = false;
	}
}

// タイマーで繰り返し行う関数
// コメントを取得し、差分があれば追加する
function comment_timer() {
	var last_comment = document.getElementById("comment_area").firstChild;
	var url = request_path + "?cmd=tl_get" + "&user_id=" + user_id;
	if (last_comment !== null) {
		url += "&last=" + last_comment.id;
	}
	create_request("GET", url, function() {
		if (this.readyState == 4 && this.status == 200) {
			// console.log("comment", this.responseText);
			var comments = JSON.parse(this.responseText);
			var comments_dom = create_comment_item(comments.data);
			var insert_area = document.getElementById("comment_area");
			insert_area.insertBefore(comments_dom, insert_area.firstChild);
		}
	}).send(null);
	// 処理終了後、10秒後にもう一度関数を実行する
	comment_timer_id = setTimeout(comment_timer, 1000 * 10);
}

// コメントの要素を作る
// comments: コメントの内容を表すJSON
// return: コメント欄の要素
function create_comment_item(comment_json) {
	var temp = document.createDocumentFragment();
	var length = comment_json.length;
	var template = document.getElementById("comment_template");
	var comment;
	for (var i = length - 1; i >= 0; i = (i - 1)) {
		comment = template.cloneNode(true);
		comment.id = comment_json[i].tl_id;
		comment.querySelector(".user_name").textContent = comment_json[i].name;
		var date = new Date(comment_json[i].datetime);
		if (date.toString() !== "Invalid Date") {
			date = format_md(date) + " " + format_hms(date);
			comment.querySelector(".tl_time").innerHTML = date;
		}
		comment.querySelector(".comment_text").innerHTML = comment_json[i].items;
		temp.appendChild(comment);
	}
	return temp;
}

// コメントの再取得
function reget_comment() {
	// 既存のタイマーを停止
	clearTimeout(comment_timer_id);
	// 新しくこのタイミングから再スタート
	comment_timer_id = comment_timer();
}

// コメントを送信する
function send_comment() {
	var comment = encodeURIComponent(document.getElementById("comment").value.replace(/\r?\n/g, "<br>"));
	if (comment.length !== 0) {
		// リクエスト作成
		var request = create_request("POST", request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				console.log("send comment", "きてるよ", this.responseText);
				var json = JSON.parse(this.responseText);
				if (json.ok) {
					json.data.user_id = user_id;
					//console.log(json.data);
					var comment = create_comment_item(json.data);
					var area = document.getElementById("comment_area");
					area.insertBefore(comment, area.firstChild);
					// コメント送信ボタンをクリックできなくする
					document.getElementById("comment_button").disabled = true;
					// コメントの取得
					// reget_comment();
				} else {
					console.log("データを保存できなかった");
				}
			}
		});
		// リクエスト作成 ここまで

		var post = [
			"cmd=tl_send&user_id=", user_id,
			"&comment=", comment,
			"&user_id=", user_id,
			"&datetime=", encodeURIComponent(Date())
		].join("");
		console.log("send comment", post);
		request.send(post);
		// 入力されたものを消す
		document.getElementById("comment").value = "";
		document.getElementById("comment_button").disabled = true;
	} else {
		alert("コメントが空です。\nコメントを入力してください");
	}
}
