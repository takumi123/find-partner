import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { 
    EvaluationResult,
    EvaluationResultType,
    StructuredAnalysisOutput 
} from '@/app/types/structured-output';
import { zodFunction } from 'openai/helpers/zod';

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function processAnalysis(analysisId: string, evaluationText: string) {
    const startTime = Date.now();

    const completion = await client.beta.chat.completions.parse({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [
            { 
                role: 'system', 
                content: `あなたは面談評価データを構造化するアシスタントです。
評価テキストを受け取り、以下の基準で構造化してください：
- 各カテゴリー（1.相手の話への傾聴と反応、2.自己開示のバランス、3.コミュニケーションスタイル、4.会話の展開力、5.価値観の共有）の各項目を1-3点で評価
- 合計点数を計算（45点満点）
- 評価ランクを判定（39-45点：非常に良好、31-38点：基本的に問題なし、30点以下：改善が必要）
- 特に良かった点、改善点、次回への課題を抽出

評価項目の詳細：
1. 相手の話への傾聴と反応
- フォローアップ質問（3:深い理解を示す質問、2:基本的な質問、1:質問が少ない/的外れ）
- 話の遮り（3:全く遮らない、2:1-2回の軽い遮り、1:頻繁な遮り）
- 共感表現（3:適切な相槌と共感的な反応、2:基本的な相槌、1:相槌が少ない/不適切）

2. 自己開示のバランス
- 自慢話のコントロール（3:適度な自己アピール、2:時々自慢が目立つ、1:過度な自慢が多い）
- 個人情報の共有（3:適度な深さで自然、2:やや表面的/深すぎる、1:極端な共有）
- ポジネガ（3:良好なバランス、2:やや偏りあり、1:極端な偏り）

3. コミュニケーションスタイル
- 敬語・友好性（3:適切なバランス、2:やや硬い/砕けすぎ、1:極端に不適切）
- 声のトーン・表情（3:終始柔らかく好印象、2:時々硬くなる、1:終始不適切）
- オンライン姿勢・目線（3:適切な距離感と目線、2:時々不自然、1:著しく不適切）

4. 会話の展開力
- 話題転換（3:自然な展開、2:時々唐突、1:不自然が多い）
- 話題の深掘り（3:適切な深掘りと展開、2:やや表面的、1:深掘り不足）
- 沈黙の扱い（3:適切な対応、2:やや焦りあり、1:不適切な対応）

5. 価値観の共有
- 将来展望の議論（3:具体的で建設的、2:基本的な話のみ、1:表面的）
- 価値観の理解（3:深い相互理解、2:基本的な理解、1:理解不足）
- 結婚生活イメージ共有（3:具体的なイメージ共有、2:基本的な共有のみ、1:共有不足）` 
            },
            { 
                role: 'user', 
                content: evaluationText 
            }
        ],
        tools: [zodFunction({ name: 'evaluation', parameters: EvaluationResult })],
    });

    const processingTime = Date.now() - startTime;
    
    const evaluationResult = completion.choices[0].message.tool_calls?.[0]?.function.parsed_arguments as EvaluationResultType;
    
    if (!evaluationResult) {
        throw new Error('Failed to parse evaluation result');
    }

    const structuredOutput: StructuredAnalysisOutput = {
        evaluation: evaluationResult,
        metadata: {
            confidence: 0.95,
            processingTime
        }
    };

    // 分析結果を保存
    await prisma.analysis.update({
        where: { id: analysisId },
        data: {
            analysisResults: JSON.stringify({
                evaluationText,
                structuredOutput
            }),
            aiResponses: JSON.stringify(structuredOutput),
            status: 'completed'
        }
    });

    return structuredOutput;
}

export async function GET() {
    try {
        // aiResponsesがnullの全レコードを取得
        const pendingAnalyses = await prisma.analysis.findMany({
            where: {
                aiResponses: {
                    equals: null
                },
                analysisResults: {
                    not: {
                        equals: null
                    }
                }
            }
        });

        if (pendingAnalyses.length === 0) {
            return NextResponse.json({ 
                message: '処理対象のレコードが見つかりませんでした',
                processedCount: 0 
            });
        }

        const results = [];
        const errors = [];

        // 各分析を順次処理
        for (const analysis of pendingAnalyses) {
            try {
                if (!analysis.analysisResults) continue;

                const analysisResults = typeof analysis.analysisResults === 'string' 
                    ? JSON.parse(analysis.analysisResults)
                    : analysis.analysisResults;

                // geminiAnalysisをevaluationTextとして使用
                const evaluationText = analysisResults.geminiAnalysis || analysisResults.evaluationText;
                
                if (!evaluationText) {
                    errors.push({
                        analysisId: analysis.id,
                        error: 'No evaluation text found in analysisResults (checked both geminiAnalysis and evaluationText)'
                    });
                    continue;
                }

                const result = await processAnalysis(analysis.id, evaluationText);
                results.push({
                    analysisId: analysis.id,
                    result
                });
            } catch (error) {
                errors.push({
                    analysisId: analysis.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: results.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Structured output batch processing error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
