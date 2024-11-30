import { _decorator, Component, Node, Vec3, Touch, EventTouch, input, Input, Sprite, UITransform, Button, Prefab, instantiate, Color, Collider2D, Contact2DType, BoxCollider2D, PhysicsSystem2D, Vec2, screen, view, SpriteFrame, Texture2D, Size } from 'cc';
import { BulletManager } from './BulletManager';
import { EnemyManager } from './EnemyManager';
import { Pinyin } from './Pinyin';
import { FeedbackEffect } from './FeedbackEffect';
const { ccclass, property } = _decorator;

@ccclass('ShootingGame')
export class ShootingGame extends Component {
    @property(Sprite)
    private player: Sprite = null;

    @property
    private playerMoveSpeed: number = 500;

    @property
    private playerXMin: number = -300;

    @property
    private playerXMax: number = 300;

    @property([Node])
    private backgrounds: Node[] = [];

    @property
    private backgroundScrollSpeed: number = 300;

    @property(BulletManager)
    private bulletManager: BulletManager = null;

    @property(EnemyManager)
    private enemyManager: EnemyManager = null;

    @property(FeedbackEffect)
    private feedbackEffect: FeedbackEffect = null;

    @property(Node)
    private topMask: Node = null;

    @property(Node)
    private bottomMask: Node = null;

    private enemies: Node[] = [];
    private isTouching: boolean = false;
    private touchStartX: number = 0;
    private playerStartX: number = 0;
    private shootPosition: Vec3 = new Vec3(0, 0, 0);

    // 设计比常量
    private readonly ASPECT_RATIO_WIDTH = 2;
    private readonly ASPECT_RATIO_HEIGHT = 3;

    start() {
        console.log("=== ShootingGame Start ===");
        
        // 获取视图尺寸
        const visibleSize = view.getVisibleSize();
        console.log("Visible size:", visibleSize);

        // 初始化组件
        this.initializeComponents(visibleSize);

        // 初始化物理系统
        this.initializePhysics();

        // 确保节点有 UITransform 组件
        const transform = this.node.getComponent(UITransform);
        if (!transform) {
            const newTransform = this.node.addComponent(UITransform);
            newTransform.setContentSize(visibleSize.width, visibleSize.height);
        }
    }

    private initializeComponents(visibleSize: Size) {
        // 使用固定尺寸而不是 visibleSize
        const gameWidth = 640;
        const gameHeight = 960;

        // 初始化玩家
        if (this.player) {
            // 获取或创建玩家的 UITransform 组件
            let playerTransform = this.player.getComponent(UITransform);
            if (!playerTransform) {
                playerTransform = this.player.addComponent(UITransform);
            }

            // 获取玩家实际宽度，如果没有设置则使用默认值
            const playerWidth = playerTransform.contentSize.width || 40;
            
            // 计算玩家可移动范围
            const screenHalfWidth = gameWidth / 2;  // 使用固定宽度
            
            // 设置移动范围，使玩家中心点可以到达屏幕边缘
            this.playerXMin = -screenHalfWidth;
            this.playerXMax = screenHalfWidth;

            // 设置玩家初始位置（底部20%处）
            const playerY = -gameHeight * 0.3;  // 使用固定高度
            this.player.node.setPosition(new Vec3(0, playerY, 0));

            console.log("Player initialized:", {
                position: { x: 0, y: playerY },
                moveRange: { min: this.playerXMin, max: this.playerXMax },
                playerWidth: playerWidth,
                screenWidth: gameWidth,
                visibleSize: { width: gameWidth, height: gameHeight }
            });

            // 设置碰撞器
            const playerCollider = this.player.node.getComponent(BoxCollider2D);
            if (playerCollider) {
                playerCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
                playerCollider.sensor = true;
            }
        } else {
            console.error("Player sprite not assigned!");
        }

        // 确保主节点可以接收触摸事件
        const nodeTransform = this.node.getComponent(UITransform);
        if (!nodeTransform) {
            const transform = this.node.addComponent(UITransform);
            transform.setContentSize(gameWidth, gameHeight);
        } else {
            nodeTransform.setContentSize(gameWidth, gameHeight);
        }

        // 设置触摸事件监听
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        console.log("Touch events initialized");

        // 初始化背景
        if (this.backgrounds.length >= 2) {
            for (let bg of this.backgrounds) {
                const bgTransform = bg.getComponent(UITransform);
                if (bgTransform) {
                    // 背景尺寸更大一些，确保完全覆盖
                    bgTransform.width = visibleSize.width;
                    bgTransform.height = visibleSize.height + 4;  // 增加到4像素的额外高度
                }
            }

            // 设置背景初始位置，增加重叠区域
            this.backgrounds[0].setPosition(0, 0, 0);
            this.backgrounds[1].setPosition(0, visibleSize.height - 2, 0);  // 增加到2像素的重叠
        }

        // 更新敌人生成范围
        if (this.enemyManager) {
            this.enemyManager.setSpawnBounds({
                left: -gameWidth / 2,
                right: gameWidth / 2,
                top: gameHeight / 2,
                bottom: -gameHeight / 2
            });
        }

        // 开始自动射击
        this.schedule(this.shoot, 0.5);
    }

    private initializePhysics() {
        // 启用物理系统但禁用物理模拟
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.enabledContactListener = true; // 只启用碰撞检测
        PhysicsSystem2D.instance.gravity = new Vec2(0, 0); // 设置重力为0

        // 确保所有物体的刚体组件都是静态的
        this.makeAllBodiesStatic();
    }

    private makeAllBodiesStatic() {
        // 玩家
        if (this.player) {
            const collider = this.player.node.getComponent(BoxCollider2D);
            if (collider) {
                collider.sensor = true; // 设置为传感器，只检测碰撞不进行物理反应
            }
        }

        // 子弹
        if (this.bulletManager) {
            // 在 BulletManager 中确保子弹也是传感器
            this.bulletManager.makeBulletsSensor();
        }

        // 敌人
        if (this.enemyManager) {
            // 在 EnemyManager 中确保敌人也是传感器
            this.enemyManager.makeEnemiesSensor();
        }
    }

    private shoot() {
        if (this.bulletManager && this.player) {
            const playerPos = this.player.node.position;
            const visibleSize = view.getVisibleSize();
            const bulletOffset = visibleSize.height * 0.03; // 使用 visibleSize 替代 gameHeight
            
            const bulletPos = new Vec3(
                playerPos.x,
                playerPos.y + bulletOffset,
                playerPos.z
            );
            
            const currentType = this.bulletManager.getCurrentBulletType();
            this.bulletManager.createBullet(currentType, bulletPos);
        }
    }

    update(deltaTime: number) {
        // 更新背景滚动
        if (this.backgrounds.length >= 2) {
            for (let bg of this.backgrounds) {
                const currentPos = bg.position;
                const scrollSpeed = this.backgroundScrollSpeed * deltaTime;
                const newY = currentPos.y - scrollSpeed;

                // 如果背景完全移出屏幕底部，将其移动到顶部
                if (newY <= -view.getVisibleSize().height) {
                    // 找到另一个背景
                    const otherBg = this.backgrounds.find(b => b !== bg);
                    if (otherBg) {
                        // 将当前背景移动到另一个背景的上方，增加重叠
                        bg.setPosition(
                            currentPos.x,
                            otherBg.position.y + view.getVisibleSize().height - 2,  // 增加到2像素的重叠
                            currentPos.z
                        );
                    }
                } else {
                    bg.setPosition(currentPos.x, newY, currentPos.z);
                }
            }

            // 确保背景按照Y坐标排序
            this.backgrounds.sort((a, b) => b.position.y - a.position.y);
        }
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        // 移除屏幕大小变化监听
        view.off('canvas-resize', this.onScreenResize, this);
    }

    private onTouchStart(event: EventTouch) {
        if (!this.player) {
            console.error("Player not found!");
            return;
        }

        this.isTouching = true;
        this.touchStartX = event.getLocationX();
        this.playerStartX = this.player.node.position.x;

        console.log("Touch Start:", {
            touchX: this.touchStartX,
            playerX: this.playerStartX,
            bounds: {
                min: this.playerXMin,
                max: this.playerXMax
            }
        });
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isTouching || !this.player) {
            console.log("Touch move ignored:", {
                isTouching: this.isTouching,
                hasPlayer: !!this.player
            });
            return;
        }

        const deltaX = event.getLocationX() - this.touchStartX;
        const newX = this.playerStartX + deltaX;
        const clampedX = Math.min(Math.max(newX, this.playerXMin), this.playerXMax);
        
        const currentPos = this.player.node.position;
        this.player.node.setPosition(new Vec3(clampedX, currentPos.y, currentPos.z));
    }

    private onTouchEnd(event: EventTouch) {
        console.log("Touch End:", {
            wasMoving: this.isTouching,
            finalX: this.player?.node.position.x
        });
        this.isTouching = false;
    }

    public destroyEnemy(enemyNode: Node) {
        const enemyIndex = this.enemies.indexOf(enemyNode);
        if (enemyIndex !== -1) {
            // 先禁用碰撞器
            const collider = enemyNode.getComponent(BoxCollider2D);
            if (collider) {
                collider.enabled = false;
            }
            
            // 从数组中移除
            this.enemies.splice(enemyIndex, 1);
            
            // 迟一帧销毁节点
            this.scheduleOnce(() => {
                if (enemyNode.isValid) {
                    enemyNode.destroy();
                }
            }, 0);
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        console.log('=== Collision Begin ===');
        console.log('Self collider:', {
            name: selfCollider.node.name,
            parent: selfCollider.node.parent?.name,
            path: this.getNodePath(selfCollider.node)
        });
        console.log('Other collider:', {
            name: otherCollider.node.name,
            parent: otherCollider.node.parent?.name,
            path: this.getNodePath(otherCollider.node)
        });

        // 检查是否是玩家与拼音选项的碰撞
        if (selfCollider.node.name === 'Player') {
            // 获取拼组件
            const optionNode = otherCollider.node.parent;  // 获取选项节点的父节点
            const pinyinNode = optionNode?.parent?.parent;  // 获取 Pinyin 根节点
            const pinyinComp = pinyinNode?.getComponent(Pinyin);

            console.log('Found Pinyin component:', {
                optionNodeName: optionNode?.name,
                pinyinNodeName: pinyinNode?.name,
                hasComponent: !!pinyinComp,
                optionPath: this.getNodePath(otherCollider.node)
            });

            if (pinyinComp) {
                // 直接检查选项是否正确
                const isCorrect = pinyinComp.isOptionCorrect(optionNode);
                console.log('Checking answer:', {
                    optionNode: optionNode.name,
                    isCorrect: isCorrect
                });

                if (isCorrect) {
                    console.log("Correct pinyin answer!");
                    // 升级子弹类型
                    if (this.bulletManager) {
                        this.bulletManager.upgradeBulletType();
                    }
                } else {
                    console.log("Wrong pinyin answer!");
                    // 显示错误反馈效果
                    if (this.feedbackEffect) {
                        this.feedbackEffect.showWrongFeedback();
                    }
                    // 降级子弹类型
                    if (this.bulletManager) {
                        this.bulletManager.downgradeBulletType();
                    }
                }

                // 延迟销毁拼音题目
                this.scheduleOnce(() => {
                    if (pinyinNode && pinyinNode.isValid) {
                        // 先禁用所有组件
                        const components = pinyinNode.getComponents(Component);
                        components.forEach(comp => {
                            if (comp.enabled) {
                                comp.enabled = false;
                            }
                        });
                        
                        // 然后销毁节点
                        pinyinNode.destroy();
                    }
                }, 0);
            }
        }
    }

    // 辅助方法：获取节点的完整路径
    private getNodePath(node: Node): string {
        let path = node.name;
        let current = node;
        while (current.parent) {
            current = current.parent;
            path = current.name + '/' + path;
        }
        return path;
    }

    // 辅助方法：查找 Pinyin 父节点
    private findPinyinParent(node: Node): Node | null {
        let current = node;
        while (current) {
            if (current.getComponent(Pinyin)) {
                return current;
            }
            if (!current.parent) {
                break;
            }
            current = current.parent;
        }
        return null;
    }

    public shootBullet(type: string) {
        if (!this.bulletManager) {
            console.error('BulletManager is not assigned!');
            return;
        }

        // 调用 BulletManager 的 createBullet 方法
        const bullets = this.bulletManager.createBullet(type, this.shootPosition);

        // 处理返回的子弹节点数组
        bullets.forEach(bullet => {
            console.log(`Bullet created at position: ${bullet.position}`);
        });
    }

    private createMasks() {
        // 获取屏幕尺寸
        const visibleSize = view.getVisibleSize();
        const screenSize = screen.windowSize;

        // 创建上方遮罩
        if (!this.topMask) {
            this.topMask = new Node('TopMask');
            const topSprite = this.topMask.addComponent(Sprite);
            const topTransform = this.topMask.addComponent(UITransform);
            
            // 创建黑色精灵帧
            const spriteFrame = new SpriteFrame();
            const texture = new Texture2D();
            texture.reset({
                width: 2,
                height: 2,
                format: Texture2D.PixelFormat.RGBA8888,
            });
            const pixels = new Uint8Array([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]);
            texture.uploadData(pixels);
            spriteFrame.texture = texture;
            
            topSprite.spriteFrame = spriteFrame;
            topSprite.color = new Color(0, 0, 0, 255);

            // 计算遮罩尺寸 - 使用更大的尺寸确保完全覆盖
            const maskHeight = screenSize.height * 2;  // 使用2倍屏幕高度
            const maskWidth = screenSize.width * 2;    // 使用2倍屏幕宽度
            topTransform.setContentSize(maskWidth, maskHeight);
            
            // 设置位置 - 确保完全覆盖上方区域
            this.topMask.setPosition(0, visibleSize.height + maskHeight / 4, 0);
            this.node.addChild(this.topMask);
        }

        // 创建下方遮罩
        if (!this.bottomMask) {
            this.bottomMask = new Node('BottomMask');
            const bottomSprite = this.bottomMask.addComponent(Sprite);
            const bottomTransform = this.bottomMask.addComponent(UITransform);
            
            // 使用相同的精灵帧
            bottomSprite.spriteFrame = this.topMask.getComponent(Sprite).spriteFrame;
            bottomSprite.color = new Color(0, 0, 0, 255);

            // 计算遮罩尺寸 - 使用相同的大尺寸
            const maskHeight = screenSize.height * 2;
            const maskWidth = screenSize.width * 2;
            bottomTransform.setContentSize(maskWidth, maskHeight);
            
            // 设置位置 - 确保完全覆盖下方区域
            this.bottomMask.setPosition(0, -visibleSize.height - maskHeight / 4, 0);
            this.node.addChild(this.bottomMask);
        }

        // 设置遮罩层级为最上层
        this.topMask.setSiblingIndex(9999);
        this.bottomMask.setSiblingIndex(9999);

        // 立即更新遮罩
        this.updateMasks();
    }

    private updateMasks() {
        const visibleSize = view.getVisibleSize();
        const screenSize = screen.windowSize;

        // 计算遮罩尺寸 - 使用更大的尺寸
        const maskHeight = screenSize.height * 2;
        const maskWidth = screenSize.width * 2;

        // 更新上方遮罩
        if (this.topMask) {
            const topTransform = this.topMask.getComponent(UITransform);
            if (topTransform) {
                topTransform.setContentSize(maskWidth, maskHeight);
                this.topMask.setPosition(0, visibleSize.height + maskHeight / 4, 0);
            }
        }

        // 更新下方遮罩
        if (this.bottomMask) {
            const bottomTransform = this.bottomMask.getComponent(UITransform);
            if (bottomTransform) {
                bottomTransform.setContentSize(maskWidth, maskHeight);
                this.bottomMask.setPosition(0, -visibleSize.height - maskHeight / 4, 0);
            }
        }
    }

    private onScreenResize() {
        // 重新计算游戏尺寸和遮罩
        this.initializeGameSize();
    }
} 