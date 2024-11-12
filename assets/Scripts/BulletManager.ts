import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

// 定义子弹类型的接口
interface BulletType {
    prefab: Prefab;
    spawnRate: number;  // 生成频率（秒）
    speed: number;      // 移动速度
    damage: number;     // 伤害值
}

@ccclass('BulletManager')
export class BulletManager extends Component {
    @property(Prefab)
    public bullet1Prefab: Prefab = null;

    // 子弹类型配置
    private bulletTypes: { [key: string]: BulletType } = {};
    private activeBullets: Node[] = [];

    start() {
        // 初始化子弹类型配置
        this.initBulletTypes();
    }

    private initBulletTypes() {
        // 配置基础子弹
        this.bulletTypes['bullet1'] = {
            prefab: this.bullet1Prefab,
            spawnRate: 0.5,  // 每0.5秒发射一次
            speed: 500,
            damage: 1
        };
    }

    public createBullet(type: string, position?: Vec3): Node {
        const config = this.bulletTypes[type];
        if (!config || !config.prefab) {
            console.error(`Bullet type ${type} not found or prefab not set!`);
            return null;
        }

        // 创建子弹
        const bullet = instantiate(config.prefab);
        bullet.name = 'Bullet';

        // 设置位置
        if (position) {
            bullet.setPosition(position);
        }

        // 添加到场景和管理数组
        this.node.addChild(bullet);
        this.activeBullets.push(bullet);

        return bullet;
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
            const bulletType = this.bulletTypes['bullet1'];
            newPos.y += bulletType.speed * deltaTime;

            if (newPos.y > 600) {
                this.recycleBullet(bullet);
            } else {
                bullet.setPosition(newPos);
            }
        }
    }
} 