# wtfe2 (WTF, Engineer?)

[English](README.md)

wtfe2 は、ソフトウェアを作るという奇妙な仕事を描いた漫画を集めて、英語と日本語で紹介するサイト。改変を認める Creative Commons ライセンスで公開されている作品は描き文字を日本語に差し替えて載せ、それ以外のサイトは紹介とリンクにとどめて、作品は元のサイトに置いたままにする。

サイト: <https://0-draft.github.io/wtfe2/> (English) · <https://0-draft.github.io/wtfe2/ja/> (日本語)

## 載っているもの

| 本棚 | サイト | 扱い |
| --- | --- | --- |
| 日本語版あり | xkcd (CC BY-NC 2.5)、TurnOff.us (CC BY-NC-SA 4.0)、Abstruse Goose (CC BY-NC 3.0 US) | 選んだ作品を、英語版のページでは原画のまま、日本語版のページでは描き文字を日本語にして載せる |
| リンクのみ | SMBC、Existential Comics、MonkeyUser、The Daily WTF、CommitStrip、The Oatmeal、PHD Comics | サイトの紹介、そのサイト自身の利用条件の引用、最初に読むとよい作品へのリンク |

ここにある漫画はどれも非商用に限って利用が許されているので、広告もスポンサーもアフィリエイトリンクも置かない。

## 日本語の描き文字の仕組み

1. `src/data/comics/<slug>.json` に、作品の描き文字を領域ごとに記録している。画像の中で描き文字が占める枠、原文そのまま、手で改行を入れた日本語の 3 つ。
2. `scripts/plates.ts` が、`public/comics/` の原画からクリーンプレートを作る。領域の枠に完全に収まるインクの線は描き文字として消し、枠からはみ出す線 (吹き出しの輪郭、しっぽ、フローチャートの菱形など) は絵として残す。消し残った薄いアンチエイリアスも消すが、残した線の近くには手を付けない。枠線に接している描き文字には `erase: "rect"` を使う。
3. `src/components/ComicStage.astro` が、プレートの上に日本語を画像ではなく文字として重ねる。位置は画像に対する割合、文字サイズはコンテナクエリ単位で指定しているので、どの幅でも絵と一緒に拡大縮小する。日本語版のページにはトグルがあり、原文に戻して見比べられる。

プレートとカード用のサムネイルは `dev` / `build` / `check` のたびに生成し、リポジトリには入れない。

## 作品の追加

1. そのサイトのライセンスが改変を認めているか確認する。対象は `src/data/sites.json` で `"tier": "translated"` になっているサイトだけ。
2. 原画を `public/comics/<slug>.png` に保存する (配信元に 2x の画像があればそちらを使う)。
3. 描き文字の枠を決める。`pnpm measure public/comics/<slug>.png x,y,w,h ...` で、おおまかな枠をインクにぴったり合わせられる。
4. `src/data/comics/<slug>.json` を書き、`pnpm plates <slug>` を実行して `public/plates/<slug>.png` を目で確認する。
5. 下のチェックを走らせる。日本語の描き文字が枠からはみ出すと E2E テストが落ちる。

## 開発

Node 24 以上と pnpm が必要。

```sh
pnpm install
pnpm dev            # http://localhost:4321/wtfe2/
pnpm build          # プレート、サムネイル、dist/ に静的サイト
pnpm validate:data  # スキーマ、画像サイズ、領域の範囲、ライセンスの規則
pnpm test           # ユニットテスト (Vitest)
pnpm test:e2e       # ビルド済みサイトに Playwright + axe、デスクトップとモバイル
pnpm lint && pnpm lint:md && pnpm check
```

## CI

push と pull request のたびに、Biome、markdownlint、`astro check`、カバレッジ付き Vitest、データ整合性チェック、ビルド、デスクトップとモバイルでの Playwright + axe、内部リンクチェック、actionlint と zizmor、依存関係の監査を走らせる。CodeQL は毎週と push 時に実行する。原作へのリンクは毎週チェックする。pull request には、誤訳、ライセンスの問題、事実の誤りを見る Claude のレビューも付く。Dependabot が npm パッケージと GitHub Actions を毎週更新する。`main` への push は、チェックが通ったあと GitHub Pages にデプロイされる。

## ライセンス

- コード: [MIT](LICENSE)。
- このサイトのために書いた文章 (解説、紹介文、画面の文言): [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja)。漫画の翻訳は、その作品のライセンスに従う。
- 漫画: 権利は各作者にある。各作品のページに原作、作者、ライセンスを記載している。翻案した画像は原作と同じライセンスで公開する。

ここに載っている漫画の作者で、変更や削除を希望する場合は [issue を立ててほしい](https://github.com/0-draft/wtfe2/issues)。
