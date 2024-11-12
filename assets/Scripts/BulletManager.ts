import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, Color, Sprite, BoxCollider2D, Contact2DType, Collider2D, PhysicsSystem2D, EPhysics2DDrawFlags } from 'cc';
import { ShootingGame } from './ShootingGame';
const { ccclass, property } = _decorator;

@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    public bulletPrefab: Prefab = null;

    @property
    public bulletSpeed: number = 500;

    private bulletPool: Node[] = [];
    private readonly poolSize: number = 20;

    start() {
        console.log("BulletManager starting...");
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb | 
            EPhysics2DDrawFlags.Pair | 
            EPhysics2DDrawFlags.CenterOfMass | 
            EPhysics2DDrawFlags.Joint | 
            EPhysics2DDrawFlags.Shape;
        
        // 注册全局碰撞回调函数
        if (PhysicsSystem2D.instance) {
            PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            PhysicsSystem2D.instance.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
        
        this.initBulletPool();
    }

    private initBulletPool() {
        if (!this.bulletPrefab) {
            console.error("Bullet prefab not assigned!");
            return;
        }

        for (let i = 0; i < this.poolSize; i++) {
            const bullet = instantiate(this.bulletPrefab);
            bullet.name = 'Bullet';

            // 添加碰撞器
            const collider = bullet.getComponent(BoxCollider2D) || bullet.addComponent(BoxCollider2D);
            if (collider) {
                collider.enabled = true;
                collider.sensor = true;
                
                // 设置碰撞体大小
                collider.size.width = 20;
                collider.size.height = 20;
                collider.offset.x = 0;
                collider.offset.y = 0;
                
                // 设置碰撞组
                collider.group = 1;
                collider.category = 0x0001;  // 第1类
                collider.mask = 0x0002;      // 可以与第2类碰撞
                
                collider.apply();

                // 注册碰撞回调
                collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
                collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
            }

            bullet.active = false;
            this.bulletPool.push(bullet);
            this.node.addChild(bullet);
        }
        console.log(`Initialized ${this.bulletPool.length} bullets with colliders`);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体开始接触时被调用一次
        console.log('Bullet collision begin:', selfCollider.node.name, otherCollider.node.name);
        
        if (otherCollider.node.name === 'Enemy') {
            // 通知 ShootingGame 销毁敌人
            const shootingGame = this.node.parent?.getComponent(ShootingGame);
            if (shootingGame) {
                shootingGame.destroyEnemy(otherCollider.node);
                // 回收子弹
                this.recycleBullet(selfCollider.node);
            }
        }
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体结束接触时被调用一次
        console.log('Bullet collision end:', selfCollider.node.name, otherCollider.node.name);
    }

    public createBullet(position: Vec3): Node {
        let bullet = this.bulletPool.find(b => !b.active);
        if (!bullet) {
            bullet = instantiate(this.bulletPrefab);
            this.bulletPool.push(bullet);
            this.node.addChild(bullet);
        }

        bullet.setPosition(new Vec3(position.x, position.y, 0));
        bullet.active = true;
        
        // 确保碰撞器在激活时被更新
        const collider = bullet.getComponent(BoxCollider2D);
        if (collider) {
            collider.enabled = true;
            collider.apply();
        }
        
        return bullet;
    }

    public recycleBullet(bullet: Node) {
        if (bullet && bullet.active) {
            bullet.active = false;
            console.log("Bullet recycled");
        }
    }

    update(deltaTime: number) {
        for (const bullet of this.bulletPool) {
            if (bullet.active) {
                const newPos = bullet.position.clone();
                newPos.y += this.bulletSpeed * deltaTime;

                if (newPos.y > 600) {
                    // console.log("Bullet recycled at position:", newPos);
                    this.recycleBullet(bullet);
                } else {
                    bullet.setPosition(newPos);
                    // 更新碰撞器
                    const collider = bullet.getComponent(BoxCollider2D);
                    if (collider) {
                        collider.apply();
                    }
                }
            }
        }
    }
} 