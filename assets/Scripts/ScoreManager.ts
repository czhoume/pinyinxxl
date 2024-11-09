import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScoreManager')
export class ScoreManager extends Component {
    @property(Node)
    private scoreLabelNode: Node | null = null;

    private score: number = 0;

    onLoad() {
        if (!this.scoreLabelNode) {
            console.error("Score label node not assigned!");
        }
        this.updateScoreLabel();
    }

    public addScore(value: number) {
        this.score += value;
        this.updateScoreLabel();
    }

    public getScore(): number {
        return this.score;
    }

    public resetScore() {
        this.score = 0;
        this.updateScoreLabel();
    }

    private updateScoreLabel() {
        if (!this.scoreLabelNode) {
            console.error("Score label node is null!");
            return;
        }

        const label = this.scoreLabelNode.getComponent(Label);
        if (!label) {
            console.error("Label component not found on scoreLabelNode!");
            return;
        }

        label.string = `Score: ${this.score}`;
        console.log("Updated score display:", this.score);
    }
}