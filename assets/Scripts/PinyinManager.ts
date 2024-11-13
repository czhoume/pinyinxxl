import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { Pinyin } from './Pinyin';
import { ShootingProblem } from './ShootingProblem';
import { EnemyManager } from './EnemyManager';
const { ccclass, property } = _decorator;

@ccclass('PinyinManager')
export class PinyinManager extends Component {
    @property(Prefab)
    public pinyinPrefab: Prefab = null;

    @property(EnemyManager)
    private enemyManager: EnemyManager = null;

    @property
    private spawnInterval: number = 5.0;  // 生成间隔（秒）

    private activePinyins: Node[] = [];

    start() {
        this.schedule(this.spawnPinyin, this.spawnInterval);
    }

    private spawnPinyin() {
        if (!this.pinyinPrefab) {
            console.error("Pinyin prefab not assigned!");
            return;
        }

        // 暂停敌人生成
        if (this.enemyManager) {
            this.enemyManager.pauseSpawning();
        }

        // 获取随机题目
        const problem = ShootingProblem.getRandomProblem();
        
        // 创建拼音节点
        const pinyinNode = instantiate(this.pinyinPrefab);
        pinyinNode.name = 'Pinyin';
        pinyinNode.setPosition(new Vec3(0, 395, 0));

        // 设置题目内容
        const pinyinComp = pinyinNode.getComponent(Pinyin);
        if (pinyinComp) {
            pinyinComp.setProblem(
                problem.character,
                problem.pinyins,
                problem.correctIndex
            );

            // 监听拼音销毁事件
            pinyinNode.once(Node.EventType.NODE_DESTROYED, () => {
                // 拼音被销毁时恢复敌人生成
                if (this.enemyManager) {
                    this.enemyManager.resumeSpawning();
                }
            });
        }

        // 添加到场景和数组
        this.node.addChild(pinyinNode);
        this.activePinyins.push(pinyinNode);
    }

    update(deltaTime: number) {
        // 清理已销毁的拼音节点
        this.activePinyins = this.activePinyins.filter(pinyin => 
            pinyin && pinyin.isValid);
    }

    // 停止生成拼音
    public stopSpawning() {
        this.unscheduleAllCallbacks();
    }

    // 清除所有拼音
    public clearAllPinyins() {
        this.activePinyins.forEach(pinyin => {
            if (pinyin && pinyin.isValid) {
                pinyin.destroy();
            }
        });
        this.activePinyins = [];
    }
} 