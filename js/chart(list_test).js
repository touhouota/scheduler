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

	draw: function(canvas, plan, real) {
		// canvasに関する初期設定
		if (!Chart._init(canvas, real, plan)) {
			// ここに入る時は、データに不備がある場合
			alert("データの数が合いません。");
			return;
		};

		// 一旦canvasの中身をまっさらにする
		this.reset();

		// 罫線を引く
		this.draw_rule();

		// 予想時間のグラフ
		this.draw_time_bar(plan, (this.canvas.height / 5) + 5);
		// 時差氏の時間のグラフ
		this.draw_time_bar(real, this.canvas.height * (3 / 5) - 5);
	},

	// 罫線を引く
	draw_rule: function() {
		let ctx = Chart.context;
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;

		// 30分毎に罫線を引く
		let range = Chart.scale * 30;
		console.log("range", range);
		const width = Chart.canvas.width;
		// width - 50: 時間を描画するために空けてある 
		for (let i = 0; i < width - 50; i = i + range) {
			ctx.beginPath();
			// 端数を切り捨てて整数の部分に描画する
			ctx.moveTo((i - 0.5) | 0, 15);
			ctx.lineTo((i - 0.5) | 0, Chart.canvas.height - 12);
			ctx.stroke();
			var minutes = Math.round((i / range)) * 0.5;
			if (minutes !== 0) {
				// console.log(minutes.toFixed(1), "分");
				ctx.fillStyle = "#000";
				ctx.fillText(minutes.toFixed(1), (i - 10.5) | 0, Chart.canvas.height - 2);
			}
		}
	},

	// 時間のグラフを弾く
	draw_time_bar: function(data, graph_height) {
		let ctx = this.context;
		// グラフのX座標
		let x = 0;
		const size = data.length;
		let color_range = 360 / size;

		for (let i = 0; i < size; i = (i + 1)) {
			ctx.fillStyle = "hsl(" + color_range * i + ", 90%, 50%)";
			ctx.fillRect(x, graph_height, data[i] * Chart.scale, this.bar_height);
			x += data[i] * this.scale;
			//console.log("グラフを描く", x, x * scale);
		}
		// 時間を表示する
		ctx.fillStyle = "#000";
		ctx.fillText(data + "分", this.canvas.width - 40, graph_height + 18);
		console.log(data + "分");
	},

	// canvasの初期化
	_init: function(canvas, real, plan) {
		this.canvas = canvas;
		this.context = this.canvas.getContext("2d");
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
		// 最大の長さは、canvas幅の7割りにする
		Chart.scale = (Chart.canvas.width - Chart.canvas.width * 0.3) / Chart.scale;

		return true;
	},

	reset: function() {
		console.log(this.canvas);
		// サイズを置き換えるので、中身がリセットされる。
		this.canvas.width = this.canvas.width;
	}

}
