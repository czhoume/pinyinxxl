import { _decorator, Component, Node, Button, EventHandler } from 'cc';
import { Globals } from './Globals';
import { ContentControl } from './ContentControl';
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

    @property
    private currentLevel: number = 1;

    @property({ type: Globals })
    private globals: Globals | null = null;

    private currentGameIndex: number = 0;

    onLoad() {
        // Try to find Globals in different ways
        if (!this.globals) {
            this.globals = this.node.getComponent(Globals);
        }
        if (!this.globals) {
            this.globals = this.node.parent?.getComponent(Globals);
        }
        if (!this.globals) {
            this.globals = this.node.scene.getComponentInChildren(Globals);
        }
        
        if (!this.globals) {
            console.error("Globals component not found anywhere!");
            return;
        } else {
            console.log("Found Globals component with levels:", this.globals.levels.length);
        }
    }

    start() {
        // Set up button click handlers
        this.switchButtons.forEach((button, index) => {
            if (button) {
                const eventHandler = new EventHandler();
                eventHandler.target = this.node;
                eventHandler.component = "GameSwitch";
                eventHandler.handler = "switchToGame";
                eventHandler.customEventData = index.toString();
                
                button.clickEvents = [];
                button.clickEvents.push(eventHandler);
            }
        });

        this.showCurrentGame();
    }

    public advanceToNextLevel() {
        console.log("=== DEBUG: advanceToNextLevel ===");
        console.log("1. Method called");
        
        if (!this.globals) {
            console.log("2A. Globals is null, trying to find it");
            this.globals = this.node.scene.getComponentInChildren(Globals);
        } else {
            console.log("2B. Globals exists");
        }
        
        console.log("3. Globals status:", {
            exists: !!this.globals,
            hasLevels: !!(this.globals?.levels),
            levelsLength: this.globals?.levels?.length
        });
        
        if (!this.globals || !this.globals.levels) {
            console.error("4A. ERROR: Globals or levels is null!", {
                globals: this.globals,
                levels: this.globals?.levels
            });
            return;
        }
        
        console.log("4B. Current state:", {
            currentLevel: this.currentLevel,
            totalLevels: this.globals.levels.length,
            node: this.node.name,
            scene: this.node.scene.name
        });
        
        if (this.currentLevel < this.globals.levels.length) {
            this.currentLevel++;
            console.log("5. Advancing to level:", this.currentLevel);
            
            const contentControl = this.getComponentInChildren(ContentControl);
            console.log("6. ContentControl search result:", {
                found: !!contentControl,
                path: contentControl ? this.getNodePath(contentControl.node) : 'not found'
            });

            if (contentControl) {
                console.log("7A. Setting up new level");
                contentControl.level_num = this.currentLevel;
                contentControl.start();
            } else {
                console.log("7B. Trying alternative ContentControl search");
                const foundContentControl = this.node.scene.getComponentInChildren(ContentControl);
                console.log("7C. Alternative search result:", {
                    found: !!foundContentControl,
                    path: foundContentControl ? this.getNodePath(foundContentControl.node) : 'not found'
                });
                if (foundContentControl) {
                    foundContentControl.level_num = this.currentLevel;
                    foundContentControl.start();
                }
            }
        } else {
            console.log("5. Game completed");
        }
    }

    private showCurrentGame() {
        this.gameScenes.forEach((scene, index) => {
            scene.active = (index === this.currentGameIndex);
        });
    }

    public switchToGame(event: Event, customEventData: string) {
        const index = parseInt(customEventData);
        if (index >= 0 && index < this.gameScenes.length) {
            this.currentGameIndex = index;
            this.showCurrentGame();
        }
    }

    // Helper method to get node path
    private getNodePath(node: Node): string {
        let path = node.name;
        let current = node;
        while (current.parent) {
            current = current.parent;
            path = current.name + '/' + path;
        }
        return path;
    }
}

