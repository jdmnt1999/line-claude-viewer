# LINE Claude Viewer セットアップガイド（r1）

## 概要

本ドキュメントでは、LINE Claude Viewerのセットアップ方法とデプロイ手順について説明します。このアプリケーションは純粋なHTML、CSS、JavaScriptで実装されており、外部ライブラリを必要としません。

## 要件

- Webブラウザ (Chrome, Firefox, Edge, Safariの最新版を推奨)
- ローカルWebサーバー (任意)
- Claude API Key (Anthropicから取得)

## インストール方法

### 方法1: GitHubからのクローン（推奨）

1. Gitがインストールされていることを確認します。
2. 以下のコマンドを実行してリポジトリをクローンします。

```bash
git clone https://github.com/jdmnt1999/line-claude-viewer.git
cd line-claude-viewer
```

### 方法2: ZIPファイルのダウンロード

1. GitHubリポジトリ（https://github.com/jdmnt1999/line-claude-viewer）にアクセスします。
2. 「Code」ボタンをクリックし、「Download ZIP」を選択します。
3. ダウンロードしたZIPファイルを任意の場所に解凍します。

## ローカルでの起動方法

### 方法1: Visual Studio Codeの場合

1. Visual Studio Codeをインストールします。
2. 「Live Server」拡張機能をインストールします。
3. プロジェクトフォルダをVSCodeで開きます。
4. index.htmlを右クリックし、「Open with Live Server」を選択します。

### 方法2: Pythonの場合

1. Pythonがインストールされていることを確認します。
2. プロジェクトフォルダに移動し、ターミナルで以下のコマンドを実行します。

```bash
# Python 3の場合
python -m http.server

# Python 2の場合
python -m SimpleHTTPServer
```

3. ブラウザで `http://localhost:8000` にアクセスします。

### 方法3: Node.jsの場合

1. Node.jsがインストールされていることを確認します。
2. 以下のコマンドでhttp-serverをインストールします。

```bash
npm install -g http-server
```

3. プロジェクトフォルダに移動し、以下のコマンドを実行します。

```bash
http-server -o
```

## API設定

アプリケーションを起動したら、Claude APIを使用するために以下の設定が必要です。

1. APIキーの取得:
   - Anthropicのウェブサイトからアカウントを作成します
   - Claude APIキーを取得します

2. アプリケーション内での設定:
   - サイドバーの「API Integration」セクションを見つけます
   - 「API Key」欄にあなたのAPIキーを入力します
   - 使用したいモデルを「Model」ドロップダウンから選択します
   - 「Save Settings」ボタンをクリックします

## カスタマイズ

### テーマの変更

デフォルトではライトモードで起動しますが、画面右上の月アイコンをクリックすることでダークモードに切り替えることができます。

### データのバックアップ

会話データは以下の方法でバックアップできます：

1. 会話を表示した状態で、「Export Conversation」機能を使用します
2. エクスポートされたJSONファイルを安全な場所に保存します

## トラブルシューティング

### エラー: APIキーが無効です

1. APIキーが正しく入力されているか確認します
2. APIキーが有効であることを確認します（Anthropicのダッシュボードで確認）
3. インターネット接続を確認します

### エラー: ファイルの読み込みに失敗しました

1. ファイルの形式がJSONであることを確認します
2. ファイルが破損していないか確認します
3. 特殊文字やパスを含む場合は、ファイル名やパスを変更してみてください

### エラー: データベースにアクセスできません

1. ブラウザが最新版であることを確認します
2. ブラウザのCookieとローカルストレージを有効にします
3. プライベートブラウジングモードを使用している場合は、通常モードで試してください

## アップグレード手順

新しいバージョンがリリースされた場合は、以下の手順でアップグレードしてください。

1. GitHubリポジトリから最新のコードを取得します。
```bash
git pull origin main
```

2. ローカルの変更がある場合は、以下のコマンドで変更を保存します。
```bash
git stash
git pull origin main
git stash pop
```

3. 競合がある場合は手動で解決してください。

## デプロイ方法

このアプリケーションはクライアントサイドのみで動作するため、以下のようなさまざまな方法でデプロイできます。

### GitHub Pages

1. GitHubリポジトリを自分のアカウントにフォークします
2. リポジトリ設定でGitHub Pagesを有効にします
3. ブランチとフォルダを選択して保存します

### Netlify/Vercel

1. Netlify/Vercelアカウントを作成します
2. リポジトリを連携します
3. デプロイ設定を行い、デプロイボタンをクリックします

### 自前のWebサーバー

1. プロジェクトファイルをWebサーバーのルートディレクトリにコピーします
2. 適切なパーミッションを設定します
3. Webサーバーを再起動します

## リポジトリ情報

- リポジトリURL: https://github.com/jdmnt1999/line-claude-viewer
- 作業パス: E:/Desktop/ClaudeCode/claude-line
- デプロイパス: ローカルウェブサーバー環境（任意）

---

更新日: 2025年5月6日
作成者: 開発チーム

※注意: APIキーは他者と共有しないでください。セキュリティ上のリスクがあります。
