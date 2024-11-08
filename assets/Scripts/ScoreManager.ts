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
        console.log(`Before addscore, scoreLabelNode:`, this.scoreLabelNode);
        console.log(`Before addscore, label:`, this.scoreLabelNode ? this.scoreLabelNode.getComponent(Label) : 'No node');
        this.score += points;
        this.updateScoreLabel();
        console.log('triggered add score, current score: ', this.score);
    }

    public resetScore() {
        this.score = 0;
        this.updateScoreLabel();
    }

    private updateScoreLabel() {
        console.log(`Before updateScoreLabel, scoreLabelNode:`, this.scoreLabelNode);
        console.log(`Before updateScoreLabel, label:`, this.scoreLabelNode ? this.scoreLabelNode.getComponent(Label) : 'No node');
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
        console.log('Updated label string to:', newLabelString);
    }
}