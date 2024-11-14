import { _decorator, Component, Node, BoxCollider2D, RigidBody2D, ERigidBody2DType, Contact2DType, Collider2D, Sprite, Color, Vec2 } from 'cc';
import { BulletManager } from './BulletManager';
import { PlayerHealth } from './PlayerHealth';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    @property
    public moveSpeed: number = 50;

    @property
    public hp: number = 1;

    @property
    public damageOnEscape: number = 1;  // 逃脱时造成的伤害

    private rigidBody: RigidBody2D = null;
    private collider: BoxCollider2D = null;
    private playerHealth: PlayerHealth = null;

    start() {
        // 获取 PlayerHealth 组件引用
        const gameNode = this.node.parent?.parent;  // 假设在 ShootingGame 节点下
        if (gameNode) {
            this.playerHealth = gameNode.getComponent(PlayerHealth);
        }

        // 添加碰撞器
        this.collider = this.getComponent(BoxCollider2D);
        if (this.collider) {

            // 注册碰撞回调
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        console.log('Enemy collision with:', otherCollider.node.name);
        
        if (otherCollider.node.name === 'Bullet') {
            // 被子弹击中
            this.hp--;
            
            // 回收子弹
            const bulletManager = otherCollider.node.parent?.getComponent(BulletManager);
            if (bulletManager) {
                bulletManager.recycleBullet(otherCollider.node);
            }
            
            // 如果生命值为0，销毁自己
            if (this.hp <= 0) {
                
                // 延迟销毁节点
                this.scheduleOnce(() => {
                    if (this.node.isValid) {
                        this.node.destroy();
                    }
                }, 0);
            }
        }
    }

    update(deltaTime: number) {
        // 检查是否超出屏幕底部
        const currentPos = this.node.position;
        this.node.setPosition(currentPos.x, currentPos.y - this.moveSpeed * deltaTime, currentPos.z);
        
        if (currentPos.y < -500) {
            // 对玩家造成伤害
            if (this.playerHealth) {
                this.playerHealth.takeDamage(this.damageOnEscape);
            }

            if (this.collider) {
                this.collider.enabled = false;
            }
            
            // 延迟销毁节点
            this.scheduleOnce(() => {
                if (this.node.isValid) {
                    this.node.destroy();
                }
            }, 0);
        }
    }
} 