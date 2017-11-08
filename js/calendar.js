/* jshint esversion: 6 */

var Calendar = function(today, target) {
	this.today = today;
	// テーブルの要素を追加するターゲットの設定
	this.target = document.getElementById(target);
	this.setDate(today);
};

Calendar.prototype.create = function() {
	var days = [];
	var i;
	// １月分のカレンダーが入った配列を作る
	for (i = -this.firstDay + 1; i < 42 - this.firstDay + 1; i = i + 1) {
		if (0 < i && i <= this.allMonthDates[this.month]) {
			days.push(i);
		} else {
			days.push("-");
		}
	}

	// 週ごとに配列を切り分け
	const weeks = [];
	const days_len = days.length;
	const slice_size = 7;
	for (i = 0; i < Math.ceil(days_len / slice_size); i = i + 1) {
		const index = i * slice_size;
		const sliced = days.slice(index, index + slice_size);
		weeks.push(sliced);
	}

	var table_rows = document.createDocumentFragment();
	const td = document.createElement("td");
	const tr = document.createElement("tr");
	const week_len = weeks.length;
	var j;
	for (week_num = 0; week_num < week_len; week_num = week_num + 1) {
		const week = tr.cloneNode(true);
		for (day_num = 0; day_num < slice_size; day_num = day_num + 1) {
			const day = td.cloneNode(true);
			day.textContent = weeks[week_num][day_num];
			if (typeof weeks[week_num][day_num] === "number") {
				// 日にちならばtodayクラスを付与
				day.classList.add("days");
				if (weeks[week_num][day_num] === this.date) day.classList.add("today");
			} else {
				// 日付でないときnoと付与
				day.classList.add("no");
			}
			week.appendChild(day);
		}
		table_rows.appendChild(week);
	}

	this.target.textContent = null;
	this.target.appendChild(table_rows);
};

Calendar.prototype.setDate = function(today) {
	this.today = today;
	this.year = today.getFullYear(); // 年
	this.month = today.getMonth(); // 月
	this.date = today.getDate(); // 日付

	// その月の初日の曜日を設定
	var first = new Date(this.year, Number(this.month), 1);
	this.firstDay = first.getDay();

	// すべての月の日数を保持
	this.allMonthDates = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	// 閏年の判定
	if (((this.year % 4) === 0 && (this.year % 100) !== 0) || (this.year % 400) === 0) {
		this.allMonthDates[1] = 29;
	}
};

function create_task(date_str) {
	const task = document.getElementById("task_temp").content;
	task.querySelector(".task_name").textContent = date_str + "のタスク";
	task.querySelector(".task_contents").textContent = "あれこれ";
	// templateを有効化したものを返す
	// つまりDOMとして返す
	return document.importNode(task, true);
}

window.onload = function() {
	const today = new Date();
	var calendar = new Calendar(today, "calendar_body");
	const target = document.getElementById("month");
	target.addEventListener("change", () => {
		calendar.setDate(new Date(target.value));
		calendar.create();
	});
	let month = calendar.month;
	let date = calendar.date;
	if (month < 10) month = "0" + month;
	target.value = [calendar.year, month].join("-");
	calendar.create();

	var table = document.getElementById("calendar_body");
	table.addEventListener("click", function(event) {
		const click_target = event.target;
		if (click_target.classList.contains("no")) return;
		let task = create_task(click_target.textContent);
		click_target.appendChild(task);
		console.log("click", click_target);
	});

	let prev = document.getElementById("prev");
	prev.addEventListener("click", function() {
		calendar.today.setDate(calendar.today - 1);
		calendar.setDate(calendar.today);
	});

	let next = document.getElementById("next");
	next.addEventListener("click", function() {
		calendar.today.setDate(calendar.today + 1);
		calendar.setDate(calendar.today);
	});
};
