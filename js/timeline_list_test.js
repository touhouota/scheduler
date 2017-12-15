let Timeline = {
	timer: null,

	create_item: function(item_list) {
		// 一時的においておく場所を作成
		let fragment = document.createDocumentFragment();
		// テンプレートタグから要素を複製
		let _template = document.getElementById("timeline_template");
		let template = document.importNode(_template.content, true);
		// コメントを一つづつ作成する
		// item_list.forEach(function(comment_item) {
		let i = 0;
		let length = item_list.length;
		for (i = 0; i < length; i += 1) {
			let comment = template.cloneNode(true);
			let comment_item = item_list[i];
			// tl_id:xxxxとなる
			comment.querySelector(".comment_container").id = "tl_id:" + comment_item.tl_id;

			// ユーザ名
			comment.querySelector(".user_name").textContent = comment_item.name;

			// 日付の表示
			var date = new Date(comment_item.datetime);
			comment.querySelector(".tl_time").textContent = [
				date.getMonth() + 1, "月",
				date.getDate(), "日 ",
				Base.format_hms(date),
			].join("");

			// コメントの内容を記載
			comment.querySelector(".comment_text").innerHTML = comment_item.items;
			Notify.create_instance(comment_item.items);
			fragment.insertBefore(comment, fragment.firstElementChild);
		};

		return fragment;
	},

	append: function() {
		let comment = encodeURIComponent(document.getElementById("comment").value.replace(/\r?\n/g, "<br>"));
		if (comment.length === 0) {
			// コメントの入力欄に何も入っていない場合は、何もしない
			Notify.create_instance("コメントが空です。\nコメントを入力してください");
			return
		}
		// リクエスト作成
		var request = Base.create_request("POST", Base.request_path, function() {
			if (this.status == 200 && this.readyState == 4) {
				console.log("send comment", "きてるよ", this.responseText);
				var json = JSON.parse(this.responseText);
				if (json.ok) {
					var comment = Timeline.create_item(json.data);
					var area = document.getElementById("comment_area");
					area.insertBefore(comment, area.firstChild);
					// // コメント送信ボタンをクリックできなくする
					// document.getElementById("comment_button").disabled = true;
				} else {
					console.log("データを保存できなかった");
				}
			}
		});
		// リクエスト作成 ここまで

		var post = [
			"cmd=insert_timeline",
			"&comment=", comment,
			"&user_id=", Base.get_cookie('user_id'),
		].join("");
		console.log("send comment", post);
		request.send(post);
		// 入力されたものを消す
		document.getElementById("comment").value = "";
		document.getElementById("comment_button").disabled = true;
	},

	set_timer: function() {
		let last_comment = document.getElementById("comment_area").firstElementChild;
		let query = ["?cmd=get_timeline", "&user_id=", Base.get_cookie('user_id')].join("");
		if (last_comment !== null) {
			query += "&last=" + last_comment.id.split(":").pop();
		}
		Base.create_request("GET", Base.request_path + query, function() {
			if (this.readyState == 4 && this.status == 200) {
				let response = JSON.parse(this.responseText);
				// コメントの要素を作成
				let comments = Timeline.create_item(response.data);
				// 追加
				let comment_area = document.getElementById("comment_area");
				comment_area.insertBefore(comments, comment_area.firstElementChild);
			}
		}).send(null);
		// 処理終了後、1秒後にもう一度関数を実行する
		Timeline.timer = setTimeout(Timeline.set_timer, 1500);
	},

	check_comment_textarea: function() {
		var comment = document.getElementById("comment");
		var button = document.getElementById("comment_button");
		if (comment.value.length === 0) {
			button.disabled = true;
		} else {
			button.disabled = false;
		}
	},
};