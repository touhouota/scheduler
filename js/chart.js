// データ形式
//{
//  title: "グラフタイトル",
//  data: {
//    plan: [1, 5, 4...],
//    real: [3, 1, 6...]
//  }
//}


class Chart {
	constructor(htmldom, chart_data) {
		this.target = document.getElementById(htmldom);
		this.chart_data = chart_data;
		// console.log("constructor", this.chart_data, chart_data);
	}

	render() {
		this.draw(this.target, this.chart_data);
	}

	draw(canvas, chart_data) {
		var ctx = canvas.getContext("2d");
		// Canvasサイズを持つオブジェクト
		var size = {
			"width": canvas.width,
			"height": canvas.height,
		};
		//  size.graph_height = (size.height / 5) * 4;
		//  size.title_height = size.height / 5;
		size.graph_height = size.height;
		size.title_height = 0;
		size.white = size.graph_height / 3;
		size.bar_height = (size.graph_height / 4);

		// それぞれのデータを持つ人
		// console.log("render", this.chart_data);
		var plan_data = this.chart_data.data.plan.map(function(hour) {
			// 時間(h)で保存してあるデータを分になおす
			return hour * 60;
		});
		var real_data = chart_data.data.real;
		// 各データの合計を求め、グラフを描く上での割合を求める
		var sum = [0, 0];
		for (var i = 0; i < plan_data.length; i = (i + 1)) {
			//chart_data.data.plan[i] *= 60;
			sum[0] += plan_data[i];
			sum[1] += real_data[i];
		}
		if (sum[0] < sum[1]) {
			size.range = sum[1];
		} else {
			size.range = sum[0];
		}
		// plan のバー高さ
		var plan_y = (size.white / 3) + size.title_height;
		// real のバー高さ
		var real_y = (size.white / 3) * 2 + size.bar_height + size.title_height;
		//console.log(size);
		// タイトル部分
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(0, 0, size.width, size.title_height);

		ctx.strokeStyle = "rgb(255,255,255)";
		ctx.moveTo(0, size.title_height);
		ctx.lineTo(size.width, size.title_height);

		// グラフ部分
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(0, size.title_height, size.width, size.graph_height);

		// 罫線を引く
		this.draw_rule(ctx, size);

		// 余白を取るために、サイズを若干小さくしている
		// plan
		this.draw_chart(ctx, plan_y, plan_data, size);
		// real
		this.draw_chart(ctx, real_y, real_data, size);

		// 線を引く
		ctx.stroke();
	}

	draw_chart(ctx, start_heigt, data, size) {
		var x = 0;
		var color_range = 360 / data.length;
		var scale = (size.width - size.width * 0.1) / size.range;
		//console.log(scale);
		for (var i = 0; i < data.length; i = (i + 1)) {
			ctx.fillStyle = "hsl(" + color_range * i + ", 90%, 50%)";
			ctx.fillRect(x, start_heigt, data[i] * scale, size.bar_height);
			x += data[i] * scale;
			//console.log("グラフを描く", x, x * scale);
		}
	}

	// 罫線を引くための関数
	draw_rule(ctx, size) {
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;
		// 30分ごとに線を引く
		var scale = (size.width - size.width * 0.1) / size.range;
		var range = scale * 30;
		for (var i = 0; i < size.width; i += range) {
			//console.log("rule", (i + 0.5) | 0);
			ctx.beginPath();
			// 端数を切り捨てて整数の部分に描画する
			ctx.moveTo((i - 0.5) | 0, size.title_height);
			ctx.lineTo((i - 0.5) | 0, size.height - 20);
			ctx.stroke();
			var minutes = Math.round((i / range)) * 0.5;
			if (minutes !== 0) {
				//console.log(minutes, "分");
				ctx.fillStyle = "#000";
				ctx.fillText(minutes.toFixed(1), (i - 10.5) | 0, size.height - 10);
			}
		}
	}
}
