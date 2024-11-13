import { _decorator, Component, Node, Label, BoxCollider2D, Color, Sprite, Contact2DType, Collider2D } from 'cc';
import { PinyinManager } from './PinyinManager';
const { ccclass, property } = _decorator;

@ccclass('Pinyin')
export class Pinyin extends Component {
    @property(Label)
    public characterLabel: Label = null;  // 显示汉字

    @property([Label])
    public pinyinLabels: Label[] = [];    // 拼音选项标签

    @property
    public moveSpeed: number = 100;       // 下落速度

    private correctPinyinIndex: number = 0;  // 正确拼音的索引

    // 设置题目内容
    public setProblem(character: string, pinyins: string[], correctIndex: number) {
        // 设置汉字
        if (this.characterLabel) {
            this.characterLabel.string = character;
        }

        this.correctPinyinIndex = correctIndex;
        
        // 设置拼音选项
        pinyins.forEach((pinyin, index) => {
            if (this.pinyinLabels[index]) {
                this.pinyinLabels[index].string = pinyin;
            }
        });
    }

    // 检查是否是正确的拼音选项
    public isCorrectPinyin(optionIndex: number): boolean {
        return optionIndex === this.correctPinyinIndex;
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