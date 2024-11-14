import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { Pinyin } from './Pinyin';
import { ShootingProblem } from './ShootingProblem';
import { EnemyManager } from './EnemyManager';
const { ccclass, property } = _decorator;

@ccclass('PinyinManager')
export class PinyinManager extends Component {
    @property(Prefab)
    public pinyinPrefab: Prefab = null;

    private activePinyins: Node[] = [];

    // 生成单个拼音题目
    public spawnPinyin() {
        if (!this.pinyinPrefab) {
            console.error("Pinyin prefab not assigned!");
            return;
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
        }

        // 添加到场景和数组
        this.node.addChild(pinyinNode);
        this.activePinyins.push(pinyinNode);
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

    update(deltaTime: number) {
        // 清理已销毁的拼音节点
        this.activePinyins = this.activePinyins.filter(pinyin => 
            pinyin && pinyin.isValid);
    }

    // 获取拼音移动速度
    public getPinyinSpeed(): number {
        // 创建一个临时的拼音节点来获取速度
        const tempPinyin = instantiate(this.pinyinPrefab);
        const pinyinComp = tempPinyin.getComponent(Pinyin);
        const speed = pinyinComp ? pinyinComp.moveSpeed : 100;
        tempPinyin.destroy();
        return speed;
    }

    // 获取当前活跃的拼音节点
    public getActivePinyins(): Node[] {
        // 清理并返回有效的拼音节点
        this.activePinyins = this.activePinyins.filter(pinyin => 
            pinyin && pinyin.isValid);
        return this.activePinyins;
    }
} 