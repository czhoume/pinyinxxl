import { _decorator } from 'cc';
const { ccclass } = _decorator;

// 定义拼音题目接口
export interface PinyinProblem {
    character: string;      // 汉字
    pinyins: string[];     // 拼音选项
    correctIndex: number;   // 正确答案索引
}

@ccclass('ShootingProblem')
export class ShootingProblem {
    // 定义基础题目数据
    private static readonly baseProblems = [
        {
            character: "马",
            correctPinyin: "mǎ",
            wrongPinyins: ["mí", "mù", "mā"]
        },
        {
            character: "鸟",
            correctPinyin: "niǎo",
            wrongPinyins: ["náo", "niū", "niù"]
        },
        {
            character: "羊",
            correctPinyin: "yáng",
            wrongPinyins: ["yīng", "yǒng", "yàng"]
        },
        {
            character: "鱼",
            correctPinyin: "yú",
            wrongPinyins: ["yī", "yè", "yǔ"]
        },
        {
            character: "狗",
            correctPinyin: "gǒu",
            wrongPinyins: ["gū", "guī", "gòu"]
        },
        {
            character: "猫",
            correctPinyin: "māo",
            wrongPinyins: ["méi", "móu", "mǎo"]
        },
        {
            character: "日",
            correctPinyin: "rì",
            wrongPinyins: ["rī", "rǐ", "rí"]
        },
        {
            character: "二",
            correctPinyin: "èr",
            wrongPinyins: ["ěr", "ér", "ēr"]
        },
        {
            character: "后",
            correctPinyin: "hòu",
            wrongPinyins: ["ho", "hōu", "hǒu"]
        },
        {
            character: "过",
            correctPinyin: "guò",
            wrongPinyins: ["gò", "gòu", "guǒ"]
        },
        {
            character: "爱",
            correctPinyin: "ài",
            wrongPinyins: ["āi", "ǎi", "aī"]
        },
        {
            character: "惜",
            correctPinyin: "xī",
            wrongPinyins: ["xí", "xǐ", "xì"]
        },
        {
            character: "净",
            correctPinyin: "jìng",
            wrongPinyins: ["jīng", "jǐng", "jíng"]
        },
        {
            character: "领",
            correctPinyin: "lǐng",
            wrongPinyins: ["líng", "lǐn", "līng"]
        },
        {
            character: "卷",
            correctPinyin: "juǎn",
            wrongPinyins: ["juān", "juán", "juàn"]
        },
        {
            character: "袖",
            correctPinyin: "xiù",
            wrongPinyins: ["xiou", "xiū", "xiǔ"]
        },
        {
            character: "光",
            correctPinyin: "guāng",
            wrongPinyins: ["gang", "guǎng", "guáng"]
        },
        {
            character: "令",
            correctPinyin: "lìng",
            wrongPinyins: ["lin", "líng", "lǐng"]
        },
        {
            character: "以",
            correctPinyin: "yǐ",
            wrongPinyins: ["yí", "yī", "yì"]
        },
        {
            character: "锅",
            correctPinyin: "guō",
            wrongPinyins: ["guou", "guǒ", "guò"]
        },
        {
            character: "有",
            correctPinyin: "yǒu",
            wrongPinyins: ["yóu", "yōu", "yòu"]
        },
        {
            character: "口",
            correctPinyin: "kǒu",
            wrongPinyins: ["kóu", "kōu", "kòu"]
        },
        {
            character: "多",
            correctPinyin: "duō",
            wrongPinyins: ["do", "duó", "duǒ"]
        },
        {
            character: "琴",
            correctPinyin: "qín",
            wrongPinyins: ["qing", "qǐn", "qīn"]
        },
        {
            character: "品",
            correctPinyin: "pǐn",
            wrongPinyins: ["pīn", "pín", "pìn"]
        },
        {
            character: "徐",
            correctPinyin: "xú",
            wrongPinyins: ["xǔ", "xū", "xù"]
        },
        {
            character: "引",
            correctPinyin: "yǐn",
            wrongPinyins: ["yíng", "yīn", "yìn"]
        },
        {
            character: "秀",
            correctPinyin: "xiù",
            wrongPinyins: ["xiou", "xiū", "xiǔ"]
        }
    ];

    // 获取随机题目
    public static getRandomProblem(): PinyinProblem {
        const baseProb = this.baseProblems[Math.floor(Math.random() * this.baseProblems.length)];
        
        // 随机选择2-3个错误答案
        const numWrongAnswers = Math.floor(Math.random() * 2) + 2; // 2-3个错误答案
        const shuffledWrong = this.shuffleArray([...baseProb.wrongPinyins]);
        const selectedWrong = shuffledWrong.slice(0, numWrongAnswers);
        
        // 创建所有选项数组（包含正确答案）
        const allPinyins = [baseProb.correctPinyin, ...selectedWrong];
        
        // 随机打乱所有选项
        const shuffledPinyins = this.shuffleArray(allPinyins);
        
        // 找出正确答案的索引
        const correctIndex = shuffledPinyins.indexOf(baseProb.correctPinyin);

        return {
            character: baseProb.character,
            pinyins: shuffledPinyins,
            correctIndex: correctIndex
        };
    }

    // Fisher-Yates 洗牌算法
    private static shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // 获取指定难度的题目
    public static getProblemsByDifficulty(difficulty: number): PinyinProblem[] {
        // 根据难度调整错误答案的数量
        return this.baseProblems.map(baseProb => {
            const numWrongAnswers = Math.min(difficulty + 1, baseProb.wrongPinyins.length);
            const selectedWrong = this.shuffleArray([...baseProb.wrongPinyins]).slice(0, numWrongAnswers);
            const allPinyins = [baseProb.correctPinyin, ...selectedWrong];
            const shuffledPinyins = this.shuffleArray(allPinyins);
            
            return {
                character: baseProb.character,
                pinyins: shuffledPinyins,
                correctIndex: shuffledPinyins.indexOf(baseProb.correctPinyin)
            };
        });
    }

    // 验证答案
    public static checkAnswer(problem: PinyinProblem, selectedIndex: number): boolean {
        return selectedIndex === problem.correctIndex;
    }
} 