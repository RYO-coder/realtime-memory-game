import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase設定
// 注意: 実際のプロジェクトでは環境変数を使用してください
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Storageの初期化
// バケット名がgs://で始まる場合は削除、そうでない場合はそのまま使用
let storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
if (!storageBucket || storageBucket === "your-storage-bucket") {
  console.warn('Firebase Storage Bucketが設定されていません');
  storageBucket = "";
}

// gs://プレフィックスを削除
const bucketName = storageBucket.replace(/^gs:\/\//, '').trim();

// Storageを初期化
let storage;
try {
  if (bucketName && bucketName !== '') {
    // バケット名が既にgs://で始まっている場合はそのまま、そうでない場合は追加
    const fullBucketName = bucketName.startsWith('gs://') 
      ? bucketName 
      : `gs://${bucketName}`;
    storage = getStorage(app, fullBucketName);
  } else {
    // バケット名が指定されていない場合は、デフォルトのバケットを使用
    storage = getStorage(app);
  }
} catch (error) {
  console.error('Firebase Storage初期化エラー:', error);
  // エラーが発生した場合も、デフォルトのStorageを試す
  try {
    storage = getStorage(app);
  } catch (fallbackError) {
    console.error('Firebase Storage初期化（フォールバック）エラー:', fallbackError);
    throw fallbackError;
  }
}

export { storage };
export const auth = getAuth(app);

// デバッグ用：設定の確認（ブラウザ環境のみ）
if (typeof window !== 'undefined') {
  console.log('Firebase設定確認:', {
    projectId: firebaseConfig.projectId,
    storageBucket: bucketName || 'デフォルト',
    hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-api-key',
    hasStorageBucket: !!bucketName && bucketName !== '',
    storageInitialized: !!storage
  });
}

export default app;

