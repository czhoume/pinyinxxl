import { _decorator, Component, Node, Prefab, instantiate, Label, Input, input, EventTouch, UITransform, Vec2, Vec3, v2, v3, tween} from 'cc';
import { Globals } from './Globals';
import { Level } from './Level'; // 导入 Level 接口
import { AudioManager } from './AudioManager';
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
    // 是否正在交换
    private isSwap: boolean = false;
    swapBeforeIndex: number[] = null; // 交换之前下标
    swapAfterIndex: number[] = null; // 交换之后的下标
    startTouchPos: Vec2 = null;	// 开始触摸的位置

    // 棋盘节点
    private chessBoard: Node[][] = [];
    private globals: Globals | null = null;
    private characters: [string, string][]=null;
    private level_num: number = null;
    private level: Level=null;



    onLoad() {
        this.level_num=2;
        this.globals = this.getComponent(Globals);
        this.audioManager=this.getComponent(AudioManager);
        if (!this.globals) {
            console.error('Globals component not found!');
        } 
    }
    start() {
        this.level = this.globals.levels[this.level_num - 1];
        this.characters = this.level.characters;
        this.generateBoard();
        // 在生成棋盘后检查并消除匹配
        this.checkInitialMatches();
        // 检查是否有可行的移动方案
        if (!this.hasPossibleMoves()) {
            this.regenerateBoard();
        }
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
                    // 模拟垂直交换
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
            
            // 如果没有找到匹配，退出循环
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
            let matches = [];
            // 检查所有位置的匹配,而不是只检查交换的位置
            for (let i = 0; i < this.boardHeight; i++) {
                for (let j = 0; j < this.boardWidth; j++) {
                    if (this.chessBoard[i][j]) {
                        const horizontalMatches = this.checkMatch(i, j, true);
                        const verticalMatches = this.checkMatch(i, j, false);
                        matches = matches.concat(horizontalMatches, verticalMatches);
                    }
                }
            }

            if (matches.length < 3) {
                hasMatches = false;
                continue;
            }

            anyMatchFound = true;

            // 消除匹配的方块
            for (let [row, col] of matches) {
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
        const matches = [[row, col]];
        const current = this.chessBoard[row][col].name;
        let i = 1;
        if (horizontal) {
          // 往左遍历
          while (col - i >= 0 && this.chessBoard[row][col - i].name === current) {
            matches.push([row, col - i]);
            i++;
          }
          i = 1;
          // 往右遍历
          while (
            col + i < this.chessBoard[row].length &&
            this.chessBoard[row][col + i].name === current
          ) {
            matches.push([row, col + i]);
            i++;
          }
        } else {
          // 往上
          while (row - i >= 0 && this.chessBoard[row - i][col].name === current) {
            matches.push([row - i, col]);
            i++;
          }
          i = 1;
          // 往下
          while (
            row + i < this.chessBoard.length &&
            this.chessBoard[row + i][col].name === current
          ) {
            matches.push([row + i, col]);
            i++;
          }
        }
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
    
        const swapAPromise = new Promise((resolve) => {
          tween(a)
            .to(speed, { position: bPos })
            .call(() => {
              resolve(true);
            })
            .start();
        });
    
        const swapBPromise = new Promise((resolve) => {
          tween(b)
            .to(speed, { position: aPos })
            .call(() => {
              resolve(true);
            })
            .start();
        });
    
        Promise.allSettled([swapAPromise, swapBPromise]).then(() => {
          callback?.();
        });
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
  
      // 转换当前棋盘坐标系
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
