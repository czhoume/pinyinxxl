import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { Enemy } from './Enemy';
const { ccclass, property } = _decorator;

// 定义敌人类型的接口
interface EnemyType {
    prefab: Prefab;
    spawnRate: number;  // 生成频率（秒）
    hp: number;         // 生命值
    speed: number;      // 移动速度
}

@ccclass('EnemyManager')
export class EnemyManager extends Component {
    @property(Prefab)
    public enemy1Prefab: Prefab = null;

    @property
    private initialSpawnRate: number = 2.0;  // 初始生成间隔（秒）
    
    @property
    private minSpawnRate: number = 0.3;      // 最小生成间隔（秒）
    
    @property
    private spawnRateDecrease: number = 0.2; // 每次加速减少的间隔（秒）
    
    @property
    private speedUpInterval: number = 10;     // 加速间隔（秒）

    private currentSpawnRate: number = 2.0;   // 当前生成间隔
    private enemyTypes: { [key: string]: EnemyType } = {};
    private enemies: Node[] = [];

    start() {
        this.currentSpawnRate = this.initialSpawnRate;
        this.initEnemyTypes();
        this.startSpawning();
        
        // 开始定时加速
        this.schedule(this.increaseSpawnSpeed, this.speedUpInterval);
    }

    private initEnemyTypes() {
        this.enemyTypes['enemy1'] = {
            prefab: this.enemy1Prefab,
            spawnRate: this.currentSpawnRate,
            hp: 1,
            speed: 100
        };
    }

    private startSpawning() {
        // 开始生成敌人
        this.schedule(this.spawnEnemy.bind(this, 'enemy1'), this.currentSpawnRate);
    }

    private increaseSpawnSpeed() {
        // 取消当前的生成计时器
        this.unschedule(this.spawnEnemy.bind(this, 'enemy1'));
        
        // 减少生成间隔，但不低于最小值
        this.currentSpawnRate = Math.max(this.minSpawnRate, 
            this.currentSpawnRate - this.spawnRateDecrease);
        
        // 更新敌人类型配置
        this.enemyTypes['enemy1'].spawnRate = this.currentSpawnRate;
        
        // 使用新的间隔重新开始生成
        this.startSpawning();
    }

    private spawnEnemy(type: string) {
        const config = this.enemyTypes[type];
        if (!config || !config.prefab) {
            console.error(`Enemy type ${type} not found or prefab not set!`);
            return;
        }

        // 实例化敌人
        const enemy = instantiate(config.prefab);
        enemy.name = type;

        // 设置随机位置（在屏幕顶部）
        const randomX = (Math.random() * 500) - 250; // -250 到 250 之间的随机值
        enemy.setPosition(new Vec3(randomX, 395, 0));

        // 添加并配置 Enemy 组件
        const enemyComp = enemy.getComponent(Enemy) || enemy.addComponent(Enemy);
        if (enemyComp) {
            enemyComp.moveSpeed = config.speed;
            enemyComp.hp = config.hp;
        }

        // 添加到场景和数组
        this.node.addChild(enemy);
        this.enemies.push(enemy);
    }

    update(deltaTime: number) {
        // 清理已销毁的敌人
        this.enemies = this.enemies.filter(enemy => enemy && enemy.isValid);
    }

    // 获取当前存活的敌人数量
    public getEnemyCount(): number {
        return this.enemies.length;
    }

    // 停止生成敌人
    public stopSpawning() {
        this.unscheduleAllCallbacks();
    }

    // 清除所有敌人
    public clearAllEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy && enemy.isValid) {
                enemy.destroy();
            }
        });
        this.enemies = [];
    }

    public resetSpawnRate() {
        this.currentSpawnRate = this.initialSpawnRate;
        this.stopSpawning();
        this.startSpawning();
    }

    // 暂停生成敌人
    public pauseSpawning() {
        this.unschedule(this.spawnEnemy.bind(this, 'enemy1'));
    }

    // 恢复生成敌人
    public resumeSpawning() {
        this.startSpawning();
    }
} 