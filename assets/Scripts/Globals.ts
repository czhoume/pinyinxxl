// Scripts/Globals.ts
import { _decorator, Component } from 'cc';
import { Level } from './Level';

const { ccclass, property } = _decorator;

@ccclass('Globals')
export class Globals extends Component {
    @property({
        type: Array, // 使用内置的 Array 类型
        tooltip: 'Levels data'
    })
    public levels: any[] = []; // 在 TypeScript 中添加类型注释

    onLoad() {
        // 初始化一些示例数据
        this.levels = [
            {
                characters: 
                [
                    ['yī','一'], ['yī', '衣'], ['yī', '医'],
                    ['shān','山'], ['shān', '山'], ['shān', 'sān'],
                    ['rén','人'], ['rén', '仁'],
                    ['mù','目'], ['mù', '木'], ['mù', '牧'],
                    ['tiān','天'], ['tiān', '添'], 
                    ['dì','第'], ['dì', '地'], ['dì', '弟'],

                ]

                // stars: [1,2,3],
            },
            {
                characters: 
                [
                    ['yī','一'], ['yī', '衣'], ['yī', '医'],
                    ['yuè','乐'], ['yuè', '月'],['yuè', '粤'],
                    ['tiān','天'], ['tiān', '添'],
                    ['mù','目'], ['mù', '木'], 
                    ['tián','田'], ['tián', '甜'],['tián', '填'], 
                    ['dì','第'], ['dì', '地'], ['dì', '弟'],

                ]
            },
            {
                characters: [['七', 'qī'], ['八', 'bā'], ['九', 'jiǔ']]
                // stars: [1,2,3],
            }
        ] as Level[];
    }
}