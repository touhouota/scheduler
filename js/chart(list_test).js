// データ形式
// data: {
//   plan: [1, 5, 4...],
//   real: [3, 1, 6...]
// }

let Chart = {
	// 外でも使うであろうものは、全体で定義しておこう
	canvas: null,
	context: null,
	// グラフの最大長とcanvas幅の比率
	// => 1分あたりの大きさ
	scale: null,
	bar_height: null,

	draw: function(canvas_id, plan, real) {
		// canvasに関する初期設定
		if (!Chart._init(canvas_id, real, plan)) {
			// ここに入る時は、データに不備がある場合
			alert("データの数が合いません。");
			return;
		};

		// 罫線を引く
		this.draw_rule();

		this.draw_time_bar(plan, this.canvas.height / 5);
		this.draw_time_bar(real, this.canvas.height * (3 / 5));
	},

	draw_rule: function() {
		let ctx = Chart.context;
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;

		// 30分毎に罫線を引く
		let range = Chart.scale * 30;
		const width = Chart.canvas.width;
		for (let i = 0; i < width; i = i + range) {
			ctx.beginPath();
			// 端数を切り捨てて整数の部分に描画する
			ctx.moveTo((i - 0.5) | 0, 10);
			ctx.lineTo((i - 0.5) | 0, Chart.canvas.height - 20);
			ctx.stroke();
			var minutes = Math.round((i / range)) * 0.5;
			if (minutes !== 0) {
				//console.log(minutes, "分");
				ctx.fillStyle = "#000";
				ctx.fillText(minutes.toFixed(1), (i - 10.5) | 0, Chart.canvas.height - 10);
			}
		}
	},

	draw_time_bar: function(data, graph_height) {
		let ctx = this.context;
		// グラフのX座標
		let x = 0;
		const size = data.length;
		let color_range = 360 / size;

		for (var i = 0; i < size; i = (i + 1)) {
			ctx.fillStyle = "hsl(" + color_range * i + ", 90%, 50%)";
			ctx.fillRect(x, graph_height, data[i] * Chart.scale, this.bar_height);
			x += data[i] * this.scale;
			//console.log("グラフを描く", x, x * scale);
		}
	},

	// canvasの初期化
	_init: function(canvas_id, real, plan) {
		Chart.canvas = document.getElementById(canvas_id);
		Chart.context = canvas.getContext("2d");
		// データ数があっているかを確認
		if (real.length !== plan.length) {
			// あっていないと、何もしない
			return false;
		}
		// データ数があっているならば、グラフを書くよ！

		// グラフの棒の高さを計算 
		// canvasの1/5のサイズにする
		Chart.bar_height = this.canvas.height / 4;

		// それぞれのデータの最大値を持つ
		let max = {
			real: 0,
			plan: 0,
		}
		let i = 0,
			size = real.length;
		for (i = 0; i < size; i = i + 1) {
			max.real += real[i];
			max.plan += plan[i];
		}
		// 最大のものをまずは保持
		if (max.real < max.plan) {
			Chart.scale = max.plan;
		} else {
			Chart.scale = max.real;
		}
		// キャンバスの幅とグラフの最大長の大きさの比率
		Chart.scale = (Chart.canvas.width - Chart.canvas.width * 0.1) / Chart.scale;

		return true;
	},

}
