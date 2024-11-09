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
            },
            {
                characters: [
                    ['mā', '妈'], ['mā', '马'],  // first tone
                    ['má', '麻'], ['má', '蚂'],  // second tone
                    ['mǎ', '码'], ['mǎ', '马'],  // third tone
                ]
            },
            {
                characters: [
                    ['shǒu', '手'], ['shǒu', '首'],  // third tone
                    ['shōu', '收'], ['shōu', '熟'],  // first tone
                    ['shòu', '受'], ['shòu', '寿'],  // fourth tone
                ]
            },
            {
                characters: [
                    ['zǔ', '组'], ['zǔ', '祖'],  // third tone
                    ['zú', '足'], ['zú', '族'],  // second tone
                    ['zū', '租'], ['zū', '诅'],  // first tone
                ]
            },
            {
                characters: [
                    ['kǒu', '口'], ['kǒu', '扣'],  // third tone
                    ['kòu', '寇'], ['kòu', '扣'],  // fourth tone
                    ['kōu', '抠'], ['kōu', '口'],  // first tone
                ]
            },
            {
                characters: [
                    ['dá', '达'], ['dá', '搭'],  // second tone
                    ['dǎ', '打'], ['dǎ', '大'],  // third tone
                    ['dà', '大'], ['dà', '答'],  // fourth tone
                ]
            },
            {
                characters: [
                    ['yī', '一'], ['yī', '医'],  // first tone
                    ['yí', '姨'], ['yí', '移'],  // second tone
                    ['yì', '意'], ['yì', '易'],  // fourth tone
                ]
            },
            {
                characters: [
                    ['xué', '学'], ['xué', '雪'],  // second tone
                    ['xuě', '雪'], ['xuě', '靴'],  // third tone
                    ['xuè', '血'], ['xuè', '学'],  // fourth tone
                ]
            },
            {
                characters: [
                    ['shān', '山'], ['shān', '善'],  // first tone
                    ['shàn', '扇'], ['shàn', '闪'],  // fourth tone
                    ['shǎn', '闪'], ['shǎn', '善'],  // third tone
                ]
            },
            {
                characters: [
                    ['mén', '门'], ['mén', '闷'],  // second tone
                    ['mèn', '闷'], ['mèn', '焖'],  // fourth tone
                    ['mēn', '焖'], ['mēn', '门'],  // first tone
                ]
            },
            {
                characters: [
                    ['jiā', '家'], ['jiā', '加'],  // first tone
                    ['jiǎ', '假'], ['jiǎ', '嫁'],  // third tone
                    ['jià', '价'], ['jià', '架'],  // fourth tone
                ]
            }
        ] as Level[];
    }
}