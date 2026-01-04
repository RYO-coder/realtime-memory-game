# リアルタイム神経衰弱ゲーム

友達と一緒に楽しむリアルタイム対戦型神経衰弱ゲームです。

## 機能

- 🔗 あいことば（ルームコード）でルームに参加
- 👥 2-4人でのリアルタイム対戦
- 🖼️ 各プレイヤーが自分の画像をアップロード（5-15枚、デフォルト7枚）
- ⚙️ ゲーム開始前に画像枚数を設定可能
- 🔄 Firebaseによるリアルタイム同期
- 🎮 美しいモダンなUI

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Firestore Databaseを有効化（テストモードで開始）
3. Storageを有効化
4. `.env.local`ファイルを作成し、以下の環境変数を設定：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Firestoreセキュリティルール

Firestoreのセキュリティルールを以下のように設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true; // 開発用。本番環境では適切な認証を設定してください
    }
  }
}
```

### 4. Storageセキュリティルール

Storageのセキュリティルールを以下のように設定：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /rooms/{roomId}/{userId}/{imageId} {
      allow read, write: if true; // 開発用。本番環境では適切な認証を設定してください
    }
  }
}
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

1. ホーム画面でプレイヤー名を入力
2. 「新しいルームを作成」をクリックしてルームコードを取得、または既存のルームコードを入力して「ルームに参加」
3. ルーム内で画像をアップロード（最低5枚、最高15枚）
4. ホストが画像枚数を設定（5-15枚の範囲）
5. 全員が準備完了したら、ホストが「ゲーム開始」をクリック
6. カードをクリックして神経衰弱を楽しむ！

## 技術スタック

- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Firebase Firestore** - リアルタイムデータベース
- **Firebase Storage** - 画像ストレージ
- **CSS Modules** - スタイリング

## ライセンス

MIT

