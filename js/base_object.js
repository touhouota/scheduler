var Base = {
	request_path: './ruby/server.rb',

	create_request: function(method, url, callback) {
		var request = new XMLHttpRequest();
		request.open(method, url);
		if (url.match("cmd=list")) {
			// キャッシュを無効にする
			request.setRequestHeader('Pragma', 'no-cache');
			request.setRequestHeader('Cache-Control', 'no-cache');
			request.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');
		}
		request.onreadystatechange = callback;
		return request;
	},

	// Safari用、フォーム情報をオブジェクトに直す
	form_element_to_object: function(form) {
		let inputs = form.querySelectorAll("input, select, textarea");
		let array = [].slice.call(inputs);
		const array_length = array.length;
		let formdata = {};
		for (let i = 0; i < array_length; i++) {
			formdata[array[i].name] = array[i].value;
		}

		return formdata;
	},

	// クッキーをオブジェクトに直すもの
	get_cookie: function(property) {
		var result = {};
		var all = document.cookie;
		if (all.length !== 0) {
			var cookies = all.split(";");
			var length = cookies.length;
			for (var i = 0; i < length; i++) {
				var cookie = cookies[i].split("=");
				// console.log(cookie);
				if (cookie[1].length !== 0) {
					result[cookie[0].trim()] = cookie[1];
				} else {
					result[cookie[0].trim()] = null;
				}
			}
		}

		if (property) {
			// 引数があるとき
			if (result[property]) {
				// cookieの中に引数のものがあれば返す
				return result[property];
			} else {
				// なければnull
				return null;
			}
		} else {
			// 引数がない時は、cookieのobjectを返す
			return result;
		}
	},

	parents: function(dom, selector) {
		var parent = [];
		var target = dom;
		if (dom.classList.contains(selector)) return dom;
		while (target.parentElement) {
			target = target.parentElement;
			// console.log(target);
			if (target.classList.contains(selector)) {
				return target;
			}
			parent.push(target);
		}
		return parent;
	},

	/////////////////////////////
	// 指定した要素の祖先要素を返す関数
	// クラス名を指定した場合、あればその要素を返す
	// なければ、祖先要素を含んだ配列を返す
	/////////////////////////////
	logout: function() {
		document.cookie = "user_id=";
		document.cookie = "name=";
		window.location = "./index.html";
	},

	// 特定のあたい(num)を少数第at位で四捨五入する
	round_at: function(num, at) {
		let pow_num = Math.pow(10, Number(at));
		let input_num = Number(num);
		return Math.round(input_num * pow_num) / pow_num;
	},

	format_ymd: function(date) {
		// toISOString: "2017-11-07T09:02:24.387Z"という形式
		return date.toISOString().split("T").shift();
	},

	format_hms: function(date) {
		// toTimeString: 14:39:07 GMT-0600 (PDT)という形式
		return date.toTimeString().split(" ").shift();
	}
}
