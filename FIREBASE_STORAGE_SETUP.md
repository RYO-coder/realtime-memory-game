# Firebase Storage セットアップガイド

## 画像アップロードができない場合の確認事項

### 1. Firebase Storageが有効になっているか確認

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Storage」をクリック
4. 「始める」ボタンをクリックしてStorageを有効化（まだの場合）

### 2. Storageセキュリティルールの設定

Firebase Consoleの「Storage」→「ルール」タブで、以下のルールを設定してください：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // ルーム内の画像へのアクセスを許可
    match /rooms/{roomId}/{userId}/{allPaths=**} {
      allow read, write: if true;
    }
    
    // または、より厳密なルール（推奨）
    match /rooms/{roomId}/{userId}/{imageId} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024 // 5MB以下
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

**重要**: ルールを変更したら「公開」ボタンをクリックしてください。

### 3. 環境変数の確認

Vercelの環境変数で、以下の値が正しく設定されているか確認してください：

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` の値は、`gs://` を含まない形式で設定してください
  - 例: `game-1f2ac.firebasestorage.app` （正しい）
  - 例: `gs://game-1f2ac.firebasestorage.app` （間違い）

### 4. ブラウザのコンソールでエラーを確認

1. ブラウザの開発者ツールを開く（F12）
2. 「Console」タブを開く
3. 画像をアップロードしようとしたときのエラーメッセージを確認
4. エラーメッセージをコピーして、問題の特定に使用してください

### 5. よくあるエラーと解決方法

#### `storage/unauthorized`
- **原因**: Storageのセキュリティルールが正しく設定されていない
- **解決**: 上記のセキュリティルールを設定し、「公開」をクリック

#### `storage/quota-exceeded`
- **原因**: Firebase Storageの無料枠を超えている
- **解決**: Firebase Consoleで使用量を確認し、必要に応じてプランをアップグレード

#### `storage/unauthenticated`
- **原因**: Firebase認証が必要だが設定されていない
- **解決**: セキュリティルールを `allow read, write: if true;` に変更（開発用）

#### `storage/unknown`
- **原因**: Storageが有効になっていない、またはバケット名が間違っている
- **解決**: 
  1. Firebase ConsoleでStorageが有効になっているか確認
  2. 環境変数の `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` が正しいか確認

### 6. モバイルでの問題

モバイルで画像がアップロードできない場合：

1. **ファイル形式**: モバイルカメラで撮影した画像は通常問題ありませんが、一部の形式（HEICなど）は対応していない可能性があります
2. **ファイルサイズ**: 5MB以下の画像のみアップロード可能です
3. **権限**: モバイルブラウザでカメラ/ファイルへのアクセス許可が必要な場合があります

### 7. デバッグ方法

コードには詳細なログが追加されています。ブラウザのコンソールで以下の情報を確認できます：

- アップロード開始時のログ
- 各ファイルのアップロード進捗
- エラーの詳細情報

これらの情報を確認して、問題の原因を特定してください。

