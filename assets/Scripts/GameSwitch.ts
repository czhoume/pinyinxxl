import { _decorator, Component, Node, Button, EventHandler } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameSwitch')
export class GameSwitch extends Component {
    @property({
        type: [Node],
        tooltip: 'Array of game scene root nodes'
    })
    private gameScenes: Node[] = [];

    @property({
        type: [Button],
        tooltip: 'Array of switch buttons'
    })
    private switchButtons: Button[] = [];

    private currentGameIndex: number = 0;

    start() {
        // Set up button click handlers programmatically
        this.switchButtons.forEach((button, index) => {
            if (button) {
                const eventHandler = new EventHandler();
                eventHandler.target = this.node;
                eventHandler.component = "GameSwitch";
                eventHandler.handler = "switchToGame";
                eventHandler._componentName = "GameSwitch";
                eventHandler.customEventData = index.toString();
                
                button.clickEvents = [];
                button.clickEvents.push(eventHandler);
                console.log(`Switch button ${index} handler added`);
            } else {
                console.warn(`Switch button ${index} not assigned!`);
            }
        });

        // Debug logs
        console.log("Number of game scenes:", this.gameScenes.length);
        console.log("Current game index:", this.currentGameIndex);
        
        this.showCurrentGame();
    }

    private showCurrentGame() {
        console.log("Showing game at index:", this.currentGameIndex);
        // Hide all games first
        this.gameScenes.forEach((scene, index) => {
            const isActive = index === this.currentGameIndex;
            scene.active = isActive;
            console.log(`Game ${index}: ${scene.name} - Active: ${isActive}`);
        });
    }

    public switchToGame(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        if (index >= 0 && index < this.gameScenes.length) {
            const oldIndex = this.currentGameIndex;
            this.currentGameIndex = index;
            console.log(`Switching from game ${oldIndex} to ${index}`);
            this.showCurrentGame();
        }
    }
}

