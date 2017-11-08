var option_text = ["未着手", "実行中", "終了！", "未達成..."];
var request_path = "/b1013179/scheduler/ruby/command.rb";
var user_id = get_cookie().user_id;

function create_request(method, url, callback) {
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
}

function get_cookie() {
	var result = {};
	var all = document.cookie;
	if (all.length !== 0) {
		var cookies = all.split(";");
		var length = cookies.length;
		for (var i = 0; i < length; i++) {
			var cookie = cookies[i].split("=");
			result[cookie[0].trim()] = cookie[1];
		}
	}
	return result;
}

// ユーザidがなければtrue/あればfalse
function check_userid() {
	if (!get_cookie().user_id) return true;
	return false;
}

// 日付をYYYY-MM-DDにする
function format_ymd(date) {
	var locale_date = date.toLocaleDateString().split("/");
	var length = locale_date.length;
	for (var i = 0; i < length; i++) {
		if (locale_date[i].length == 1) {
			locale_date[i] = [0, locale_date[i]].join("");
		}
	}
	return locale_date.join("-");
}

// 時間を時間をHH:MM:SSにする
function format_hms(date) {
	var split_date = date.toLocaleTimeString().split(":");
	if (Number(split_date[0]) < 10)
		split_date[0] = ['0', split_date[0]].join('');
	return split_date.join(':');
}

// 時間をMM月DD日にする
function format_md(date) {
	return [date.getMonth() + 1, '月', date.getDate(), '日'].join("");
}

// 秒数からHH:MM:SSを作る
function convert_hms_from_seconds(seconds) {
	var argv_sec = seconds;
	var hour = Math.floor(argv_sec / (60 * 60));
	argv_sec -= hour * (60 * 60);
	if (hour < 10)
		hour = ["0", hour].join("");

	var min = Math.floor(argv_sec / 60);
	argv_sec -= min * 60;
	if (min < 10)
		min = ["0", min].join("");

	var sec = Math.floor(argv_sec);
	if (sec < 10)
		sec = ["0", sec].join("");

	return [hour, ":", min, ":", sec].join("");
}

// hh:mm:ssから秒を作る
function convert_seconds_from_hms(timer_format) {
	// 文字列を配列に分割 => 文字列を数字に変更
	var time_array = timer_format.split(":").map(function(elem) {
		return Number(elem);
	});
	return (time_array[0] * 3600) + (time_array[1] * 60) + time_array[2];
}

// numを小数第n位で四捨五入する関数
function any_num_round(num, n) {
	if (n > 0) {
		var n_ten = Math.pow(10, n);
		return Math.round(num * n_ten) / n_ten;
	} else {
		return NaN;
	}
}

/////////////////////////////
// 指定した要素の祖先要素を返す関数
// クラス名を指定した場合、あればその要素を返す
// なければ、祖先要素を含んだ配列を返す
/////////////////////////////
function parents(dom, selector) {
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
}

/////////////////////////////
// domにclass_nameがある場合、削除し
// ない場合は追加する
// 副作用あり(引数の要素を書き換える)
/////////////////////////////
function toggle_class(dom, class_name) {
	if (dom.classList.contains(class_name)) {
		dom.classList.remove(class_name);
	} else {
		dom.classList.add(class_name);
	}
}
