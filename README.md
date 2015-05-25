# jikkyo

![jikkyo](http://rot1024.com/jikkyo/images/kinmoza_min.jpg)

ニコニコ動画から取得したコメントファイルやTwitterのタイムラインを、透明なウィンドウの上にニコニコ動画コメント風に流せる実況閲覧アプリです。

[jikkyo Webページ](https://rot1024.github.io/jikkyo/)

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

### Twitterモード

* TwitterのTLをリアルタイムにコメントとして流せます。
* UserStream と FilterStream に対応。
* TLを録画してファイルに保存できます。
* テキスト・ユーザー名・クライアント名による（正規表現も利用可能な）ミュート機能。
* **イベントなどでスクリーンに映すと盛り上がります！**

## 注意点

* Macではウィンドウの最大化機能に問題があり、現在無効にしています。
* Linuxでの動作はまだ未検証です。

## 更新履歴

[Releases](https://github.com/rot1024/jikkyo/releases) をご覧下さい。

## ライセンス

このアプリケーションはオープンソースで、 [MIT License](LICENSE) の下 [GitHub](https://github.com/rot1024/jikkyo) にてソースコードを公開しています。

バグや要望等がありましたら、作者の Twitter [@aayh](http://twitter.com/aayh) にお知らせいただくか、 GitHub の issues に投げてください。

## 今後の予定

* つぶあにで過去のアニメ実況を楽しめる機能
* ニコニコ実況対応
* ニコニコ動画コメント取得機能

...etc

## For Developers

```sh
git clone https://github.com/rot1024/jikkyo.git
cd jikkyo
npm i
cd src
npm i
npm start

# Building
gulp release
```

### Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
