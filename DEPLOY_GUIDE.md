# Vercelデプロイ手順ガイド

## 📋 事前準備

### 1. Gitの設定（初回のみ）

ターミナルで以下のコマンドを実行してください（メールアドレスと名前を自分のものに変更）：

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

### 2. GitHubアカウントの準備

- [GitHub](https://github.com) にアクセスしてアカウントを作成（まだの場合）
- ログインしておく

---

## 🚀 デプロイ手順

### ステップ1: GitHubリポジトリを作成

1. [GitHub](https://github.com) にログイン
2. 右上の「+」ボタンをクリック → 「New repository」を選択
3. リポジトリ名を入力（例: `realtime-memory-game`）
4. **「Public」を選択**（Vercelの無料プランではPublicリポジトリが必要）
5. 「Add a README file」は**チェックを外す**（既にREADMEがあるため）
6. 「Create repository」をクリック

### ステップ2: プロジェクトをGitHubにプッシュ

ターミナルで以下のコマンドを実行してください（`YOUR_USERNAME`と`YOUR_REPO_NAME`を実際の値に置き換えてください）：

```bash
# Gitの設定（まだの場合）
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# ファイルをコミット
git add .
git commit -m "Initial commit: Real-time memory game"

# GitHubリポジトリを追加（GitHubで作成したリポジトリのURLを使用）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ブランチ名をmainに変更
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

**注意**: GitHubでリポジトリを作成すると、URLが表示されます。そのURLをコピーして使用してください。

### ステップ3: Vercelでプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「Add New Project」ボタンをクリック
3. 「Import Git Repository」セクションで、先ほど作成したGitHubリポジトリを選択
4. 「Import」をクリック

### ステップ4: プロジェクト設定

1. **Project Name**: プロジェクト名を入力（そのままでOK）
2. **Framework Preset**: 「Next.js」が自動選択されていることを確認
3. **Root Directory**: そのまま（`./`）
4. **Build and Output Settings**: そのまま（デフォルト設定でOK）

### ステップ5: 環境変数の設定（重要！）

「Environment Variables」セクションで、以下の環境変数を追加してください：

1. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - Value: `.env.local`ファイルの値をコピー

2. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Value: `.env.local`ファイルの値をコピー

3. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Value: `.env.local`ファイルの値をコピー

4. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Value: `.env.local`ファイルの値をコピー

5. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Value: `.env.local`ファイルの値をコピー

6. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - Value: `.env.local`ファイルの値をコピー

7. **NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
   - Value: `.env.local`ファイルの値をコピー

**各環境変数の追加方法**:
- 「Name」に変数名を入力
- 「Value」に値を入力
- 「Environment」で「Production」「Preview」「Development」すべてにチェック
- 「Add」をクリック

### ステップ6: デプロイ

1. 環境変数をすべて追加したら、「Deploy」ボタンをクリック
2. デプロイが完了するまで待ちます（1-3分程度）
3. デプロイが完了すると、URLが表示されます（例: `https://your-project.vercel.app`）

### ステップ7: 動作確認

1. 表示されたURLをクリックしてサイトにアクセス
2. ホーム画面が表示されることを確認
3. ルームを作成して動作を確認

---

## 🔧 トラブルシューティング

### デプロイが失敗する場合

1. **環境変数が正しく設定されているか確認**
   - Vercelダッシュボードの「Settings」→「Environment Variables」で確認

2. **ビルドログを確認**
   - Vercelダッシュボードの「Deployments」タブで、失敗したデプロイをクリック
   - 「Build Logs」を確認してエラーを確認

3. **Firebase設定を確認**
   - Firebase Consoleで、FirestoreとStorageが有効になっているか確認
   - セキュリティルールが正しく設定されているか確認

### 環境変数を後から追加/変更する場合

1. Vercelダッシュボードの「Settings」→「Environment Variables」に移動
2. 変数を追加または編集
3. 「Redeploy」をクリックして再デプロイ

---

## 📝 補足情報

- **カスタムドメイン**: Vercelダッシュボードの「Settings」→「Domains」でカスタムドメインを設定できます
- **自動デプロイ**: GitHubにプッシュするたびに自動的にデプロイされます
- **プレビュー**: プルリクエストを作成すると、プレビューURLが自動生成されます

---

## 🎉 完了！

これで、誰でもアクセスできるWebアプリケーションが公開されました！

公開URLを友達にシェアして、一緒に神経衰弱ゲームを楽しんでください！

