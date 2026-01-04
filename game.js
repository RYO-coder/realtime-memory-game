// ゲームキャンバスとコンテキストの設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 600;

// ゲーム状態
let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'win'
let score = 0;
let lives = 3;
let cameraX = 0;
let gameStartTime = 0;

// キー入力管理
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// プレイヤークラス
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = -15;
        this.gravity = 0.8;
        this.onGround = false;
        this.facingRight = true;
        this.attackCooldown = 0;
        this.invulnerable = 0;
    }

    update(platforms) {
        // 左右移動
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.velocityX = -this.speed;
            this.facingRight = false;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.velocityX = this.speed;
            this.facingRight = true;
        } else {
            this.velocityX *= 0.8; // 摩擦
        }

        // ジャンプ
        if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
        }

        // 重力
        this.velocityY += this.gravity;

        // 位置更新
        this.x += this.velocityX;
        this.y += this.velocityY;

        // プラットフォームとの衝突判定
        this.onGround = false;
        for (let platform of platforms) {
            if (this.checkCollision(platform)) {
                // 上から着地
                if (this.velocityY > 0 && this.y - this.height < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
                // 下から衝突
                else if (this.velocityY < 0 && this.y > platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // 左右の衝突
                else if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                    this.velocityX = 0;
                }
            }
        }

        // 画面外に落ちた場合
        if (this.y > canvas.height + 100) {
            this.takeDamage();
        }

        // 攻撃クールダウン
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;

        // カメラの追従
        const targetCameraX = this.x - canvas.width / 3;
        cameraX += (targetCameraX - cameraX) * 0.1;
        if (cameraX < 0) cameraX = 0;
    }

    attack() {
        if (this.attackCooldown === 0) {
            this.attackCooldown = 20;
            return {
                x: this.facingRight ? this.x + this.width : this.x - 30,
                y: this.y + this.height / 2,
                width: 30,
                height: 30,
                facingRight: this.facingRight
            };
        }
        return null;
    }

    takeDamage() {
        if (this.invulnerable === 0) {
            lives--;
            this.invulnerable = 120; // 2秒間無敵
            this.x = 100;
            this.y = 100;
            this.velocityX = 0;
            this.velocityY = 0;
            if (lives <= 0) {
                gameState = 'gameover';
                document.getElementById('gameOver').style.display = 'block';
                document.getElementById('gameOverTitle').textContent = 'ゲームオーバー';
            }
        }
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y);
        
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }

        // プレイヤーの描画（シンプルな矩形）
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 顔
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 8, 8);
        ctx.fillRect(22, 10, 8, 8);
        ctx.fillRect(12, 25, 16, 4);

        // 攻撃エフェクト
        if (this.attackCooldown > 15) {
            ctx.fillStyle = '#FFD93D';
            ctx.fillRect(this.facingRight ? this.width : -30, this.height / 2 - 15, 30, 30);
        }

        ctx.restore();
    }
}

// 敵クラス
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.velocityX = type === 'basic' ? -2 : -1.5;
        this.velocityY = 0;
        this.gravity = 0.8;
        this.onGround = false;
        this.type = type;
        this.health = type === 'basic' ? 1 : 2;
        this.patrolDistance = 100;
        this.startX = x;
        this.direction = -1;
    }

    update(platforms) {
        // パトロール動作
        if (Math.abs(this.x - this.startX) > this.patrolDistance) {
            this.direction *= -1;
        }
        this.velocityX = (this.type === 'basic' ? 2 : 1.5) * this.direction;

        // 重力
        this.velocityY += this.gravity;

        // 位置更新
        this.x += this.velocityX;
        this.y += this.velocityY;

        // プラットフォームとの衝突
        this.onGround = false;
        for (let platform of platforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0 && this.y - this.height < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
            }
        }

        // 画面外に落ちた場合は削除
        if (this.y > canvas.height + 200) {
            return false;
        }
        return true;
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    hit() {
        this.health--;
        return this.health <= 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y);
        
        // 敵の描画
        if (this.type === 'basic') {
            ctx.fillStyle = '#8B4513';
        } else {
            ctx.fillStyle = '#DC143C';
        }
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 目
        ctx.fillStyle = '#FFF';
        ctx.fillRect(8, 8, 6, 6);
        ctx.fillRect(21, 8, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(9, 9, 4, 4);
        ctx.fillRect(22, 9, 4, 4);

        ctx.restore();
    }
}

// プラットフォームクラス
class Platform {
    constructor(x, y, width, height, type = 'ground') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y);
        
        if (this.type === 'ground') {
            // 地面
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = '#6B5B3D';
            ctx.fillRect(0, 0, this.width, 5);
        } else {
            // ブロック
            ctx.fillStyle = '#C9A961';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, this.width, this.height);
        }

        ctx.restore();
    }
}

// ゴールクラス
class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 100;
    }

    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y);
        
        // 旗
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, 0, 30, 30);
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(30, 30);
        ctx.lineTo(50, 15);
        ctx.closePath();
        ctx.fill();
        
        // ポール
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(20, 30, 10, 70);

        ctx.restore();
    }
}

// ゲームオブジェクト
let player;
let platforms = [];
let enemies = [];
let goal;
let attacks = [];

// レベル生成
function generateLevel() {
    platforms = [];
    enemies = [];
    attacks = [];
    
    // 地面
    platforms.push(new Platform(0, canvas.height - 40, 2000, 40, 'ground'));
    
    // プラットフォーム1
    platforms.push(new Platform(300, canvas.height - 150, 150, 20));
    platforms.push(new Platform(500, canvas.height - 200, 150, 20));
    
    // プラットフォーム2
    platforms.push(new Platform(800, canvas.height - 250, 150, 20));
    platforms.push(new Platform(1000, canvas.height - 300, 150, 20));
    
    // プラットフォーム3
    platforms.push(new Platform(1300, canvas.height - 200, 150, 20));
    platforms.push(new Platform(1500, canvas.height - 150, 150, 20));
    
    // 最後のプラットフォーム
    platforms.push(new Platform(1700, canvas.height - 100, 200, 20));
    
    // 敵の配置
    enemies.push(new Enemy(400, canvas.height - 190, 'basic'));
    enemies.push(new Enemy(600, canvas.height - 240, 'basic'));
    enemies.push(new Enemy(900, canvas.height - 290, 'basic'));
    enemies.push(new Enemy(1100, canvas.height - 340, 'basic'));
    enemies.push(new Enemy(1400, canvas.height - 240, 'basic'));
    enemies.push(new Enemy(1600, canvas.height - 190, 'basic'));
    
    // ゴール
    goal = new Goal(1850, canvas.height - 140);
    
    // プレイヤー初期位置
    player = new Player(100, 100);
    cameraX = 0;
}

// ゲームループ
function gameLoop() {
    // クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 雲の描画
    for (let i = 0; i < 5; i++) {
        const cloudX = (i * 400 - cameraX * 0.3) % (canvas.width + 200) - 100;
        const cloudY = 50 + (i * 37) % 100;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    if (gameState === 'playing') {
        // プレイヤー更新
        player.update(platforms);
        
        // 攻撃
        if (keys['z'] || keys['Z']) {
            const attack = player.attack();
            if (attack) {
                attacks.push({...attack, lifetime: 10});
            }
        }
        
        // 攻撃の更新
        attacks = attacks.filter(attack => {
            attack.lifetime--;
            return attack.lifetime > 0;
        });
        
        // 敵の更新
        enemies = enemies.filter(enemy => {
            if (!enemy.update(platforms)) return false;
            
            // プレイヤーとの衝突
            if (player.checkCollision(enemy) && player.invulnerable === 0) {
                // 上から踏みつけ
                if (player.velocityY > 0 && player.y < enemy.y) {
                    if (enemy.hit()) {
                        score += 100;
                        return false;
                    }
                    player.velocityY = -8; // バウンス
                } else {
                    player.takeDamage();
                }
            }
            
            // 攻撃との衝突
            for (let i = attacks.length - 1; i >= 0; i--) {
                const attack = attacks[i];
                if (attack.x < enemy.x + enemy.width &&
                    attack.x + attack.width > enemy.x &&
                    attack.y < enemy.y + enemy.height &&
                    attack.y + attack.height > enemy.y) {
                    if (enemy.hit()) {
                        score += 100;
                        attacks.splice(i, 1);
                        return false;
                    }
                    attacks.splice(i, 1);
                }
            }
            
            return true;
        });
        
        // ゴール判定
        if (goal && goal.checkCollision(player)) {
            gameState = 'win';
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('gameOverTitle').textContent = 'クリア！';
        }
        
        // 描画
        platforms.forEach(p => p.draw());
        goal.draw();
        enemies.forEach(e => e.draw());
        attacks.forEach(a => {
            ctx.save();
            ctx.translate(a.x - cameraX, a.y);
            ctx.fillStyle = '#FFD93D';
            ctx.fillRect(0, 0, a.width, a.height);
            ctx.restore();
        });
        player.draw();
        
        // UI更新
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
    }
    
    requestAnimationFrame(gameLoop);
}

// イベントリスナー
document.getElementById('startButton').addEventListener('click', () => {
    gameState = 'playing';
    score = 0;
    lives = 3;
    document.getElementById('gameMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    generateLevel();
    gameStartTime = Date.now();
});

document.getElementById('restartButton').addEventListener('click', () => {
    gameState = 'playing';
    score = 0;
    lives = 3;
    document.getElementById('gameMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    generateLevel();
    gameStartTime = Date.now();
});

// 初期化
generateLevel();
gameLoop();

