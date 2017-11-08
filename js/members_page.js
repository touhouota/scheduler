window.onload = function() {
	let date = new Date();
	let date_str = Base.format_ymd(date);
	// 日付を指定するイベント
	let date_input = document.getElementById("date");
	date_input.value = date_str;
	date_input.addEventListener("change", Members.change_date);

	Members.get_list_from_date(date);
}
