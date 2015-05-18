# jikkyo

![jikkyo](http://rot1024.com/jikkyo/images/kinmoza_min.jpg)

ニコニコ動画から取得したコメントファイルやTwitterのタイムラインを、透明なウィンドウの上にニコニコ動画コメント風に流せる実況閲覧アプリです。

[jikkyo Webページ](https://rot1024.github.io/jikkyo/)

## 特徴

* Windows / Mac / Linux で動作します。
* 透明なウィンドウに好きな動画を重ねて実況が楽しめます。
* コメントの速度や文字サイズなどを細かく設定できます。
* 透明ウィンドウの後ろをクリックできる状態でも利用可能です（Windows/Macのみ）。

### ファイルモード

* ニコニコ動画のコメントファイル（XML）が読み込めます。
* コメントの盛り上がりをシークバーの背景に色で可視化します。
* ドラッグアンドドロップでコメントファイルを読み込めます。
* ニコニコ動画コメントの各種コマンドに対応。

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

* v1.1.0 (2015/05/18)
  * Windows / Macで、透明ウィンドウの後ろをクリックできる状態（ClickThrough）で起動できるようになりました（`jikkyo_ct.cmd` または `jikkyo_ct.command` から起動してください）
  * Twitterモード時に、コメントを右クリックしてメニューからNG登録ができるようになりました
  * Windowsで、初期設定でコメントに絵文字が表示されるようになりました（前バージョンから継続して使用中の方は、設定でフォントファミリーに `Segoe UI Symbol` を追加して下さい）
  * 録画ファイル名の設定を追加
  * 様々なバグフィックス・パフォーマンス向上
* v1.0.1 (2015/05/15)
  * 最新バージョン確認機能などのバグフィックス
* v1.0.0 (2015/05/15)
  * 公開

## GitHub

このアプリケーションはオープンソースで、 [MIT License](LICENSE) の下 [GitHub](https://github.com/rot1024/jikkyo) にてソースコードを公開しています。

バグ等が見つかりましたら、作者の Twitter [@aayh](http://twitter.com/aayh) にお知らせいただくか、 GitHub の issues に投げてください。

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

## Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

[MIT License](LICENSE)
