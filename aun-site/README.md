# 阿吽コーポレートサイト プロトタイプ

確定コンセプト **「滋賀のふくしを、支える場所から、育つ場所へ。」**（A案）にもとづく、
制作会社への意図伝達用トップページプロトタイプ。

静的HTML/CSS/JSのみで動作します（ビルド不要・外部CDN不使用・オフライン動作可）。

## 起動方法

```bash
cd aun-site
python3 -m http.server 8000
# → http://localhost:8000/ をブラウザで開く
```

`index.html` をダブルクリックして直接開いても表示できます（file:// でも動作します）。

## 構成

```
aun-site/
├── index.html        トップページ（全セクション）
├── css/
│   ├── fonts.css     セルフホストフォントの @font-face
│   └── style.css     デザインシステム一式
├── js/main.js        モバイルメニュー・スクロール表示のみ
└── assets/fonts/     サブセット済み woff2（下記参照）
```

## デザインシステム（変更しないこと）

| 色 | HEX | 使用率 | 用途 |
|---|---|---|---|
| Soft White | `#F7F5F0` | 70% | 背景・余白 |
| AUN Turquoise | `#60BDC4` | 20% | 面・図形・ノード |
| Deep Teal | `#073E47` | 7% | 本文・見出し・強い面（行動導線帯） |
| Warm Orange | `#D48151` | 3% | 罫線・小タグ |
| Action Orange 700 | `#A84F2D` | CTAのみ | 白文字ボタン専用 |

- ターコイズ面に白文字の本文を置かない／Warm Orange に白文字を置かない
- 明るい背景上の英字ラベルはコントラスト確保のため `--tq-ink #2E7B84` を使用（WCAG 2.2 AA）
- 見出し：Shippori Mincho ／ 本文：Zen Kaku Gothic New ／ 英字：Manrope

## フォントについて

Google Fonts の SIL OFL フォントを、このページの文字だけにサブセットして
`assets/fonts/` に同梱しています（全ひらがな・カタカナ・ASCII・使用漢字を含む）。
**文言に新しい漢字を追加した場合**は、サブセットに含まれず代替フォントで表示されるため、
以下で再生成してください。

```bash
pip install fonttools brotli
# 元TTFは https://github.com/google/fonts/tree/main/ofl の各フォントを取得
pyftsubset ShipporiMincho-Bold.ttf \
  --text-file=<ページ全文を書き出したtxt> \
  --flavor=woff2 --layout-features='palt,kern,liga' \
  --output-file=assets/fonts/shippori-bold.woff2
```

（本番実装では Google Fonts 直読みでも可。その場合 `css/fonts.css` を読み込みごと差し替え）

## FV写真について（重要）

FVは**阿吽専用の実写を入れる前提の構図ガイド**を実装しています。
AI生成・借用・ストック写真は使用していません。ガイドが指定しているのは：

- 被写体＝**本人（生活の主体）**。自分の意思で暮らしの行為へ向かう瞬間
- 左1/3 …… コピー保護領域（文字と余白のためにあける）
- 中央右 …… 被写体ボリュームと視線高（EL）
- 破線帯 …… モバイル（9:16）で残す範囲
- 支援者は奥行きとして。集合笑顔・足元のみ・風景のみ・機器説明写真は不可

## 掲載情報の根拠

事業・拠点の記載は公式サイト（aun-shiga.co.jp）および公開情報で確認できた範囲のみ。
電話番号・営業時間・所在地詳細は未掲載（正式版で要確認のうえ掲載）。
ロゴは正式データ支給までのプレースホルダー（あ・うんの2円モチーフ＋ロゴタイプ）。
