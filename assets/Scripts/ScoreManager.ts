import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScoreManager')
export class ScoreManager extends Component {
    @property(Node)
    private scoreLabelNode: Node;

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
        if (!this.scoreLabelNode) {
            console.log('scoreLabelNode is not assigned!');
            return;
        }

        const label = this.scoreLabelNode.getComponent(Label);
        if (!label) {
            console.log('Label component not found on scoreLabelNode!');
            return;
        }

        const newLabelString = `Score: ${this.score}`;
        label.string = newLabelString;
    }
}