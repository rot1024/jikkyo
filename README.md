<h1 align="center"><img src="https://rot1024.github.io/jikkyo/images/jikkyo-logo.svg" alt="jikkyo" /></h1>

 [![repo](https://david-dm.org/rot1024/jikkyo.svg)](https://david-dm.org/rot1024/jikkyo)

ニコニコ動画から取得したコメントファイルやTwitterのタイムラインを、透明ウィンドウ上でニコニコ動画風に流せるデスクトップアプリ

![jikkyo](https://rot1024.github.io/jikkyo/images/kinmoza_min.jpg)

[jikkyo Webページ](https://rot1024.github.io/jikkyo/) | [ダウンロード](https://github.com/rot1024/jikkyo/releases/latest)

## 特徴

* Windows / Mac / Linux で動作します。
* 透明なウィンドウに好きな動画を重ねて実況が楽しめます。
* コメントの速度や文字サイズなどを細かく設定できます。
* 透明ウィンドウの後ろをクリックできる状態でも利用可能（Windows/Macのみ）。
* ニコニコ動画コメントの表示方法を忠実に再現 & 各種コマンドに対応。

### ファイルモード

* ニコニコ動画のコメントファイル（XML）が読み込めます。
* コメントの盛り上がりをシークバーの色で可視化します。
* ドラッグ・アンド・ドロップでコメントファイルを読み込めます。
* つぶあにから過去のアニメ実況を取得して楽しむことができます。

### Twitterモード

* TwitterのTLをリアルタイムにコメントとして流せます。
* UserStream と FilterStream に対応。
* TLを録画してファイルに保存できます。
* テキスト・ユーザー名・クライアント名による（正規表現も利用可能な）ミュート機能。
* イベントなどでスクリーンに映すと盛り上がります。

## 更新履歴

[Releases](https://github.com/rot1024/jikkyo/releases) をご覧下さい。

## For Developers

```sh
git clone https://github.com/rot1024/jikkyo.git
cd jikkyo
npm i
npm start

# Building
npm run release
```

### Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
