import { _decorator, Component, Node, Label, Color, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FeedbackEffect')
export class FeedbackEffect extends Component {
    @property(Label)
    private xLabel: Label = null;  // X标签组件

    private originalScale: Vec3 = new Vec3(1, 1, 1);
    private originalColor: Color = new Color(255, 0, 0, 255);  // 红色

    start() {
        // 初始化时隐藏X
        if (this.xLabel) {
            this.xLabel.string = "X";  // 设置文本为X
            this.xLabel.fontSize = 500;  // 设置较大的字号
            this.xLabel.color = this.originalColor;  // 设置为红色
            this.originalScale = this.xLabel.node.scale.clone();
            this.xLabel.node.active = false;  // 默认隐藏
        }
    }

    // 显示错误反馈
    public showWrongFeedback() {
        if (!this.xLabel) return;

        // 重置状态
        this.xLabel.node.active = true;
        this.xLabel.node.scale = this.originalScale.clone();
        this.xLabel.color = this.originalColor.clone();

        // 第一次闪烁
        this.flashOnce(() => {
            // 短暂延迟后进行第二次闪烁
            this.scheduleOnce(() => {
                this.flashOnce(() => {
                    // 完成后隐藏
                    this.xLabel.node.active = false;
                });
            }, 0.2);  // 两次闪烁之间的延迟
        });
    }

    private flashOnce(callback?: Function) {
        // 设置初始状态
        this.xLabel.node.scale = this.originalScale.clone();
        this.xLabel.color = this.originalColor.clone();

        // 创建缩放和淡出动画
        tween(this.xLabel.node)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })  // 放大
            .to(0.1, { scale: new Vec3(1.0, 1.0, 1.0) })  // 恢复原始大小
            .start();

        // 同时进行颜色淡出
        tween(this.xLabel.color)
            .to(0.2, { a: 0 })  // 淡出
            .call(() => {
                if (callback) callback();
            })
            .start();
    }
} 