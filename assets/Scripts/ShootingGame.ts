import { _decorator, Component, Node, Vec3, Touch, EventTouch, input, Input, Sprite, UITransform, Button, Prefab, instantiate, Color, Collider2D, Contact2DType, BoxCollider2D, PhysicsSystem2D, EPhysics2DDrawFlags, Vec2, Rect, IPhysics2DContact, RigidBody2D, ERigidBody2DType } from 'cc';
import { BulletManager } from './BulletManager';
import { Enemy } from './Enemy';
import { EnemyManager } from './EnemyManager';
const { ccclass, property } = _decorator;

@ccclass('ShootingGame')
export class ShootingGame extends Component {
    @property(Sprite)
    private player: Sprite = null;

    @property(Node)
    private leftButton: Node = null;    // 左移动按钮

    @property(Node)
    private rightButton: Node = null;   // 右移动按钮

    @property
    private playerMoveSpeed: number = 500;  // 增加移动速度

    @property
    private playerXMin: number = -300;  // 扩大移动范围

    @property
    private playerXMax: number = 300;   // 扩大移动范围

    @property([Node])
    private backgrounds: Node[] = [];     // 修改为数组，存放两张背景

    @property
    private backgroundScrollSpeed: number = 300;  // 调整滚动速度

    @property(BulletManager)
    private bulletManager: BulletManager = null;

    @property(EnemyManager)
    private enemyManager: EnemyManager = null;

    private isMovingLeft: boolean = false;
    private isMovingRight: boolean = false;

    private enemies: Node[] = [];

    private isTouching: boolean = false;
    private touchStartX: number = 0;
    private playerStartX: number = 0;

    private selfBody: RigidBody2D = null;  // 自己的刚体组件

    start() {
        console.log("=== ShootingGame Start ===");
        


        if (this.player) {
            // 设置玩家的初始位置在屏幕底部偏上一点的位置
            this.player.node.setPosition(new Vec3(0, -200, 0));

            // 添加刚体
            const playerRigidBody = this.player.node.getComponent(RigidBody2D) || this.player.node.addComponent(RigidBody2D);
            playerRigidBody.type = ERigidBody2DType.Dynamic;
            playerRigidBody.allowSleep = false;
            playerRigidBody.gravityScale = 0;
            playerRigidBody.fixedRotation = true;
            playerRigidBody.enabledContactListener = true;

            // 添加碰撞器
            const playerCollider = this.player.node.getComponent(BoxCollider2D) || this.player.node.addComponent(BoxCollider2D);
            if (playerCollider) {
                playerCollider.enabled = true;
                playerCollider.sensor = true;
                playerCollider.size.width = 40;
                playerCollider.size.height = 40;
                
                // 修改碰撞组设置
                playerCollider.group = 1;      // 玩家组为1
                playerCollider.mask = 4;       // 只与组3碰撞
                
                playerCollider.apply();

                // 注册碰撞回调
                // playerCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }
        }

        // 设置按钮事件
        if (this.leftButton) {
            // 使用 Button 组件的点击事件
            const leftButtonComp = this.leftButton.getComponent(Button);
            if (leftButtonComp) {
                leftButtonComp.node.on(Node.EventType.TOUCH_START, this.onLeftButtonPressed, this);
                leftButtonComp.node.on(Node.EventType.TOUCH_END, this.onLeftButtonReleased, this);
                leftButtonComp.node.on(Node.EventType.TOUCH_CANCEL, this.onLeftButtonReleased, this);
            } else {
                console.error("Left button missing Button component!");
            }
        } else {
            console.error("Left button not assigned!");
        }

        if (this.rightButton) {
            const rightButtonComp = this.rightButton.getComponent(Button);
            if (rightButtonComp) {
                rightButtonComp.node.on(Node.EventType.TOUCH_START, this.onRightButtonPressed, this);
                rightButtonComp.node.on(Node.EventType.TOUCH_END, this.onRightButtonReleased, this);
                rightButtonComp.node.on(Node.EventType.TOUCH_CANCEL, this.onRightButtonReleased, this);
            } else {
                console.error("Right button missing Button component!");
            }
        } else {
            console.error("Right button not assigned!");
        }

        // 开始自动射击
        this.schedule(this.shoot, 0.5);

        // 初始化背景位置
        if (this.backgrounds.length >= 2) {
            // 确背景尺寸正确
            for (let bg of this.backgrounds) {
                const bgTransform = bg.getComponent(UITransform);
                if (bgTransform) {
                    // 根据您的戏分辨率调整这些值
                    bgTransform.width = 640;  
                    bgTransform.height = 960;
                }
            }

            // 设置两个背景的初始位置，确保它们紧密相连
            this.backgrounds[0].setPosition(0, 0, 0);
            this.backgrounds[1].setPosition(0, 960, 0); // 设置为第一张景的高度，确保无缝衔接
        }

        // 检查 EnemyManager
        if (!this.enemyManager) {
            console.error("EnemyManager not assigned!");
        }

        // 修改触摸事件监听设置
        
        // 直接在当前节点上监听触摸事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        // 保节点可以接收触摸件
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            this.node.addComponent(UITransform);
        }
        
        // 设置节点大小以确保可以接收触摸
        const transform = this.node.getComponent(UITransform);
        if (!transform) {
            this.node.addComponent(UITransform);
        }
        
        // 获取背景大小作为参考
        let bgWidth = 640;
        let bgHeight = 960;
        if (this.backgrounds.length > 0) {
            const bgTransform = this.backgrounds[0].getComponent(UITransform);
            if (bgTransform) {
                bgWidth = bgTransform.width;
                bgHeight = bgTransform.height;
            }
        }

        // 设置 ShootingGame 节点的大小与背景相同
        const gameTransform = this.node.getComponent(UITransform);
        if (gameTransform) {
            gameTransform.setContentSize(bgWidth, bgHeight);
            console.log("Set ShootingGame node size to match background:", {
                width: bgWidth,
                height: bgHeight
            });
        }

        // 确保背景尺寸正确
        if (this.backgrounds.length >= 2) {
            for (let bg of this.backgrounds) {
                const bgTransform = bg.getComponent(UITransform);
                if (bgTransform) {
                    bgTransform.width = bgWidth;
                    bgTransform.height = bgHeight;
                }
            }
        }

        // 根据背景宽度设置移动边界
        if (this.backgrounds.length > 0) {
            const bgTransform = this.backgrounds[0].getComponent(UITransform);
            if (bgTransform) {
                // 设置移动边界为背景宽度的一半（因为背景是居中的）
                const halfWidth = bgTransform.width / 2;
                // 留出玩家宽度的一半，这样玩家会超出边界
                const playerHalfWidth = this.player?.getComponent(UITransform)?.width / 2 || 20;
                
                // 设置移动边界，减去玩家宽度的一半使其能够完全贴边
                this.playerXMin = -halfWidth + playerHalfWidth;
                this.playerXMax = halfWidth - playerHalfWidth;
                
                console.log("Player movement bounds:", {
                    min: this.playerXMin,
                    max: this.playerXMax,
                    bgWidth: bgTransform.width,
                    playerWidth: playerHalfWidth * 2
                });
            }
        }

        // 启用物理系统
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.gravity = new Vec2(0, 0);

        // 获取碰撞器和刚体
        const holdCollider = this.player.node.getComponent(BoxCollider2D);
        if (!holdCollider) {
            const collider = this.player.node.addComponent(BoxCollider2D);
            collider.enabled = true;
            collider.sensor = true;
            collider.size.width = 40;
            collider.size.height = 40;
            // 移除碰撞组设置
            collider.apply();
        }

        // 获取刚体
        this.selfBody = this.player.node.getComponent(RigidBody2D);
        if (!this.selfBody) {
            this.selfBody = this.player.node.addComponent(RigidBody2D);
            this.selfBody.type = ERigidBody2DType.Dynamic;
            this.selfBody.allowSleep = false;
            this.selfBody.gravityScale = 0;
            this.selfBody.fixedRotation = true;
            this.selfBody.enabledContactListener = true;
        }

        // 注册碰撞回调
        // holdCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // holdCollider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    onDestroy() {
        // 清理按钮事件
        if (this.leftButton) {
            this.leftButton.off(Input.EventType.TOUCH_START, this.onLeftButtonPressed, this);
            this.leftButton.off(Input.EventType.TOUCH_END, this.onLeftButtonReleased, this);
            this.leftButton.off(Input.EventType.TOUCH_CANCEL, this.onLeftButtonReleased, this);
        }

        if (this.rightButton) {
            this.rightButton.off(Input.EventType.TOUCH_START, this.onRightButtonPressed, this);
            this.rightButton.off(Input.EventType.TOUCH_END, this.onRightButtonReleased, this);
            this.rightButton.off(Input.EventType.TOUCH_CANCEL, this.onRightButtonReleased, this);
        }

        // 确保从 Canvas 上移除事件听
        const canvas = this.node.parent;
        if (canvas) {
            canvas.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
            canvas.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            canvas.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            canvas.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
    }

    private onLeftButtonPressed() {
        this.isMovingLeft = true;
    }

    private onLeftButtonReleased() {
        this.isMovingLeft = false;
    }

    private onRightButtonPressed() {
        this.isMovingRight = true;
    }

    private onRightButtonReleased() {
        this.isMovingRight = false;
    }

    private shoot() {
        if (this.bulletManager && this.player) {
            const playerPos = this.player.node.position;
            
            // 修改子弹生成位置，在玩家上方一小段距离
            const bulletPos = new Vec3(
                playerPos.x,           // x 位置与玩家相同
                playerPos.y + 30,      // 在玩家上方 30 单位
                playerPos.z            // 保持与玩家同的 z 坐标
            );
            
            // 传入子弹类型和位置
            this.bulletManager.createBullet('bullet1', bulletPos);
        }
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
            
            // 迟一帧再销毁节点
            this.scheduleOnce(() => {
                if (enemyNode.isValid) {
                    enemyNode.destroy();
                }
            }, 0);
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        console.log('=== Player/Enemy Collision Begin ===');
        console.log('Collision detected on:', this.node.name);
        console.log('Self collider:', {
            name: selfCollider.node.name,
            parent: selfCollider.node.parent?.name,
            group: selfCollider.group,
            enabled: selfCollider.enabled
        });
        console.log('Other collider:', {
            name: otherCollider.node.name,
            parent: otherCollider.node.parent?.name,
            group: otherCollider.group,
            enabled: otherCollider.enabled
        });

        if (selfCollider.node.name === 'Player' && otherCollider.node.name === 'Enemy') {
            console.log('Player hit by enemy!');
            // TODO: 添加玩家被击中的逻辑
        }
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        console.log('=== Player/Enemy Collision End ===');
        console.log('End collision detected on:', this.node.name);
        console.log('Self collider:', {
            name: selfCollider.node.name,
            parent: selfCollider.node.parent?.name,
            group: selfCollider.group,
            enabled: selfCollider.enabled
        });
        console.log('Other collider:', {
            name: otherCollider.node.name,
            parent: otherCollider.node.parent?.name,
            group: otherCollider.group,
            enabled: otherCollider.enabled
        });
    }

    private onTouchStart(event: EventTouch) {
        
        // 检查触摸是否在按钮上
        const touchLocation = event.getLocation();
        if (this.isButtonTouch(touchLocation)) {
            return; // 如触摸在按钮上，不处理拖动
        }

        if (!this.player) {
            console.error("Player not found!");
            return;
        }

        this.isTouching = true;
        this.touchStartX = event.getLocationX();
        this.playerStartX = this.player.node.position.x;
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isTouching) return;

        const touchLocation = event.getLocation();
        if (this.isButtonTouch(touchLocation)) {
            return;
        }

        if (!this.player) return;

        const deltaX = event.getLocationX() - this.touchStartX;
        const newX = this.playerStartX + deltaX;
        const clampedX = Math.min(Math.max(newX, this.playerXMin), this.playerXMax);
        
        const currentPos = this.player.node.position;
        this.player.node.setPosition(new Vec3(clampedX, currentPos.y, currentPos.z));
    }

    private onTouchEnd() {
        this.isTouching = false;
    }

    // 检查触摸是否在按钮上
    private isButtonTouch(touchLocation: Vec2): boolean {
        if (this.leftButton) {
            const leftButtonRect = this.getNodeRect(this.leftButton);
            if (leftButtonRect.contains(touchLocation)) {
                return true;
            }
        }
        
        if (this.rightButton) {
            const rightButtonRect = this.getNodeRect(this.rightButton);
            if (rightButtonRect.contains(touchLocation)) {
                return true;
            }
        }
        
        return false;
    }

    // 获取节点的世界空间矩形
    private getNodeRect(node: Node): Rect {
        const uiTransform = node.getComponent(UITransform);
        if (!uiTransform) return null;

        const contentSize = uiTransform.contentSize;
        const worldPos = node.getWorldPosition();
        
        return new Rect(
            worldPos.x - contentSize.width / 2,
            worldPos.y - contentSize.height / 2,
            contentSize.width,
            contentSize.height
        );
    }

    update(deltaTime: number) {
        // 更新玩家位置（按钮控制）
        if (!this.isTouching) { // 只在没有触摸时处理按钮移动
            let moveDirection = 0;
            if (this.isMovingLeft) moveDirection -= 1;
            if (this.isMovingRight) moveDirection += 1;

            if (moveDirection !== 0 && this.player) {
                const currentX = this.player.node.position.x;
                const newX = currentX + moveDirection * this.playerMoveSpeed * deltaTime;
                const clampedX = Math.min(Math.max(newX, this.playerXMin), this.playerXMax);
                
                const currentPos = this.player.node.position;
                this.player.node.setPosition(new Vec3(clampedX, currentPos.y, currentPos.z));
            }
        }

        // 修改背景滚动逻辑
        if (this.backgrounds.length >= 2) {
            for (let i = 0; i < this.backgrounds.length; i++) {
                const bg = this.backgrounds[i];
                if (!bg || !bg.isValid) continue;  // 检查背景节点是否有效
                
                const bgTransform = bg.getComponent(UITransform);
                if (!bgTransform) continue;  // 检查 UITransform 是否存在
                
                const bgHeight = bgTransform.height;
                
                // 移动背景
                const newPos = bg.position.clone();
                newPos.y -= this.backgroundScrollSpeed * deltaTime;
                
                // 当背景完全移出屏幕底部时
                if (newPos.y <= -bgHeight) {
                    // 将其移动到另一个背景的上方
                    const otherBgIndex = (i + 1) % 2;
                    const otherBg = this.backgrounds[otherBgIndex];
                    if (otherBg && otherBg.isValid) {  // 检查另一个背景是否有效
                        const otherBgY = otherBg.position.y;
                        newPos.y = otherBgY + bgHeight;
                    }
                }
                
                bg.setPosition(newPos);
            }
        }

    }

    // 添加系统级的碰撞回调
    private onSystemContact(a: Collider2D, b: Collider2D, c: IPhysics2DContact | null) {
        console.log('System detected collision between:', {
            objectA: a.node.name,
            groupA: a.group,
            objectB: b.node.name,
            groupB: b.group
        });
    }
} 