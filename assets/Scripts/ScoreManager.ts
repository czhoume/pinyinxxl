import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScoreManager')
export class ScoreManager extends Component {
    @property(Node)
    private scoreLabelNode!: Node;

    private score: number = 0;

    onLoad() {
        this.updateScoreLabel();
    }

    public addScore(points: number) {
        this.score += points;
        this.updateScoreLabel();
    }

    public resetScore() {
        this.score = 0;
        this.updateScoreLabel();
    }

    private updateScoreLabel() {
        const label = this.scoreLabelNode.getComponent(Label);
        if (label) {
            label.string = `Score: ${this.score}`;
            console.log(label.string)
        }
    }
}