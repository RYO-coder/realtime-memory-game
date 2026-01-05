# 画像アップロード問題のトラブルシューティング

## 確認事項

### 1. Firebase Storageが有効になっているか

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Storage」をクリック
4. Storageが有効になっているか確認（有効でない場合は「始める」をクリック）

### 2. Storageセキュリティルールの確認

Firebase Consoleの「Storage」→「ルール」タブで、以下のルールが設定されているか確認してください：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // ルーム内の画像へのアクセスを許可
    match /rooms/{roomId}/{userId}/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**重要**: ルールを変更したら「公開」ボタンをクリックしてください。

### 3. 環境変数の確認

Vercelの環境変数で、以下の値が正しく設定されているか確認：

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` の値は、`gs://` を含まない形式で設定
  - 正しい例: `game-1f2ac.firebasestorage.app`
  - 間違い: `gs://game-1f2ac.firebasestorage.app`

### 4. ブラウザのコンソールでエラーを確認

1. ブラウザの開発者ツールを開く（F12）
2. 「Console」タブを開く
3. 画像をアップロードしようとしたときのエラーメッセージを確認
4. エラーメッセージの内容を確認

### 5. よくあるエラーと解決方法

#### `storage/unauthorized`
- **原因**: Storageのセキュリティルールで書き込みが許可されていない
- **解決方法**: 上記のセキュリティルールを設定して「公開」をクリック

#### `storage/quota-exceeded`
- **原因**: Firebase Storageの無料枠を超えている
- **解決方法**: Firebase Consoleでストレージの使用量を確認

#### `storage/unauthenticated`
- **原因**: 認証が必要だが、認証されていない
- **解決方法**: セキュリティルールを確認（現在のルールでは認証不要のはず）

#### `storage/unknown`
- **原因**: 不明なエラー
- **解決方法**: ブラウザのコンソールで詳細なエラー情報を確認

### 6. デバッグ方法

ブラウザのコンソールで以下の情報が表示されます：

```
Firebase設定確認: {
  projectId: "...",
  storageBucket: "...",
  hasApiKey: true/false,
  hasStorageBucket: true/false,
  storageInitialized: true/false
}
```

`storageInitialized`が`false`の場合は、Storageの初期化に問題があります。

### 7. 手動テスト

Firebase Consoleの「Storage」→「ファイル」タブで、手動でファイルをアップロードできるか確認してください。

もし手動でもアップロードできない場合は、Storageの設定に問題がある可能性があります。

