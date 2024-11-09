import { _decorator, Component, Node, Prefab, instantiate, Label, Input, input, EventTouch, UITransform, Vec2, Vec3, v2, v3, tween} from 'cc';
import { Globals } from './Globals';
import { Level } from './Level'; // 导入 Level 接口
import { AudioManager } from './AudioManager';
import { ScoreManager } from './ScoreManager';
import { GameSwitch } from './GameSwitch';
const { ccclass, property } = _decorator;

@ccclass('ContentControl')
export class ContentControl extends Component {

    @property({ type: [Prefab] })
    public chessPieces: Prefab[] = []; // 棋子预设

    @property
    public boardWidth: number = 6; // 棋盘宽度（列数）

    @property 
    public boardHeight: number = 6; // 棋盘高度（行数）

    @property
    public spacing: number = 96; // 棋盘元素之间的间距

    @property
    public x: number = -240; // 初始x坐标

    @property
    public y: number = 240; // 初始y坐标

    @property({ type: AudioManager })
    public audioManager: AudioManager | null = null;
    @property({ type: ScoreManager })
    public scoreManager: ScoreManager | null = null;
    @property
    private scoreThreshold: number = 20; // Score needed to advance
    @property({ type: GameSwitch })
    public gameSwitch: GameSwitch | null = null; // Reference to GameSwitch component
    // 是否正在交换
    private isSwap: boolean = false;
    swapBeforeIndex: number[] = null; // 交换之前下标
    swapAfterIndex: number[] = null; // 交换之后的下标
    startTouchPos: Vec2 = null;	// 开始触摸的位置
    score:number=0;

    // 棋盘节点
    private chessBoard: Node[][] = [];
    private globals: Globals | null = null;
    private characters: [string, string][]=null;
    @property
    public level_num: number = 1; // Make it public
    private level: Level=null;



    onLoad() {
        this.level_num = 1;
        
        // Get Globals component
        this.globals = this.getComponent(Globals);
        if (!this.globals) {
            this.globals = this.node.getComponent(Globals);
        }
        if (!this.globals) {
            this.globals = this.node.parent?.getComponent(Globals);
        }
        
        this.audioManager = this.getComponent(AudioManager);
        this.scoreManager = this.getComponent(ScoreManager);
        
        // Simple way to find GameSwitch
        if (!this.gameSwitch) {
            this.gameSwitch = this.node.parent?.parent?.getComponent(GameSwitch);
            if (!this.gameSwitch) {
                console.error("GameSwitch not found!");
            }
        }

        if (!this.globals) {
            console.error('Globals component not found!');
        }
    }
    start() {
        console.log("=== ContentControl Start ===");
        console.log("1. Starting ContentControl");
        console.log("2. Current level_num:", this.level_num);

        // Initialize chessBoard array first
        console.log("3. Initializing chessBoard array");
        this.chessBoard = Array(this.boardHeight).fill(null).map(() => 
            Array(this.boardWidth).fill(null)
        );

        // Clear existing board but preserve score display
        if (this.node.children.length > 0) {
            console.log("4A. Clearing existing children");
            // Remove only chess pieces, not UI elements
            const childrenToRemove = [...this.node.children];
            childrenToRemove.forEach(child => {
                // Check if the child is a chess piece (not a UI element)
                if (!child.name.includes('Score')) {
                    this.node.removeChild(child);
                }
            });
        } else {
            console.log("4B. No existing children to clear");
        }

        // Check if globals and levels exist
        console.log("5. Globals check:", {
            globalsExists: !!this.globals,
            levelsExists: !!(this.globals?.levels),
            levelsLength: this.globals?.levels?.length
        });

        if (!this.globals) {
            console.error("6A. Globals component not found!");
            return;
        }

        if (!this.globals.levels || this.globals.levels.length === 0) {
            console.error("6B. No levels defined in Globals!");
            return;
        }

        console.log("7. About to access level:", this.level_num);
        console.log("Total levels available:", this.globals.levels.length);

        if (this.level_num > this.globals.levels.length) {
            console.error(`8A. Level ${this.level_num} does not exist! Max level is ${this.globals.levels.length}`);
            return;
        }

        // Initialize new level
        this.level = this.globals.levels[this.level_num - 1];
        console.log("8B. Level data:", this.level);

        if (!this.level || !this.level.characters) {
            console.error(`9A. Invalid level data for level ${this.level_num}`);
            return;
        }

        console.log("9B. Level setup successful");
        this.characters = this.level.characters;
        
        // Generate new board
        this.generateBoard();
        
        // Check initial matches
        this.checkInitialMatches();
        
        // Check for possible moves
        if (!this.hasPossibleMoves()) {
            this.regenerateBoard();
        }
        
        this.scoreManager.resetScore();
        this.onMove();
    }

    // 检查是否有可行的移动方案
    private hasPossibleMoves(): boolean {
        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                // 检查水平交换
                if (j < this.boardWidth - 1) {
                    // 模拟水平交换
                    this.swapPieces([i, j], [i, j + 1]);
                    if (this.hasMatches()) {
                        // 还原交换
                        this.swapPieces([i, j], [i, j + 1]);
                        return true;
                    }
                    // 还原交换
                    this.swapPieces([i, j], [i, j + 1]);
                }
                
                // 检查垂直交换
                if (i < this.boardHeight - 1) {
                    // 模拟垂直���换
                    this.swapPieces([i, j], [i + 1, j]);
                    if (this.hasMatches()) {
                        // 还原交换
                        this.swapPieces([i, j], [i + 1, j]);
                        return true;
                    }
                    // 还原交换
                    this.swapPieces([i, j], [i + 1, j]);
                }
            }
        }
        return false;
    }

    // 重新生成棋盘
    private regenerateBoard(): void {
        // 清除现有棋盘
        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                if (this.chessBoard[i][j]) {
                    this.node.removeChild(this.chessBoard[i][j]);
                }
            }
        }
        // 重新生成棋盘
        this.generateBoard();
        this.checkInitialMatches();
        // 递归检查直到生成一个有可行移动方案的棋盘
        if (!this.hasPossibleMoves()) {
            this.regenerateBoard();
        }
    }

    // 简单的交换两个位置的棋子（不带动画）
    private swapPieces([row1, col1]: number[], [row2, col2]: number[]): void {
        const temp = this.chessBoard[row1][col1];
        this.chessBoard[row1][col1] = this.chessBoard[row2][col2];
        this.chessBoard[row2][col2] = temp;
    }

    // 检查是否有匹配
    private hasMatches(): boolean {
        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                const horizontalMatches = this.checkMatch(i, j, true);
                const verticalMatches = this.checkMatch(i, j, false);
                if (horizontalMatches.length >= 3 || verticalMatches.length >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    // 检查初始棋盘上的匹配
    private checkInitialMatches() {
        let hasMatches = true;
        while (hasMatches) {
            let matchPositions = [];
            // 检查每个位置的匹配
            for (let i = 0; i < this.boardHeight; i++) {
                for (let j = 0; j < this.boardWidth; j++) {
                    if (this.chessBoard[i][j]) {
                        const horizontalMatches = this.checkMatch(i, j, true);
                        const verticalMatches = this.checkMatch(i, j, false);
                        matchPositions = matchPositions.concat(horizontalMatches, verticalMatches);
                    }
                }
            }
            
            // 如果没有到匹配，退出循环
            if (matchPositions.length === 0) {
                hasMatches = false;
                continue;
            }

            // 消除匹配的方块
            for (let [row, col] of matchPositions) {
                this.node.removeChild(this.chessBoard[row][col]);
                this.chessBoard[row][col] = null;
            }

            // 下落方块并填充新方块
            const movedPositions = [...this.movePiecesDown(), ...this.refillAndCheck()];
            
            // 如果没有方块移动，退出循环
            if (movedPositions.length === 0) {
                hasMatches = false;
            }
        }
    }

    onMove() {
        input.on(Input.EventType.TOUCH_START, this.onBoardTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onBoardTouchMove, this);
    }

    update(deltaTime: number) {
        
    }
        // 触摸开始
    onBoardTouchStart(event: EventTouch) {
        // 获取鼠标按下的位置
        this.startTouchPos = event.getUILocation();
        // 根据鼠标按下的位置找到对应的棋子
        this.swapBeforeIndex = this.getPieceAtPosition(this.startTouchPos);
        if (!this.swapBeforeIndex) return;
        const [row, col] = this.swapBeforeIndex;
        this.audioManager.playSound(this.chessBoard[row][col].name)
    }

    onBoardTouchMove(event: EventTouch) {
        if (!this.swapBeforeIndex) {
            return;
        }
        const target = this.getSwappingPieces(event);
        const [row, col] = this.swapBeforeIndex;
        if (target) {
          this.swapPiece([row, col], target, (isSame: boolean) => {
            if (isSame) {
              this.swapPiece([row, col], target);
            } else {
              const isMatch = this.checkAndRemoveMatchesAt([[row, col], target]);
              if (!isMatch) {
                this.swapPiece([row, col], target);
              } else {
                // 在消除完成后检查是否有可行的移动方案
                if (!this.hasPossibleMoves()) {
                    this.regenerateBoard();
                }
              }
            }
          });
          this.swapBeforeIndex = null;
        }
    }

    private generateBoard(): void {
        // 创建空节点
        this.chessBoard = Array.from({ length: this.boardHeight }, () =>
            Array.from({ length: this.boardWidth }, () => null)
        );

        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                this.chessBoard[i][j] = this.generatePiece(i, j);
            }
        }
    }

    private generatePiece(i: number, j: number): Node {
        const piece = this.getRandomChessPiece();
        const [x, y] = this.getPiecePosition(i, j);
        piece.setPosition(x, y);
        this.node.addChild(piece);

            // Add label to the piece with random Chinese character
            const labelNode = piece.getChildByName("label_node");
            if (labelNode) {
                const label = labelNode.getComponent(Label);
                if (label) {
                    const randomCharacter = this.characters[Math.floor(Math.random() * this.characters.length)];
                    const pinyinorchar = Math.floor(Math.random() * 2);
                    label.string = randomCharacter[pinyinorchar];
                    piece.name=randomCharacter[0]
                } else {
                    console.log("Label component not found on label_node.");
                }
            } else {
                console.log("label_node not found.");
            }
        return piece;
    }

    private getPiecePosition(i: number, j: number): number[] {
        return [this.x + j * this.spacing, this.y - i * this.spacing];
    }

    private getRandomChessPiece(): Node {
        // 生成一个随机数，范围为 [0, 棋子预制件数组的长度)
        const randomIndex = Math.floor(Math.random() * this.chessPieces.length);
        // 使用随机数作为索引，从数组中选择一个棋子预制件
        const randomChessPiece = this.chessPieces[randomIndex];
        const piece = instantiate(randomChessPiece);
        return piece;
    }
    checkAndRemoveMatchesAt(pos): boolean {
        let hasMatches = true;
        let anyMatchFound = false;
        
        while (hasMatches) {
            let matches = new Set<string>(); // Specify the type as string
            // 检查所有位置的匹配,而只是只检查交换的位置
            for (let i = 0; i < this.boardHeight; i++) {
                for (let j = 0; j < this.boardWidth; j++) {
                    if (this.chessBoard[i][j]) {
                        const horizontalMatches = this.checkMatch(i, j, true);
                        const verticalMatches = this.checkMatch(i, j, false);
                        
                        // Add matches to Set as strings to ensure uniqueness
                        [...horizontalMatches, ...verticalMatches].forEach(([row, col]) => {
                            matches.add(`${row},${col}`);
                        });
                    }
                }
            }

            // Convert matches back to array of positions with type safety
            const matchArray = Array.from(matches).map((str: string) => {
                const parts = str.split(',');
                const row = parseInt(parts[0]);
                const col = parseInt(parts[1]);
                return [row, col];
            });

            if (matchArray.length < 3) {
                hasMatches = false;
                continue;
            }

            anyMatchFound = true;

            // Calculate score before removing pieces
            // Score calculation
            const scoreMap = {
                3: 3,
                4: 9,
                5: 27
            };
            
            const score = scoreMap[Math.min(matchArray.length, 5)] || scoreMap[5];
            this.scoreManager.addScore(score);

            // Check if score threshold is reached
            if (this.scoreManager.getScore() >= this.scoreThreshold) {
                console.log("Score threshold reached! Advancing to next level...");
                console.log("Current score:", this.scoreManager.getScore());
                console.log("GameSwitch reference:", this.gameSwitch);
                this.scheduleOnce(() => {
                    if (this.gameSwitch) {
                        this.gameSwitch.advanceToNextLevel();
                    } else {
                        console.error("GameSwitch component not found!");
                    }
                }, 1.0); // Wait 1 second before advancing
            }

            // 消除匹配的方块
            for (let [row, col] of matchArray) {
                this.node.removeChild(this.chessBoard[row][col]);
                this.chessBoard[row][col] = null;
            }

            // 下落方块并填充新方块
            const movedPositions = [...this.movePiecesDown(), ...this.refillAndCheck()];
            
            // 如果没有新的方块移动，结束循环
            if (movedPositions.length === 0) {
                hasMatches = false;
            }
        }

        return anyMatchFound;
    }
      checkMatch(row, col, horizontal) {
        // If this piece has already been matched, return empty array
        if (!this.chessBoard[row][col]) return [];
        
        const matches = [[row, col]];
        const current = this.chessBoard[row][col].name;
        let i = 1;

        if (horizontal) {
            // Check left
            while (col - i >= 0 && 
                   this.chessBoard[row][col - i] && 
                   this.chessBoard[row][col - i].name === current) {
                // Only add if it's not already in matches
                if (!matches.some(([r, c]) => r === row && c === (col - i))) {
                    matches.push([row, col - i]);
                }
                i++;
            }
            i = 1;
            // Check right
            while (col + i < this.chessBoard[row].length && 
                   this.chessBoard[row][col + i] && 
                   this.chessBoard[row][col + i].name === current) {
                // Only add if it's not already in matches
                if (!matches.some(([r, c]) => r === row && c === (col + i))) {
                    matches.push([row, col + i]);
                }
                i++;
            }
        } else {
            // Check up
            while (row - i >= 0 && 
                   this.chessBoard[row - i][col] && 
                   this.chessBoard[row - i][col].name === current) {
                // Only add if it's not already in matches
                if (!matches.some(([r, c]) => r === (row - i) && c === col)) {
                    matches.push([row - i, col]);
                }
                i++;
            }
            i = 1;
            // Check down
            while (row + i < this.chessBoard.length && 
                   this.chessBoard[row + i][col] && 
                   this.chessBoard[row + i][col].name === current) {
                // Only add if it's not already in matches
                if (!matches.some(([r, c]) => r === (row + i) && c === col)) {
                    matches.push([row + i, col]);
                }
                i++;
            }
        }

        // Only return matches if there are 3 or more, but don't add score here
        return matches.length >= 3 ? matches : [];
      }
    

    
      swapPiece(
        [row1, col1]: number[],
        [row2, col2]: number[],
        callback?: (isSame: boolean) => void
      ) {
        if (!this.chessBoard[row1][col1] || !this.chessBoard[row2][col2]) return;
        this.isSwap = true;
        const temp = this.chessBoard[row1][col1];
        this.chessBoard[row1][col1] = this.chessBoard[row2][col2];
        this.chessBoard[row2][col2] = temp;
        this.swapAnimation(
          this.chessBoard[row1][col1],
          this.chessBoard[row2][col2],
          () => {
            this.isSwap = false;
            if (
              this.chessBoard[row1][col1].name === this.chessBoard[row2][col2].name
            ) {
              callback?.(true);
            } else {
              callback?.(false);
            }
          }
        );
      }
    
    
      swapAnimation(a: Node, b: Node, callback?: () => void) {
        if (!a || !b) return;
        const speed = 0.2;
        const aPos = new Vec3(a.position.x, a.position.y);
        const bPos = new Vec3(b.position.x, b.position.y);
    
        let completedCount = 0;
        const checkComplete = () => {
            completedCount++;
            if (completedCount === 2) {
                callback?.();
            }
        };
    
        tween(a)
            .to(speed, { position: bPos })
            .call(checkComplete)
            .start();
    
        tween(b)
            .to(speed, { position: aPos })
            .call(checkComplete)
            .start();
      }
    
    getSwappingPieces(event: EventTouch) {
        if (!this.startTouchPos || !event || !this.swapBeforeIndex|| this.isSwap) {
          return null;
        }
    
        let target = null;
        const [row, col] = this.swapBeforeIndex;
        const threshold = 50; // 移动阈值
        const { x: startX, y: startY } = this.startTouchPos;
        const { x: moveX, y: moveY } = event.getUILocation();
        const diffX = moveX - startX;
        const diffY = moveY - startY;
    
        // 判断左右
        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > threshold) {
            target = [row, col + 1];
          } else if (diffX < -threshold) {
            target = [row, col - 1];
          }
        } else {
          if (diffY > threshold) {
            target = [row - 1, col];
          } else if (diffY < -threshold) {
            target = [row + 1, col];
          }
        }
    
        // 边界判断
        if (!this.isWithinBounds(target, this.boardWidth, this.boardHeight)) {
          return null;
        }
        return target;
      }
    
      // 检查目标位置是否在棋盘边界内
      isWithinBounds(target, boardWidth, boardHeight) {
        return (
          target &&
          target[0] >= 0 &&
          target[0] < boardHeight &&
          target[1] >= 0 &&
          target[1] < boardWidth
        );
      }

    
    






  
    getPieceAtPosition(pos: Vec2 | null): number[] {
      /**
       * 1. 获取当前棋盘节点
       * 2. 遍历子节点，将点击的点坐标转换到当前棋盘节点坐标系中
       * 3. 判断子节点盒子是否包含点击的节点
       */
      // 获取当前棋盘节点
      const uiTransform = this.node.getComponent(UITransform);
  
      // 换当前棋盘坐标系
      const { x, y } = uiTransform.convertToNodeSpaceAR(v3(pos.x, pos.y));
  
      // 遍历坐标 查看该棋子是否包含了点击的点
      for (let row = 0; row < this.chessBoard.length; row++) {
        for (let col = 0; col < this.chessBoard[row].length; col++) {
          const piece = this.chessBoard[row][col];
          const box = piece?.getComponent(UITransform).getBoundingBox();
          if (box?.contains(v2(x, y))) {
            return [row, col];
          }
        }
      }
      return;
    }

     // 下坠动画
  downAnimation(node: Node, [x, y]: number[], callback?: () => void) {
    this.isSwap=true;
    tween(node)
      .to(0.2, { position: new Vec3(x, y) })
      .call(() => {
        this.isSwap = false;
        callback?.();
      })
      .start();
  }
  movePiecesDown() {
    const movedPos=[]
    for (let col = this.chessBoard[0].length - 1; col >= 0; col--) {
      let nullCount = 0;
      for (let row = this.chessBoard.length - 1; row >= 0; row--) {
        const piece = this.chessBoard[row][col];
        if (piece === null) {
          nullCount++;
        } else if (nullCount > 0) {
            this.downAnimation(
                this.chessBoard[row][col],
                this.getPiecePosition(row + nullCount, col)
           );
           this.chessBoard[row + nullCount][col] = this.chessBoard[row][col];
           this.chessBoard[row][col] = null;
           movedPos.push([row + nullCount, col]);
        }
      }
    }
    return movedPos;
  }
  refillAndCheck() {
    const movedPos = []
    for (let row = 0; row < this.chessBoard.length; row++) {
      for (let col = 0; col < this.chessBoard[row].length; col++) {
        if (this.chessBoard[row][col] === null) {
            this.chessBoard[row][col] = this.generatePiece(-(row + 1), col);
            movedPos.push([row, col]);
            this.downAnimation(
              this.chessBoard[row][col],
              this.getPiecePosition(row, col)
            );
          }
      }
    }
    return movedPos
  }

 // 随机获取棋子
  getRandomPiece() {
    // 1-5为例
    return Math.floor(Math.random() * 5) + 1;
  }


  
}
