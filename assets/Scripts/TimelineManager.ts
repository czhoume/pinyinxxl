import { _decorator, Component, instantiate, Node, UITransform } from 'cc';
import { EnemyManager } from './EnemyManager';
import { PinyinManager } from './PinyinManager';
const { ccclass, property } = _decorator;

@ccclass('TimelineManager')
export class TimelineManager extends Component {
    @property(EnemyManager)
    private enemyManager: EnemyManager = null;

    @property(PinyinManager)
    private pinyinManager: PinyinManager = null;

    @property
    private enemyPhaseTime: number = 12.0;  // 敌人生成阶段时长改为12秒

    @property
    private speedUpInterval: number = 10.0;  // 加速间隔（秒）

    @property
    private initialSpawnRate: number = 2.0;  // 初始生成间隔

    @property
    private minSpawnRate: number = 0.3;      // 最小生成间隔

    @property
    private spawnRateDecrease: number = 0.2; // 每次加速减少的间隔

    private isEnemyPhase: boolean = true;
    private timeInPhase: number = 0;
    private screenHeight: number = 960;
    private currentSpawnRate: number = 2.0;

    start() {
        if (!this.enemyManager || !this.pinyinManager) {
            console.error("EnemyManager or PinyinManager not assigned!");
            return;
        }

        // 获取屏幕高度
        const canvas = this.node.parent;
        if (canvas) {
            const transform = canvas.getComponent(UITransform);
            if (transform) {
                this.screenHeight = transform.height;
            }
        }

        console.log("TimelineManager starting...");

        // 设置初始生成速率
        this.currentSpawnRate = this.initialSpawnRate;
        if (this.enemyManager) {
            this.enemyManager.setSpawnInterval(this.currentSpawnRate);
        }

        // 开始定时加速
        this.schedule(this.increaseSpawnSpeed, this.speedUpInterval);

        // 开始第一个敌人阶段
        this.startEnemyPhase();
    }

    private increaseSpawnSpeed() {
        // 只在敌人阶段时执行加速
        if (!this.isEnemyPhase) return;

        this.currentSpawnRate = Math.max(this.minSpawnRate, 
            this.currentSpawnRate - this.spawnRateDecrease);
        
        console.log(`Increasing enemy spawn speed: ${this.currentSpawnRate}s`);

        if (this.enemyManager) {
            this.enemyManager.setSpawnInterval(this.currentSpawnRate);
        }
    }

    private startEnemyPhase() {
        console.log(`Starting Enemy Phase at: ${new Date().toISOString()}`);
        this.isEnemyPhase = true;
        this.timeInPhase = 0;

        // 重置敌人生成状态
        if (this.enemyManager) {
            this.enemyManager.resetPhase();
            this.enemyManager.resumeSpawning();
        }
    }

    private startPinyinPhase() {
        console.log("Starting Pinyin Phase");
        this.isEnemyPhase = false;
        this.timeInPhase = 0;  // 重置时间
        
        // 立即停止敌人生成
        if (this.enemyManager) {
            this.enemyManager.pauseSpawning();

            // 获取敌人移动速度计算清屏时间
            const enemySpeed = this.enemyManager.getEnemySpeed('enemy1');
            const clearScreenTime = (this.screenHeight * 0.3) / enemySpeed;
            
            const startTime = Date.now();  // 记录开始时间
            console.log(`Starting pinyin phase at: ${new Date().toISOString()}`);
            console.log(`Waiting ${clearScreenTime}s for enemies to clear before spawning pinyin`);

            // 等待清屏时间后生成拼音
            this.scheduleOnce(() => {
                console.log("Spawning pinyin...");
                if (this.pinyinManager) {
                    this.pinyinManager.spawnPinyin();

                    // 等待第二个清屏时间后开始新的敌人阶段
                    this.scheduleOnce(() => {
                        const totalTime = (Date.now() - startTime) / 1000;
                        console.log(`Pinyin phase total time: ${totalTime.toFixed(2)}s`);
                        this.startEnemyPhase();
                    }, clearScreenTime);
                }
            }, clearScreenTime);
        }

        // 更新拼音计数
        if (this.enemyManager) {
            this.enemyManager.updatePinyinCount();
        }
    }

    update(deltaTime: number) {
        this.timeInPhase += deltaTime;

        if (this.isEnemyPhase) {

            // 敌人阶段持续15秒
            if (this.timeInPhase >= this.enemyPhaseTime) {
                console.log(`Enemy phase ending after ${this.timeInPhase.toFixed(2)}s`);
                this.startPinyinPhase();
            }
        }
    }
} 