let Notify = {
	init: function() {
		// ブラウザが通知をサポートしているか確認する
		if (!("Notification" in window)) {
			alert("このブラウザはシステム通知をサポートしていません");
		}

		// すでに通知の許可を得ているか確認する
		else if (Notification.permission === "granted") {
			// 許可を得ている場合は、通知を作成する
			var notification = this.create_instance("コメントなどの通知をします！");
		}

		// 許可を得ていない場合は、ユーザに許可を求めなければならない
		else if (Notification.permission !== 'denied') {
			Notification.requestPermission(function(permission) {
				// ユーザが許可した場合は、通知を作成する
				if (permission === "granted") {
					var notification = this.create_instance("コメントなどの通知をします！");
				}
			});
		}

		// 最後に、ユーザが通知を拒否した場合は、これ以上ユーザに 
		// 迷惑をかけてはいけないことを尊重すべきです。
	},

	create_instance: function(txt) {
		let instance = new Notification(txt);
		setTimeout(instance.close.bind(instance), 5000);
	}
};