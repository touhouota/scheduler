// バルーンのオープン・クローズを行う
function balloon() {
	var help = document.getElementById("help");
	if (help.classList.contains("hide")) {
		help.classList.remove("hide");
	} else {
		help.classList.add("hide");
	}
}
