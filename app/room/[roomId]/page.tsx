'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Card, createCardPairs, checkMatch, isGameFinished } from '@/lib/gameLogic';
import styles from './page.module.css';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const playerName = searchParams.get('name') || 'プレイヤー';
  const isHost = searchParams.get('host') === 'true';

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const newPlayerId = uuidv4();
    setPlayerId(newPlayerId);

    const roomRef = doc(db, 'rooms', roomId);

    // ルームの初期化とプレイヤー追加を順次実行
    const initializeRoom = async () => {
      try {
        // ルームが存在しない場合は作成
        const docSnap = await getDoc(roomRef);
        if (!docSnap.exists()) {
          const initialState: GameState = {
            roomId,
            players: [],
            cards: [],
            currentPlayerIndex: 0,
            flippedCards: [],
            gameStatus: 'waiting',
            settings: {
              imagesPerPlayer: 7,
              maxPlayers: 4,
            },
          };
          await setDoc(roomRef, initialState);
        }

        // プレイヤーを追加
        const currentData = (await getDoc(roomRef)).data() as GameState;
        if (currentData && !currentData.players.find(p => p.id === newPlayerId)) {
          if (currentData.players.length < currentData.settings.maxPlayers) {
            const newPlayer: Player = {
              id: newPlayerId,
              name: playerName,
              score: 0,
              images: [],
            };
            await updateDoc(roomRef, {
              players: arrayUnion(newPlayer),
            });
          }
        }
      } catch (error) {
        console.error('ルーム初期化エラー:', error);
      }
    };

    initializeRoom();

    // リアルタイムリスナー
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState;
        setGameState(data);
      }
    }, (error) => {
      console.error('リアルタイムリスナーエラー:', error);
    });

    return () => {
      unsubscribe();
      // プレイヤーを削除
      const removePlayer = async () => {
        try {
          const docSnap = await getDoc(roomRef);
          if (docSnap.exists()) {
            const currentData = docSnap.data() as GameState;
            const updatedPlayers = currentData.players.filter((p: Player) => p.id !== newPlayerId);
            await updateDoc(roomRef, { players: updatedPlayers });
          }
        } catch (error) {
          console.error('プレイヤー削除エラー:', error);
        }
      };
      removePlayer();
    };
  }, [roomId, playerName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentPlayer = gameState?.players.find(p => p.id === playerId);
      const currentImageCount = currentPlayer?.images.length || 0;
      const maxImages = gameState?.settings.imagesPerPlayer || 7;
      const remainingSlots = maxImages - currentImageCount;

      if (files.length > remainingSlots) {
        alert(`最大${maxImages}枚までアップロードできます。残り${remainingSlots}枚です。`);
        return;
      }

      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !gameState || !playerId) {
      console.error('アップロード準備エラー:', { 
        selectedFiles: selectedFiles.length, 
        gameState: !!gameState, 
        playerId 
      });
      alert('アップロードの準備ができていません。しばらく待ってから再度お試しください。');
      return;
    }

    // Storageの確認
    if (!storage) {
      console.error('Storageが初期化されていません');
      alert('ストレージの初期化に失敗しました。ページをリロードしてください。');
      return;
    }

    // Storageが正しく初期化されているか確認
    try {
      // テスト用の参照を作成して確認
      const testRef = ref(storage, 'test');
      if (!testRef) {
        throw new Error('Storage参照の作成に失敗しました');
      }
    } catch (error: any) {
      console.error('Storage検証エラー:', error);
      alert(`ストレージの検証に失敗しました: ${error.message || '不明なエラー'}`);
      return;
    }

    setUploading(true);
    const roomRef = doc(db, 'rooms', roomId);

    try {
      console.log('アップロード開始:', { 
        files: selectedFiles.length, 
        roomId, 
        playerId 
      });

      // ファイルサイズと形式をチェック
      const maxSize = 5 * 1024 * 1024; // 5MB
      const invalidFiles = selectedFiles.filter(file => {
        const isValid = file.size <= maxSize && file.type.startsWith('image/');
        if (!isValid) {
          console.warn('無効なファイル:', {
            name: file.name,
            size: file.size,
            type: file.type
          });
        }
        return !isValid;
      });

      if (invalidFiles.length > 0) {
        alert('画像ファイルのみアップロードでき、ファイルサイズは5MB以下である必要があります。');
        setUploading(false);
        return;
      }

      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          console.log(`ファイル ${index + 1}/${selectedFiles.length} をアップロード中:`, {
            name: file.name,
            size: file.size,
            type: file.type
          });
          
          const imageId = uuidv4();
          // ファイル拡張子を安全に取得
          const fileNameParts = file.name.split('.');
          const fileExtension = fileNameParts.length > 1 
            ? fileNameParts.pop()?.toLowerCase() || 'jpg'
            : 'jpg';
          
          // 有効な拡張子かチェック
          const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
          const safeExtension = validExtensions.includes(fileExtension) ? fileExtension : 'jpg';
          
          const storagePath = `rooms/${roomId}/${playerId}/${imageId}.${safeExtension}`;
          console.log('Storageパス:', storagePath);
          
          const imageRef = ref(storage, storagePath);
          console.log('Storage参照作成完了:', imageRef);
          
          // メタデータを設定
          const metadata = {
            contentType: file.type || 'image/jpeg',
            customMetadata: {
              originalName: file.name,
              uploadedBy: playerId,
              roomId: roomId
            }
          };
          
          console.log('アップロード開始...');
          await uploadBytes(imageRef, file, metadata);
          console.log('アップロード完了:', file.name);
          
          const downloadURL = await getDownloadURL(imageRef);
          console.log('ダウンロードURL取得完了:', downloadURL);
          return downloadURL;
        } catch (error: any) {
          console.error('個別ファイルアップロードエラー:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: error,
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse,
            stack: error.stack
          });
          
          // エラーメッセージを詳細化
          let errorMessage = 'アップロードに失敗しました';
          if (error.code === 'storage/unauthorized') {
            errorMessage = 'アップロード権限がありません。Firebase Storageのセキュリティルールを確認してください。';
          } else if (error.code === 'storage/quota-exceeded') {
            errorMessage = 'ストレージの容量が不足しています。';
          } else if (error.code === 'storage/unauthenticated') {
            errorMessage = '認証が必要です。';
          } else if (error.code === 'storage/canceled') {
            errorMessage = 'アップロードがキャンセルされました。';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          throw new Error(`${file.name}: ${errorMessage}`);
        }
      });

      const urls = await Promise.all(uploadPromises);
      console.log('すべてのファイルのアップロード完了:', urls);
      
      // 最新のゲーム状態を取得
      const currentDoc = await getDoc(roomRef);
      if (!currentDoc.exists()) {
        throw new Error('ルームが見つかりません');
      }

      const currentGameState = currentDoc.data() as GameState;
      const currentPlayer = currentGameState.players.find(p => p.id === playerId);
      
      if (!currentPlayer) {
        throw new Error('プレイヤーが見つかりません');
      }

      const updatedImages = [...currentPlayer.images, ...urls];
      const updatedPlayers = currentGameState.players.map(p =>
        p.id === playerId ? { ...p, images: updatedImages } : p
      );

      console.log('プレイヤー情報を更新中...');
      await updateDoc(roomRef, { players: updatedPlayers });
      console.log('プレイヤー情報更新完了');
      
      setSelectedFiles([]);
      
      // ファイル入力欄をリセット
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      alert(`${selectedFiles.length}枚の画像をアップロードしました！`);
    } catch (error: any) {
      console.error('アップロードエラー詳細:', {
        error,
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = '画像のアップロードに失敗しました';
      
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = 'アップロード権限がありません。Firebase Storageのセキュリティルールを確認してください。';
            break;
          case 'storage/quota-exceeded':
            errorMessage = 'ストレージの容量が不足しています。';
            break;
          case 'storage/unauthenticated':
            errorMessage = '認証が必要です。ページをリロードしてください。';
            break;
          case 'storage/canceled':
            errorMessage = 'アップロードがキャンセルされました。';
            break;
          case 'storage/unknown':
            errorMessage = '不明なエラーが発生しました。Firebase Storageの設定を確認してください。';
            break;
          default:
            errorMessage = `エラーコード: ${error.code}\nメッセージ: ${error.message || '不明なエラー'}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameState || !isHost) return;

    const allPlayersReady = gameState.players.every(
      p => p.images.length >= 5 && p.images.length <= 15
    );

    if (!allPlayersReady) {
      alert('すべてのプレイヤーが5-15枚の画像をアップロードする必要があります');
      return;
    }

    if (gameState.players.length < 2) {
      alert('最低2人のプレイヤーが必要です');
      return;
    }

    const cards = createCardPairs(gameState.players, gameState.settings.imagesPerPlayer);
    const roomRef = doc(db, 'rooms', roomId);

    await updateDoc(roomRef, {
      cards,
      gameStatus: 'playing',
      currentPlayerIndex: 0,
      flippedCards: [],
    });
  };

  const handleCardClick = async (cardId: string) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const card = gameState.cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    if (gameState.flippedCards.length >= 2) return;

    const roomRef = doc(db, 'rooms', roomId);
    const newFlippedCards = [...gameState.flippedCards, cardId];
    const updatedCards = gameState.cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );

    await updateDoc(roomRef, {
      cards: updatedCards,
      flippedCards: newFlippedCards,
    });

    // 2枚めくったらマッチ判定
    if (newFlippedCards.length === 2) {
      setTimeout(async () => {
        const isMatch = checkMatch(updatedCards, newFlippedCards);
        const finalCards = updatedCards.map(c => {
          if (newFlippedCards.includes(c.id)) {
            return { ...c, isFlipped: false, isMatched: isMatch };
          }
          return c;
        });

        if (isMatch) {
          const updatedPlayers = gameState.players.map(p =>
            p.id === currentPlayer.id ? { ...p, score: p.score + 1 } : p
          );

          await updateDoc(roomRef, {
            cards: finalCards,
            players: updatedPlayers,
            flippedCards: [],
          });

          // ゲーム終了判定
          if (isGameFinished(finalCards)) {
            const winner = updatedPlayers.reduce((prev, curr) =>
              curr.score > prev.score ? curr : prev
            );
            await updateDoc(roomRef, {
              gameStatus: 'finished',
              winner: winner.id,
            });
          }
        } else {
          const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
          await updateDoc(roomRef, {
            cards: finalCards,
            flippedCards: [],
            currentPlayerIndex: nextPlayerIndex,
          });
        }
      }, 1500);
    }
  };

  const handleChangeSettings = async (imagesPerPlayer: number) => {
    if (!gameState || !isHost || gameState.gameStatus !== 'waiting') return;
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      'settings.imagesPerPlayer': imagesPerPlayer,
    });
  };

  if (!gameState) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.gameStatus === 'playing' &&
    gameState.players[gameState.currentPlayerIndex]?.id === playerId;

  // プレイヤーがまだ追加されていない場合
  if (!currentPlayer && playerId) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>ルームに参加中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>ルーム: {roomId}</h1>
          <button
            className={styles.shareBtn}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setShowShareModal(true);
              setTimeout(() => setShowShareModal(false), 2000);
            }}
          >
            📋 リンクをコピー
          </button>
          {showShareModal && (
            <div className={styles.shareModal}>リンクをコピーしました！</div>
          )}
        </div>
        <button className={styles.btn} onClick={() => router.push('/')}>
          退出
        </button>
      </div>

      {gameState.gameStatus === 'waiting' && (
        <div className={styles.setupSection}>
          <div className={styles.contentCard}>
            <h2>ゲーム設定</h2>
            {isHost && (
              <div className={styles.settings}>
                <label>各プレイヤーの画像枚数: {gameState.settings.imagesPerPlayer}枚</label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={gameState.settings.imagesPerPlayer}
                  onChange={(e) => handleChangeSettings(Number(e.target.value))}
                />
              </div>
            )}
            {!isHost && (
              <p>各プレイヤーの画像枚数: {gameState.settings.imagesPerPlayer}枚</p>
            )}

            <div className={styles.playersList}>
              <h3>プレイヤー ({gameState.players.length}/{gameState.settings.maxPlayers})</h3>
              {gameState.players.map((player) => (
                <div key={player.id} className={styles.playerItem}>
                  <span>{player.name} {player.id === playerId && '(あなた)'}</span>
                  <span>
                    {player.images.length}/{gameState.settings.imagesPerPlayer}枚
                    {player.images.length >= 5 && player.images.length <= 15 && ' ✓'}
                  </span>
                </div>
              ))}
            </div>

            {currentPlayer && (
              <div className={styles.uploadSection}>
                <h3>画像をアップロード</h3>
                <p>
                  残り: {gameState.settings.imagesPerPlayer - currentPlayer.images.length}枚
                  (最低5枚、最高15枚)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading || !playerId || currentPlayer.images.length >= gameState.settings.imagesPerPlayer}
                />
                {selectedFiles.length > 0 && (
                  <button
                    className={styles.btn}
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'アップロード中...' : 'アップロード'}
                  </button>
                )}

                {currentPlayer.images.length > 0 && (
                  <div className={styles.imagePreview}>
                    {currentPlayer.images.map((url, index) => (
                      <div key={index} className={styles.imageItem}>
                        <img src={url} alt={`Image ${index + 1}`} />
                        <button
                          className={styles.removeBtn}
                          onClick={async () => {
                            const updatedImages = currentPlayer.images.filter((_, i) => i !== index);
                            const roomRef = doc(db, 'rooms', roomId);
                            const updatedPlayers = gameState.players.map(p =>
                              p.id === playerId ? { ...p, images: updatedImages } : p
                            );
                            await updateDoc(roomRef, { players: updatedPlayers });
                          }}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isHost && (
              <button
                className={styles.btnPrimary}
                onClick={handleStartGame}
                disabled={
                  gameState.players.length < 2 ||
                  !gameState.players.every(p => p.images.length >= 5 && p.images.length <= 15)
                }
              >
                ゲーム開始
              </button>
            )}
          </div>
        </div>
      )}

      {gameState.gameStatus === 'playing' && (
        <div className={styles.gameSection}>
          <div className={styles.gameInfo}>
            <div className={styles.scores}>
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className={`${styles.scoreItem} ${
                    player.id === playerId ? styles.myScore : ''
                  } ${
                    gameState.players[gameState.currentPlayerIndex]?.id === player.id
                      ? styles.currentTurn
                      : ''
                  }`}
                >
                  <span>{player.name}: {player.score}点</span>
                  {player.id === playerId && <span>(あなた)</span>}
                </div>
              ))}
            </div>
            <div className={styles.turnIndicator}>
              {isMyTurn ? 'あなたのターン' : `${gameState.players[gameState.currentPlayerIndex]?.name}のターン`}
            </div>
          </div>

          <div className={styles.cardsGrid}>
            {gameState.cards.map((card) => (
              <div
                key={card.id}
                className={`${styles.gameCard} ${
                  card.isFlipped ? styles.flipped : ''
                } ${card.isMatched ? styles.matched : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                {card.isFlipped || card.isMatched ? (
                  <img src={card.imageUrl} alt="Card" />
                ) : (
                  <div className={styles.cardBack}>?</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState.gameStatus === 'finished' && (
        <div className={styles.finishedSection}>
          <div className={styles.contentCard}>
            <h2>ゲーム終了！</h2>
            <div className={styles.finalScores}>
              {gameState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`${styles.finalScoreItem} ${
                      player.id === gameState.winner ? styles.winner : ''
                    }`}
                  >
                    <span>
                      {index + 1}位: {player.name} - {player.score}点
                    </span>
                    {player.id === gameState.winner && <span>🏆 優勝！</span>}
                  </div>
                ))}
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                const roomRef = doc(db, 'rooms', roomId);
                updateDoc(roomRef, {
                  gameStatus: 'waiting',
                  cards: [],
                  flippedCards: [],
                  players: gameState.players.map(p => ({ ...p, score: 0 })),
                });
              }}
            >
              もう一度プレイ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

