# Browser Piano

ブラウザで弾けるピアノです。PC キーボードまたはタッチ / マウスで演奏できます。
HTML / CSS / JavaScript（ES Modules）だけで動き、ビルドは不要です。

## 使い方

### PC キーボード

キーボードの配置が鍵盤の配置と対応しています。中段が白鍵、上段が黒鍵です。

```
 Q   W   E   R   T   Y   U   I   O   P   [   ]      ← 黒鍵（黒鍵がない位置のキーは無効）
   A   S   D   F   G   H   J   K   L   ;   '        ← 白鍵
```

既定では `A` がド（C4）で、`A W S E D F T G Y H U J K` がドからオクターブ上のドまでに対応します。

| 操作 | キー |
| --- | --- |
| 割当を白鍵 1 つ下げる / 上げる | `,` / `.` |
| 割当を 1 オクターブ下げる / 上げる | `Z` / `X` |

ツールバーの `« ‹ › »` ボタンでも割当を移動できます。例えば `‹` を 2 回押すと `A` がラ（A3）になります。
鍵盤上には割り当てられたキーが表示されます。

### タッチ / マウス

鍵盤を押すと鳴ります。マルチタッチ（和音）と、指を滑らせて弾くグリッサンドに対応しています。

### 設定

右上の「設定」から、鍵盤の表示範囲、音量、キー表示の有無を変更できます。
設定と割当の位置はブラウザ（localStorage）に保存されます。

## 音源について

音声ファイルは使っていません。Web Audio API で倍音を合成してピアノ風の音を生成しているため、
音源の権利上の問題はありません。外部ライブラリも使っていません。

## 開発

```sh
npm test    # node:test でユニットテストを実行
npm start   # http://localhost:8000 でローカルサーバーを起動（python3 を使用）
```

ES Modules を使うため、`index.html` をファイルとして直接開くのではなく、ローカルサーバー経由で開いてください。

### ファイル構成

| ファイル | 役割 |
| --- | --- |
| `src/notes.js` | 音名・周波数・鍵盤レイアウトの計算 |
| `src/keymap.js` | PC キーと鍵盤の対応付け、割当のシフト |
| `src/synth.js` | Web Audio による音合成 |
| `src/keyboard-ui.js` | 鍵盤の描画とタッチ / マウス入力 |
| `src/input.js` | PC キーボード入力 |
| `src/press-tracker.js` | 複数の入力元からの押下の管理 |
| `src/roll.js` / `src/roll-view.js` | ピアノロール風の棒エフェクト（状態 / 描画） |
| `src/settings.js` | 設定の検証と保存 |

## GitHub Pages で公開する

1. GitHub にリポジトリを作成して push する
2. リポジトリの Settings → Pages → Build and deployment で、Source を「Deploy from a branch」、
   Branch を `main` / `/ (root)` にして保存する

ビルド手順はないので、これだけで公開されます。

## ライセンス

[MIT](LICENSE)
