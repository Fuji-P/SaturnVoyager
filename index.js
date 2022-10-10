"use strict";

let stars = [];		//隕石の場所を保持する配列
let keymap = [];	//現在どのキーが押されているか保持する配列
let ctx;			//グラフィックコンテキスト
let ship;			//自機のオブジェクト
let score = 0;		//現在の点数
let speed = 25;		//スピード
let timer = NaN;	//タイマー

//自機オブジェクトを作るためのコンストラクタ
function Ship(x, y) {
	this.x = x;
	this.y = y;
	//キーの押下状態を保持
	this.keydown = function(e) {
		keymap[e.keyCode] = true;
	};
	this.keyup = function(e) {
		keymap[e.keyCode] = false;
	};
	//キーの押下状態を見て自機を移動する
	this.move = function() {
		if (keymap[37]) {		//左
			this.x -= 30;
		}
		else if (keymap[39]) {	//右
			this.x += 30;
		}
		if (keymap[38]) {		//上
			this.y -= 30;
		}
		else if (keymap[40]) {	//下
			this.y += 30;
		}
		this.x = Math.max(-800, Math.min(800, this.x));
		this.y = Math.max(-800, Math.min(800, this.y));
	}
}

//vまでの範囲のランダムな整数値を返す
function random(v) {
	return Math.floor(Math.random() * v);
}

//ゲームの初期化
function init() {
	//隕石を200個生成し、配列starsに格納
	for (let i = 0; i < 200; i++) {
		stars.push({
			x: random(800 * 4) - 1600,
			y: random(800 * 4) - 1600,
			z: random(4095),
			r: random(360),
			w: random(10) - 5
		});
	}
	//自機のオブジェクトを作成
	ship = new Ship(200, 200);
	//キー押下用のイベントハンドラを設定
	onkeydown = ship.keydown;
	onkeyup = ship.keyup;
	let space = document.getElementById("space");
	//コンテキストにフォントを設定
	ctx = space.getContext("2d");
	ctx.font = "20pt Arial";
	//再描画
	repaint();
}

//ゲーム開始
function go() {
	let space = document.getElementById("space");
	//マウスやタッチのイベントハンドラを設定
	space.onmousedown = mymousedown;
	space.onmouseup = mymouseup;
	space.oncontextmenu = function(e) {
		e.preventDefault();
	};
	space.addEventListener('touchstart', mymousedown);
	space.addEventListener('touchend', mymouseup);
	document.body.addEventListener('touchmove', function(event) {
		event.preventDefault();
	}, false)
	//STARTボタンを非表示
	document.getElementById("START").style.display = "none";
	//BGMの再生を開始
	document.getElementById("bgm").play();
	//メインループtickを開始
	timer = setInterval(tick, 50);
}

//マウスの押下される場所に応じて上下左右キーが押下された場合と同様の処理を行う
function mymousedown(e) {
	let mouseX = (!isNaN(e.offsetX) ? e.offsetX : e.touches[0].clientX) - 400;
	let mouseY = (!isNaN(e.offsetY) ? e.offsetY : e.touches[0].clientY) - 400;
	if (Math.abs(mouseX) > Math.abs(mouseY)) {
		keymap[mouseX > 0 ? 37 : 39] = true;
	}
	else {
		keymap[mouseY > 0 ? 38 : 40] = true;
	}
}

function mymouseup(e) {
	keymap = [];
}

//メインループ
function tick() {
	for (let i = 0; i < 200; i++) {
		let star = stars[i];
		//隕石のz方向の値をspeed分減らす(自機の方へ隕石を近づけている)
		star.z -= speed;
		//隕石を回転させる
		star.r += star.w;
		//隕石がほぼ自分と同じ平面に到達したか判定
		if ( star.z < 64) {
			//x座標とy座標が至近であれば
			if (Math.abs(star.x - ship.x) < 50 &&
				Math.abs(star.y - ship.y) < 50) {
				//衝突→ゲームオーバー
				clearInterval(timer);
				timer = NaN;
				document.getElementById("bgm").pause();
				break;
			}
			//通過→奥へ再配置
			star.x = random(800 * 4) - 1600;
			star.y = random(800 * 4) - 1600;
			star.z = 4095;
		}
	}
	//scoreを増やして10の倍数になったらspeedを増やす
	if (score++ % 10 == 0) {
		speed++;
	}
	//自機の移動
	ship.move();
	//再描画
	repaint();
}

function repaint() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 800, 800);
	//隕石を遠い順番に並べる
	stars.sort(function(a, b) {
		return b.z - a.z;
	});
	//隕石の描画
	for (let i = 0; i < 200; i++) {
		let star = stars[i];
		let z = star.z;
		let x = ((star.x -ship.x) << 9) / z + 400;
		let y = ((star.y -ship.y) << 9) / z + 400;
		let size = (50 << 9) / z;
		//現在のコンテキストを保存
		ctx.save();
		//(x, y)を原点にする
		ctx.translate(x, y);
		//遠くの隕石ほど暗くする
		ctx.globalAlpha = 1 - (z / 4096);
		//座標系を回転する
		ctx.rotate(star.r * Math.PI / 180);
		ctx.drawImage(rockImg, -size / 2, -size / 2, size, size);
		ctx.restore();
	}
	//スコア
	ctx.drawImage(scope, 0, 0, 800, 800);
	ctx.fillStyle = "green";
	ctx.fillText(('0000000' + score).slice(-7), 670, 60);
	if (isNaN(timer)) {
		ctx.fillText("GAME OVER", 315, 350);
	}
}