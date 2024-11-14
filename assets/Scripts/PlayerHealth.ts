import { _decorator, Component, Node, Label, Color, UIOpacity, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerHealth')
export class PlayerHealth extends Component {
    @property(Label)
    private healthLabel: Label = null;  // 显示血量的标签

    @property(Node)
    private damageOverlay: Node = null;  // 红色遮罩节点

    @property
    private maxHealth: number = 100;     // 最大血量

    private currentHealth: number = 100;  // 当前血量
    private overlayOpacity: UIOpacity = null;

    start() {
        this.currentHealth = this.maxHealth;
        this.updateHealthDisplay();

        // 获取或添加 UIOpacity 组件
        if (this.damageOverlay) {
            this.overlayOpacity = this.damageOverlay.getComponent(UIOpacity) || 
                                 this.damageOverlay.addComponent(UIOpacity);
            this.overlayOpacity.opacity = 0;  // 初始时完全透明
        }
    }

    // 更新血量显示
    private updateHealthDisplay() {
        if (this.healthLabel) {
            this.healthLabel.string = `HP: ${Math.max(0, this.currentHealth)}`;
        }
    }

    // 受到伤害
    public takeDamage(amount: number) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthDisplay();
        this.showDamageEffect();

        // 检查死亡
        if (this.currentHealth <= 0) {
            this.onPlayerDeath();
        }
    }

    // 显示受伤效果
    private showDamageEffect() {
        if (!this.damageOverlay || !this.overlayOpacity) return;

        // 停止之前的动画
        tween(this.overlayOpacity).stop();

        // 设置初始透明度
        this.overlayOpacity.opacity = 100;  // 红色遮罩的最大透明度

        // 创建淡出动画
        tween(this.overlayOpacity)
            .to(0.3, { opacity: 0 })  // 0.3秒内淡出
            .start();
    }

    // 玩家死亡处理
    private onPlayerDeath() {
        // 可以在这里添加游戏结束逻辑
        console.log("Player died!");
    }

    // 获取当前血量
    public getCurrentHealth(): number {
        return this.currentHealth;
    }

    // 恢复血量
    public heal(amount: number) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        this.updateHealthDisplay();
    }
} 