import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { Enemy } from './Enemy';
const { ccclass, property } = _decorator;

// 定义敌人类型的接口
interface EnemyType {
    prefab: Prefab;
    spawnRate: number;  // 生成频率（秒）
    hp: number;         // 生命值
    speed: number;      // 移动速度
    damageOnEscape: number;  // 逃脱时造成的伤害
}

@ccclass('EnemyManager')
export class EnemyManager extends Component {
    @property(Prefab)
    public enemy1Prefab: Prefab = null;

    @property(Prefab)
    public enemy2Prefab: Prefab = null;

    @property(Prefab)
    public enemyBoss1Prefab: Prefab = null;

    @property
    private initialSpawnRate: number = 2.0;

    @property
    private minSpawnRate: number = 0.3;  // 添加最小生成间隔属性

    @property
    private spawnRateDecrease: number = 0.2;  // 添加生成间隔减少量属性

    @property
    private speedUpInterval: number = 10.0;  // 添加加速间隔属性

    private currentSpawnRate: number = 2.0;
    private enemyTypes: { [key: string]: EnemyType } = {};
    private enemies: Node[] = [];
    private spawnCallback: Function = null;
    private isSpawningPaused: boolean = false;

    // 新增属性
    private pinyinCount: number = 0;
    private isBossAlive: boolean = false;
    private hasSpawnedBossThisPhase: boolean = false;
    private enemy2Unlocked: boolean = false;

    start() {
        this.currentSpawnRate = this.initialSpawnRate;
        this.initEnemyTypes();
        
        this.scheduleOnce(() => {
            this.startSpawning();
            this.scheduleOnce(() => {
                this.schedule(this.increaseSpawnSpeed, this.speedUpInterval);
            }, 1);
        }, 0);
    }

    private initEnemyTypes() {
        this.enemyTypes['enemy1'] = {
            prefab: this.enemy1Prefab,
            spawnRate: this.currentSpawnRate,
            hp: 1,
            speed: 100,
            damageOnEscape: 1
        };

        this.enemyTypes['enemy2'] = {
            prefab: this.enemy2Prefab,
            spawnRate: this.currentSpawnRate * 1.5,
            hp: 5,
            speed: 80,
            damageOnEscape: 5
        };

        this.enemyTypes['enemyBoss1'] = {
            prefab: this.enemyBoss1Prefab,
            spawnRate: 0,
            hp: 20,
            speed: 50,
            damageOnEscape: 20
        };
    }

    // 更新拼音计数
    public updatePinyinCount() {
        this.pinyinCount++;
        console.log(`Pinyin count: ${this.pinyinCount}`);
        
        // 检查是否解锁enemy2
        if (this.pinyinCount >= 5 && !this.enemy2Unlocked) {
            this.enemy2Unlocked = true;
            console.log("Enemy2 unlocked!");
        }
    }

    private spawnEnemy(type: string) {
        const config = this.enemyTypes[type];
        if (!config || !config.prefab) {
            console.error(`Enemy type ${type} not found or prefab not set!`);
            return;
        }

        const enemy = instantiate(config.prefab);
        enemy.name = type;

        const randomX = (Math.random() * 500) - 250;
        enemy.setPosition(new Vec3(randomX, 395, 0));

        const enemyComp = enemy.getComponent(Enemy) || enemy.addComponent(Enemy);
        if (enemyComp) {
            enemyComp.moveSpeed = config.speed;
            enemyComp.hp = config.hp;
            enemyComp.damageOnEscape = config.damageOnEscape;
        }

        this.node.addChild(enemy);
        this.enemies.push(enemy);
    }

    private spawnRandomEnemy() {
        // 如果boss存活，只生成普通敌人
        if (this.isBossAlive) {
            this.spawnEnemy('enemy1');
            return;
        }

        // 检查是否应该生成boss
        if (this.pinyinCount >= 12 && !this.hasSpawnedBossThisPhase && !this.isBossAlive) {
            this.spawnEnemy('enemyBoss1');
            this.hasSpawnedBossThisPhase = true;
            return;
        }

        // 随机选择敌人类型
        if (this.enemy2Unlocked && Math.random() < 0.3) {  // 30%概率生成enemy2
            this.spawnEnemy('enemy2');
        } else {
            this.spawnEnemy('enemy1');
        }
    }

    private startSpawning() {
        if (this.spawnCallback) {
            this.unschedule(this.spawnCallback);
        }
        
        this.spawnCallback = this.spawnRandomEnemy.bind(this);
        this.schedule(this.spawnCallback, this.currentSpawnRate);
    }

    // 在每个新的敌人阶段开始时重置状态
    public resetPhase() {
        this.hasSpawnedBossThisPhase = false;
        console.log("Enemy phase reset");
    }

    private increaseSpawnSpeed() {
        // 如果已暂停，不执行加速
        if (this.isSpawningPaused) {
            return;
        }

        const oldRate = this.currentSpawnRate;
        // 取消当前的生成计时器
        this.unschedule(this.spawnCallback);
        
        // 减少生成间隔，但不低于最小值
        this.currentSpawnRate = Math.max(this.minSpawnRate, 
            this.currentSpawnRate - this.spawnRateDecrease);
        
        console.log("=== Spawn Rate Changed ===", {
            oldRate: oldRate,
            newRate: this.currentSpawnRate,
            decrease: this.spawnRateDecrease,
            minRate: this.minSpawnRate,
            time: new Date().toISOString()
        });

        // 使用新的间隔重新开始生成
        this.startSpawning();
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

    public setSpawnInterval(interval: number) {
        // 只在初始化时设置间隔
        if (this.currentSpawnRate === this.initialSpawnRate) {
            this.initialSpawnRate = interval;
            this.currentSpawnRate = interval;
            
            // 重新开始生成
            this.stopSpawning();
            this.startSpawning();
        }
    }

    // 暂停生成敌人
    public pauseSpawning() {
        console.log("=== Pausing Enemy Spawning ===", {
            time: new Date().toISOString(),
            activeEnemies: this.enemies.length,
            spawnCallback: !!this.spawnCallback,
            isSpawningPaused: this.isSpawningPaused
        });

        this.isSpawningPaused = true;  // 设置暂停标志

        // 取消所有定时器
        this.unscheduleAllCallbacks();
        
        // 清除回调引用
        this.spawnCallback = null;

        // 同时暂停加速计时器
        this.unschedule(this.increaseSpawnSpeed);
    }

    // 恢复生成敌人
    public resumeSpawning() {
        console.log("=== Resuming Enemy Spawning ===", {
            time: new Date().toISOString(),
            currentSpawnRate: this.currentSpawnRate,
            initialSpawnRate: this.initialSpawnRate,
            isSpawningPaused: this.isSpawningPaused
        });

        this.isSpawningPaused = false;  // 清除暂停标志
        
        // 重新开始生成
        this.startSpawning();
        
        // 重新开始加速计时器
        this.schedule(this.increaseSpawnSpeed, this.speedUpInterval);
    }

    // 获取指定类型敌人的移动速度
    public getEnemySpeed(type: string = 'enemy1'): number {
        const config = this.enemyTypes[type];
        if (config) {
            return config.speed;
        }
        console.warn(`Enemy type ${type} not found, returning default speed`);
        return 50; // 默认速度
    }
} 