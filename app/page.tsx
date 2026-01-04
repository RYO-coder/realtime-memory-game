'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomCode.trim() && playerName.trim()) {
      router.push(`/room/${roomCode}?name=${encodeURIComponent(playerName)}`);
    }
  };

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/room/${newRoomCode}?name=${encodeURIComponent(playerName)}&host=true`);
    }
  };

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeCard}>
        <h1 className={styles.title}>🎮 リアルタイム神経衰弱</h1>
        <p className={styles.subtitle}>友達と一緒に楽しむ神経衰弱ゲーム</p>

        <div className={styles.formGroup}>
          <label className={styles.label}>プレイヤー名</label>
          <input
            type="text"
            className={styles.input}
            placeholder="あなたの名前を入力"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>あいことば（ルームコード）</label>
          <input
            type="text"
            className={styles.input}
            placeholder="ルームコードを入力"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={10}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={styles.btnPrimary}
            onClick={handleJoinRoom}
            disabled={!roomCode.trim() || !playerName.trim()}
          >
            ルームに参加
          </button>
          <button
            className={styles.btnSecondary}
            onClick={handleCreateRoom}
            disabled={!playerName.trim()}
          >
            新しいルームを作成
          </button>
        </div>
      </div>
    </div>
  );
}

