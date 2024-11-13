import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

// 定义子弹类型的接口
interface BulletType {
    prefab: Prefab;
    spawnRate: number;  // 生成频率（秒）
    speed: number;      // 移动速度
    damage: number;     // 伤害值
    simultaneousShots: number; // 同时发射的子弹数量
}

@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    public bullet1Prefab: Prefab = null;

    // 子弹类型配置
    private bulletTypes: { [key: string]: BulletType } = {};
    private activeBullets: Node[] = [];
    private currentBulletType: string = 'a1';  // 默认使用 a1 类型子弹

    start() {
        // 初始化子弹类型配置
        this.initBulletTypes();
    }

    private initBulletTypes() {
        // 配置基础子弹
        this.bulletTypes['a1'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.5,  // 每0.5秒发射一次
            speed: 500,
            damage: 1,
            simultaneousShots: 1
        };

        // 添加更多子弹类型
        this.bulletTypes['a2'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.4,
            speed: 600,
            damage: 1.5,
            simultaneousShots: 1
        };

        this.bulletTypes['a3'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.3,
            speed: 700,
            damage: 2,
            simultaneousShots: 2
        };

        this.bulletTypes['a4'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.25,
            speed: 800,
            damage: 2.5,
            simultaneousShots: 2
        };

        this.bulletTypes['a5'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.2,
            speed: 900,
            damage: 3,
            simultaneousShots: 3
        };

        this.bulletTypes['a6'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.15,
            speed: 1000,
            damage: 3.5,
            simultaneousShots: 3
        };
    }

    // 设置当前子弹类型
    public setBulletType(type: string) {
        if (this.bulletTypes[type]) {
            this.currentBulletType = type;
            console.log(`Bullet type changed to: ${type}`);
        } else {
            console.error(`Invalid bullet type: ${type}`);
        }
    }

    // 获取当前子弹类型
    public getCurrentBulletType(): string {
        return this.currentBulletType;
    }

    // 升级子弹类型
    public upgradeBulletType() {
        const types = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
        const currentIndex = types.indexOf(this.currentBulletType);
        if (currentIndex < types.length - 1) {
            this.setBulletType(types[currentIndex + 1]);
        }
    }

    // 降级子弹类型
    public downgradeBulletType() {
        const types = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
        const currentIndex = types.indexOf(this.currentBulletType);
        if (currentIndex > 0) {
            this.setBulletType(types[currentIndex - 1]);
        }
    }

    public createBullet(type: string, position?: Vec3): Node[] {
        const config = this.bulletTypes[type];
        if (!config || !config.prefab) {
            console.error(`Bullet type ${type} not found or prefab not set!`);
            return [];
        }

        const bullets: Node[] = [];
        for (let i = 0; i < config.simultaneousShots; i++) {
            // 创建子弹
            const bullet = instantiate(config.prefab);
            bullet.name = 'Bullet';

            // 设置位置
            if (position) {
                const offset = (i - (config.simultaneousShots - 1) / 2) * 10; // Example offset
                bullet.setPosition(position.x + offset, position.y, position.z);
            }

            // 添加到场景和管理数组
            this.node.addChild(bullet);
            this.activeBullets.push(bullet);
            bullets.push(bullet);
        }

        return bullets;
    }

    public recycleBullet(bullet: Node) {
        if (bullet && bullet.isValid) {
            const index = this.activeBullets.indexOf(bullet);
            if (index !== -1) {
                this.activeBullets.splice(index, 1);
            }
            
            // 延迟销毁
            this.scheduleOnce(() => {
                if (bullet.isValid) {
                    bullet.destroy();
                }
            }, 0);
        }
    }

    update(deltaTime: number) {
        // 更新所有活动子弹
        for (let i = this.activeBullets.length - 1; i >= 0; i--) {
            const bullet = this.activeBullets[i];
            if (!bullet || !bullet.isValid) {
                this.activeBullets.splice(i, 1);
                continue;
            }

            const newPos = bullet.position.clone();
            const bulletType = this.bulletTypes[this.currentBulletType];  // 使用当前子弹类型
            newPos.y += bulletType.speed * deltaTime;

            if (newPos.y > 600) {
                this.recycleBullet(bullet);
            } else {
                bullet.setPosition(newPos);
            }
        }
    }
} 