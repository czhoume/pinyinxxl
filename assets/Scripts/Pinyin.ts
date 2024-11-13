import { _decorator, Component, Node, Label, BoxCollider2D, Prefab, instantiate, Vec3, UITransform } from 'cc';
const { ccclass, property } = _decorator;

// 定义选项接口
interface PinyinOption {
    node: Node;
    label: Label;
    isCorrect: boolean;
}

@ccclass('Pinyin')
export class Pinyin extends Component {
    @property(Label)
    public characterLabel: Label = null;  // 显示汉字

    @property(Prefab)
    public optionPrefab: Prefab = null;  // 选项预制体

    @property
    public moveSpeed: number = 100;       // 下落速度

    @property
    private optionWidth: number = 100;    // 选项宽度

    @property
    private optionsOffset: number = 120;  // 选项与汉字的垂直距离

    private options: PinyinOption[] = [];  // 存储选项信息
    private backgroundWidth: number = 640; // 背景宽度

    // 设置题目内容并生成选项
    public setProblem(character: string, pinyins: string[], correctIndex: number) {
        // 设置汉字
        const characterNode = this.node.getChildByName('Character');
        if (characterNode) {
            const characterLabel = characterNode.getChildByName('Label')?.getComponent(Label);
            if (characterLabel) {
                characterLabel.string = character;
            } else {
                console.error("Character Label component not found");
            }
        } else {
            console.error("Character node not found");
        }

        // 创建选项容器
        const optionsNode = this.node.getChildByName('Options');
        if (optionsNode) {
            // 设置选项容器的垂直偏移
            optionsNode.setPosition(new Vec3(0, this.optionsOffset, 0));

            // 计算选项布局
            const numOptions = pinyins.length;
            const totalOptionsWidth = numOptions * this.optionWidth;
            const remainingSpace = this.backgroundWidth * 0.98 - totalOptionsWidth;
            const spacing = remainingSpace / (numOptions + 1);
            const startX = -this.backgroundWidth * 0.98 / 2 + spacing;

            // 创建选项
            pinyins.forEach((pinyin, index) => {
                this.createOption(optionsNode, pinyin, index === correctIndex, {
                    index,
                    startX,
                    spacing
                });
            });
        }
    }

    private createOption(parent: Node, pinyin: string, isCorrect: boolean, layout: {
        index: number,
        startX: number,
        spacing: number
    }) {
        if (!this.optionPrefab) {
            console.error("Option prefab not assigned!");
            return;
        }

        const optionNode = instantiate(this.optionPrefab);
        optionNode.name = `Option${layout.index}`;

        // 设置位置
        const xPos = layout.startX + layout.spacing * layout.index + 
                    this.optionWidth * layout.index + this.optionWidth / 2;
        optionNode.setPosition(new Vec3(xPos, 0, 0));

        // 设置拼音文本
        const label = optionNode.getChildByName('Label')?.getComponent(Label);
        if (label) {
            label.string = pinyin;
            this.options.push({
                node: optionNode,
                label: label,
                isCorrect: isCorrect
            });
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

        parent.addChild(optionNode);
    }

    // 检查选项是否正确
    public isOptionCorrect(optionNode: Node): boolean {
        const option = this.options.find(opt => opt.node === optionNode);
        return option ? option.isCorrect : false;
    }

    update(deltaTime: number) {
        // 向下移动
        const currentPos = this.node.position;
        this.node.setPosition(currentPos.x, currentPos.y - this.moveSpeed * deltaTime, currentPos.z);

        // 超出屏幕底部时销毁
        if (currentPos.y < -500) {
            this.scheduleOnce(() => {
                if (this.node.isValid) {
                    this.node.destroy();
                }
            }, 0);
        }
    }
} 