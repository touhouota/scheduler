//////////////////////
// タスクのテンプレート
//////////////////////
var task = document.createElement("form");
task.classList.add("task");

var br = document.createElement("br");

var task_main = document.createElement("div");
task_main.classList.add("task_main");

var timer_button = document.createElement("button");
timer_button.type = "button";
timer_button.classList.add("timer_button");
timer_button.name = "timer_button";
timer_button.value = 0;
timer_button.textContent = "Task Start";

task_main.appendChild(timer_button);

var task_name = document.createElement("span");
task_name.classList.add("task_name");
task_main.appendChild(task_name);
task_main.appendChild(br.cloneNode(false));

var time_area = document.createElement("span");
time_area.classList.add("time_area");

var image = document.createElement("span");
image.classList.add("image");
image.textContent = "予想時間： なし";
time_area.appendChild(image);

var real = document.createElement("span");
real.classList.add("real");
var real_time = document.createElement("span");
real_time.classList.add("time");
real.appendChild(document.createTextNode("経過時間： "));
real.appendChild(real_time);
time_area.appendChild(real);
task_main.appendChild(time_area);
task_main.appendChild(br.cloneNode(false));

// 終了状態を表すラベル
var status_area = document.createElement("span");

var comp_label = document.createElement("label");
comp_label.classList.add("comp_label");
comp_label.appendChild(document.createTextNode("完了:"));
var comp_radio = document.createElement("input");
comp_radio.type = "radio";
comp_radio.name = "finish_type";
comp_radio.value = 2;
comp_radio.required = true;
comp_label.appendChild(comp_radio);
status_area.appendChild(comp_label);

var noncomp_label = document.createElement("label");
noncomp_label.classList.add("noncomp_label");
noncomp_label.appendChild(document.createTextNode("未達成:"));
var noncomp_radio = document.createElement("input");
noncomp_radio.type = "radio";
noncomp_radio.name = "finish_type";
noncomp_radio.value = 3;
noncomp_label.appendChild(noncomp_radio);
status_area.appendChild(noncomp_label);

task_main.appendChild(status_area);


task.appendChild(task_main);
var task_sub = document.createElement("div");
task_sub.classList.add("task_sub");

// 詳細部分
var task_detail_text = document.createElement("p");
var task_detail_span = document.createElement("span");
task_detail_span.textContent = "タスクの内容・終了条件等";
task_detail_span.classList.add("task_detail_span");
task_sub.appendChild(task_detail_span);
task_detail_text.innerHTML = "詳細を決めていません<br>タスクを始める前に決めよう！";
task_detail_text.classList.add("task_detail");
task_sub.appendChild(task_detail_text);

var end_detail = document.createElement("details");
var end_summary = document.createElement("summary");
end_summary.textContent = "振り返り・メモ";
end_detail.classList.add("end_detail");
end_detail.appendChild(end_summary);
var end_text = document.createElement("textarea");
end_text.classList.add("end_text");
end_text.name = "end_detail";
end_text.placeholder = "タスクを進めている時の状態や困ったことなどをメモしよう";

end_detail.appendChild(end_text);
task_sub.appendChild(end_detail);

// 終了した情報をサーバへ送る
var send_button = document.createElement("button");
send_button.classList.add("send_button");
send_button.classList.add("hidden");
send_button.type = "button";
// 送信時、何らかの文字を送る場合はここへ
send_button.value = "sned";
send_button.textContent = "タスクを終了";
task_sub.appendChild(send_button);

// タスク情報を書き換えるボタン
var modal_button = document.createElement("p");
modal_button.classList.add("modal_open");
modal_button.textContent = "[タスク情報の追加・修正をする]";

task_sub.appendChild(modal_button);
task.appendChild(task_sub);
/////////////////
