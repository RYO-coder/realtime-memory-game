export interface Card {
  id: string;
  imageUrl: string;
  userId: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  images: string[];
}

export interface GameState {
  roomId: string;
  players: Player[];
  cards: Card[];
  currentPlayerIndex: number;
  flippedCards: string[];
  gameStatus: 'waiting' | 'setup' | 'playing' | 'finished';
  settings: {
    imagesPerPlayer: number;
    maxPlayers: number;
  };
  winner?: string;
}

export function createCardPairs(players: Player[], imagesPerPlayer: number): Card[] {
  const cards: Card[] = [];
  let cardId = 0;

  players.forEach((player) => {
    // 各プレイヤーの画像を2枚ずつ（ペア）作成
    for (let i = 0; i < imagesPerPlayer; i++) {
      const pairId = `pair-${player.id}-${i}`;
      const imageUrl = player.images[i];

      // 同じペアのカードを2枚作成
      cards.push({
        id: `card-${cardId++}`,
        imageUrl,
        userId: player.id,
        isFlipped: false,
        isMatched: false,
        pairId,
      });

      cards.push({
        id: `card-${cardId++}`,
        imageUrl,
        userId: player.id,
        isFlipped: false,
        isMatched: false,
        pairId,
      });
    }
  });

  // カードをシャッフル
  return shuffleArray(cards);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function checkMatch(cards: Card[], flippedCardIds: string[]): boolean {
  if (flippedCardIds.length !== 2) return false;

  const card1 = cards.find(c => c.id === flippedCardIds[0]);
  const card2 = cards.find(c => c.id === flippedCardIds[1]);

  if (!card1 || !card2) return false;

  return card1.pairId === card2.pairId;
}

export function isGameFinished(cards: Card[]): boolean {
  return cards.every(card => card.isMatched);
}

