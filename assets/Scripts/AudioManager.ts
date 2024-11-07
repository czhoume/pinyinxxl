// Scripts/AudioManager.ts
import { _decorator, Component, resources, AudioClip, AudioSource } from 'cc';

const { ccclass, property } = _decorator;

interface SoundData {
    name: string;
    clip: AudioClip | null;
}

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property({ type: String })
    public soundFolder = 'resources/sounds'; // 音效文件夹路径

    private sounds: Map<string, SoundData> = new Map();
    private audioSource: AudioSource | null = null;

    onLoad() {
        // 确保有 AudioSource 组件
        this.audioSource = this.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.addComponent(AudioSource);
        }
        
        // 加载音频文件
        this.loadSounds();
    }

    listSounds() {
        if (this.sounds.size === 0) {
            console.warn('No sounds found in the folder.');
        } else {
            for (const [name, soundData] of this.sounds.entries()) {
                console.log(`Sound: ${name}`);
            }
        }
    }

    async loadSounds() {
        try {
            console.log('Starting to load sounds from:', this.soundFolder);
            const assets = await new Promise<AudioClip[]>((resolve, reject) => {
                resources.loadDir(this.soundFolder, AudioClip, (err, assets) => {
                    if (err) {
                        console.error('Error loading sounds:', err);
                        reject(err);
                        return;
                    }
                    resolve(assets as AudioClip[]);
                });
            });
            
            // 检查加载的资源
            if (!Array.isArray(assets) || assets.length === 0) {
                return;
            }
            
            // 将加载的音频文件存储到 Map 中
            for (const asset of assets) {
                if (asset instanceof AudioClip) {
                    const soundData: SoundData = {
                        name: asset.name,
                        clip: asset
                    };
                    this.sounds.set(asset.name, soundData);
                }
            }
        } catch (error) {
            console.error('Failed to load sounds:', error);
            console.error('Please ensure:');
            console.error('1. Your audio files are in assets/resources/sounds/');
            console.error('2. Files are properly imported in Cocos Creator');
            console.error('3. Project has been rebuilt after adding new files');
        }
    }

    playSound(soundName: string) {
        const soundNameWithNumber = this.convertToNumberedPinyin(soundName);
        const soundData = this.sounds.get(soundNameWithNumber);
        
        if (soundData && soundData.clip && this.audioSource) {
            this.audioSource.playOneShot(soundData.clip, 1);
        } else {
            console.error(`Sound not found: ${soundNameWithNumber}`);
        }
    }

    playBackgroundMusic(musicName: string, loop: boolean = true) {
        const soundData = this.sounds.get(musicName);
        if (soundData && soundData.clip && this.audioSource) {
            this.audioSource.stop();
            this.audioSource.clip = soundData.clip;
            this.audioSource.loop = loop;
            this.audioSource.play();
            this.audioSource.volume = 1;
        } else {
            console.error(`Music not found: ${musicName}`);
        }
    }

    stopBackgroundMusic() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
    }

    private convertToNumberedPinyin(pinyin: string): string {
        const toneMarks = {
            'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
            'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
            'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
            'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
            'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
            'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4'
        };
    
        for (const [toned, numbered] of Object.entries(toneMarks)) {
            if (pinyin.includes(toned)) {
                const basePinyin = pinyin.replace(toned, numbered[0]);
                const toneNumber = numbered.slice(-1);
                return basePinyin + toneNumber;
            }
        }
    
        return pinyin;
    }
}