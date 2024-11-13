import { _decorator, Component, Node, Prefab, instantiate, Vec3, Label, BoxCollider2D, UITransform, Color } from 'cc';
import { Pinyin } from './Pinyin';
import { ShootingProblem, PinyinProblem } from './ShootingProblem';
const { ccclass, property } = _decorator;

@ccclass('PinyinManager')
export class PinyinManager extends Component {
    @property(Prefab)
    public pinyinPrefab: Prefab = null;  // 整体预制体

    @property(Prefab)
    public optionPrefab: Prefab = null;  // 选项预制体

    @property
    private spawnInterval: number = 5.0;  // 生成间隔（秒）

    @property
    private backgroundWidth: number = 640;  // 背景宽度

    @property
    private optionsOffset: number = -80;    // 选项与汉字的垂直距离

    @property
    private optionWidth: number = 100;  // 添加选项宽度属性

    private activePinyins: Node[] = [];

    start() {
        this.schedule(this.spawnPinyin, this.spawnInterval);
    }

    private spawnPinyin() {
        if (!this.pinyinPrefab || !this.optionPrefab) {
            console.error("Prefabs not assigned!");
            return;
        }

        // 获取随机题目
        const problem = ShootingProblem.getRandomProblem();
        
        // 创建拼音节点
        const pinyinNode = instantiate(this.pinyinPrefab);
        pinyinNode.name = 'Pinyin';

        // 设置位置在屏幕顶部中央
        pinyinNode.setPosition(new Vec3(0, 395, 0));

        // 获取 Pinyin 组件
        const pinyinComp = pinyinNode.getComponent(Pinyin) || pinyinNode.addComponent(Pinyin);
        if (pinyinComp) {
            // 设置汉字
            const characterLabel = pinyinNode.getChildByName('Character')?.getChildByName('Label')?.getComponent(Label);
            if (characterLabel) {
                characterLabel.string = problem.character;
                console.log(`Setting character text to: ${problem.character}`);
                pinyinComp.characterLabel = characterLabel;
            } else {
                console.error("Character Label component not found");
            }

            // 清空现有的选项标签数组
            pinyinComp.pinyinLabels = [];

            // 创建选项容器
            const optionsNode = pinyinNode.getChildByName('Options');
            if (optionsNode) {
                // 设置选项容器的垂直偏移
                optionsNode.setPosition(new Vec3(0, this.optionsOffset, 0));

                // 获取当前题目的选项数量
                const numOptions = problem.pinyins.length;
                
                // 计算选项占用的总宽度
                const totalOptionsWidth = numOptions * this.optionWidth;
                
                // 计算剩余可用空间
                const remainingSpace = this.backgroundWidth * 0.98 - totalOptionsWidth;
                
                // 计算间距（剩余空间除以间隙数量）
                const spacing = remainingSpace / (numOptions + 1);
                
                // 计算起始位置（最左边的选项位置）
                const startX = -this.backgroundWidth * 0.98 / 2 + spacing;

                // 创建每个选项
                problem.pinyins.forEach((pinyin, index) => {
                    const optionNode = instantiate(this.optionPrefab);
                    optionNode.name = `Option${index}`;
                    
                    // 设置选项位置（考虑选项宽度）
                    const xPos = startX + spacing * index + this.optionWidth * index + this.optionWidth / 2;
                    optionNode.setPosition(new Vec3(xPos, 0, 0));

                    // 设置拼音文本
                    const label = optionNode.getChildByName('Label')?.getComponent(Label);
                    if (label) {
                        label.string = pinyin;
                        console.log(`Setting label text to: ${pinyin}`);
                        pinyinComp.pinyinLabels.push(label);
                    } else {
                        console.error(`Label component not found for option ${index}`);
                    }

                    // 添加碰撞器
                    const collider = optionNode.getComponent(BoxCollider2D);
                    if (collider) {
                        collider.enabled = true;
                        collider.sensor = true;
                        collider.size.width = this.optionWidth;
                        collider.size.height = this.optionWidth;
                        collider.apply();
                    }

                    optionsNode.addChild(optionNode);
                });
            }

            pinyinComp.setProblem(problem.character, problem.pinyins, problem.correctIndex);
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