# PLACE LIBRE ロゴモーション（方向性の試作）

ロゴをベクター化し、4つの方向性でループアニメーションを試作したものです。
`logo-motion.html` をブラウザで開くと4案を並べて再生できます。

| 案 | 名前 | 尺 | 概要 |
|---|---|---|---|
| A | ひと筆で描く | 6.0秒 | 輪を線で描き、半円・文字・iの点の順に登場 |
| B | ふたつが出会う | 7.0秒 | 離れた2つの輪が溶け合ってロゴになる |
| C | 呼吸する | 6.0秒 | 常時表示のまま光がめぐり、半円が揺れる |
| D | はずむ | 6.0秒 | 落下・バウンド・文字のウェーブ |

## ファイル

- `source/` 元のロゴ画像（カラー・白）
- `vectorize.py` 元画像から `logo-data.json`（パーツごとのパス）と `logo.svg` を生成
- `motion.js` アニメーション本体。各案は時刻 t の純関数なので、動画書き出しにもそのまま使えます
- `page.template.html` 試作ページのテンプレート
- `build.py` テンプレートにデータと `motion.js` を埋め込み `logo-motion.html` を生成

```sh
pip install opencv-python-headless potracer   # vectorize.py を再実行する場合のみ
python3 vectorize.py
python3 build.py
```
