# ねこ背検知

[English](README.en.md)

WebカメラとMediaPipe Pose Landmarkerを使い、頭の高さの変化から猫背を検知するWebアプリです。MediaPipe Gesture Recognizerによるジェスチャー操作にも対応しています。

カメラ映像と姿勢ランドマークは端末内で処理され、サーバーには送信しません。

## 利用者向け

### 使い方

1. カメラを、顔と肩が正面から映る距離・目線に近い高さに置きます。
2. カメラを起動し、良い姿勢を3秒間記録します。
3. 続けて、猫背の姿勢を3秒間記録します。
4. 設定した感度以上の猫背が一定時間続くと通知されます。

判定を安定させるため、極端に見下ろす・見上げる画角は避けてください。

カメラの前で次のジェスチャーを保持すると、画面に認識状況が表示されて操作できます。一度操作した後は、手を下ろしてから次のジェスチャーを行ってください。

- 両手でT字を作る: 一時停止
- ピースサイン: 一時停止から再開
- 片手のパーを見せる: カメラと検知を停止
- 胸の前で両手を合わせる: 再調整
- 口元に人差し指を当てる: ミュート
- サムズアップ: ミュート解除

誤操作を防ぐため、停止のパーは約1.5秒、それ以外は約1秒保持すると実行されます。
ジェスチャーを認識し始めた時と、保持が完了して操作が実行された時には、それぞれ短い電子音が鳴ります。停止時だけは、シャットダウンを表す下降音が鳴ります。音量とミュート設定は通知音と共通です。

### 判定の仕組み

キャリブレーションで記録した「良い姿勢」と「猫背」の頭の高さを基準に、現在の鼻のY座標が猫背側へどの程度近づいたかをスコア化します。通知後も猫背が続く場合は、12秒の間隔を空けて再通知します。姿勢が回復すると、このクールダウンは解除されます。

## 開発者向け

### 必要なもの

- Node.js
- npm
- LAN内の別端末からHTTPSで確認する場合のみ `mkcert`

### 開発サーバーを起動する

```bash
npm install
npm run dev
```

`http://localhost:5187` をブラウザで開きます。

### LAN内の端末からHTTPSで確認する

スマートフォンなど、同一LAN内の別端末のブラウザでカメラを使うにはHTTPSでアクセスする必要があります。初回のみ `mkcert` をセットアップします。

```bash
brew install mkcert
mkcert -install
npm run dev:https
```

起動ログに表示される `https://<IPアドレス>:5187` を端末側で開きます。IPアドレスが変わった場合は、次回起動時に `.cert` の開発用証明書が作り直されます。

### テスト・ビルド・プレビュー

```bash
npm test
npm run build
npm run preview
```

プレビューは `http://localhost:5188` で起動します。同一LAN内の別端末からアクセスする場合は `npm run preview:https` を使います。

生成された `dist/index.html` をブラウザで直接開いても、ブラウザのセキュリティ制約によりカメラを利用できません。カメラを使う場合は、開発サーバーまたはプレビューサーバーを起動してください。

## デプロイ

アプリをCloudflare Pagesで公開するため、GitHub ActionsでCloudflare Workersにデプロイします。

| 環境 | Worker名 | 自動デプロイが実行される条件 | 公開範囲 |
| --- | --- | --- | --- |
| 開発環境 | `nekozekenchi-dev` | `main` ブランチが更新されたら | Cloudflare Accessで認証された人のみ |
| 本番環境 | `nekozekenchi` | `v*` タグがpushされたら | 誰でも |

リポジトリに次のSecretsを設定する必要があります。

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

開発環境を非公開にするため、Cloudflare Zero Trustで `nekozekenchi-dev` のホスト名を対象とするAccess ApplicationとAllowポリシーを作成します。

### 手動デプロイ

開発環境へデプロイする場合：

```bash
npm run build
npm run deploy:dev
```

本番環境へデプロイする場合：

```bash
npm run build
npm run deploy:prod
```

`deploy:prod` は、現在のコミットに `package.json` のバージョンと一致する `v*` タグが付いている場合だけデプロイします。タグがなければ正常終了してスキップし、タグとバージョンが一致しなければ失敗します。

実際に配信状態を更新する必要があるため、デプロイにはバージョンのアップロードだけを行う `wrangler versions upload` ではなく `wrangler deploy` を使用しています。

## リリース

`main` ブランチが保護されている（PR経由でのみ更新可能）前提です。

### リリースの流れ

1. リリースブランチで `package.json` と `package-lock.json` のバージョンを更新します。
2. リリースブランチを push し、PRを作成します。
3. PRを `main` にマージします。この時点で開発環境に自動デプロイされます。
4. 開発環境で動作確認をします。
5. マージ後の `main` のコミットに、バージョンと一致する `v*` タグを付けてpushします。
6. タグのpushを契機に、本番環境へ自動デプロイされます。

### 1. リリースブランチを準備する

通常は次のコマンドを使います。 `release/v1.0.2` のようなブランチの作成、コミット、pushまでを自動実行します。

```bash
npm run pre-release
```

デフォルトではpatchバージョンが更新されます。minorまたはmajorバージョンを更新する場合：

```bash
npm run pre-release -- minor
npm run pre-release -- major
```

変更せずに次のバージョンとブランチ名だけを確認する場合：

```bash
npm run pre-release -- --dry-run
```

`pre-release` は PRの作成、PRのマージ、タグの作成は行いません。push後にリリースPRを作成し、 `main` へマージしてください。

#### 手動で準備する場合

次のバージョンが `1.0.2` の例です。

```bash
git switch -c release/v1.0.2 origin/main
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.2"
git push origin release/v1.0.2
```

minorまたはmajorバージョンでは、 `patch` を `minor` または `major` に置き換えます。

### 2. マージ後のコミットをタグ付けする

リリースPRをマージしたら、`main` を最新にしてタグを作成します。タグは `package.json` のバージョンと一致させてください。

```bash
git switch main
git pull --ff-only origin main
git tag v1.0.2
git push origin v1.0.2
```

タグをpushするとGitHub Actionsが本番デプロイを開始します。タグ名と `package.json` のバージョンが一致しない場合、本番デプロイは拒否されます。

## ライセンス

このプロジェクトはMIT Licenseです。また、以下の第三者リソースを使用しています。詳細は `public/THIRD_PARTY_NOTICES.txt` を参照してください。

- 同梱しているMediaPipe Tasks VisionのWASMファイルとPose Landmarker LiteモデルはApache License 2.0で提供されています。
- 同梱している通知音の一部（猫の鳴き声）は [ポケットサウンド](https://pocket-se.info/) の効果音素材です。利用規約に基づき、アプリ内と第三者ライセンス表記にクレジットリンクを掲載しています。
- UIの一部は、 [デジタル庁デザインシステム](https://design.digital.go.jp/dads/) のHTMLコードスニペットを参考に実装しています。コードスニペットはMIT Licenseで提供されています。
