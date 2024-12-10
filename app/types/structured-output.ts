import { z } from 'zod';

export const ScoreLevel = z.enum(['1', '2', '3']);

export const EvaluationCategory = z.object({
    name: z.string(),
    subcategories: z.array(z.object({
        name: z.string(),
        description: z.object({
            high: z.string(),
            medium: z.string(),
            low: z.string()
        })
    }))
});

export const EvaluationResult = z.object({
    categories: z.array(z.object({
        name: z.string(),
        subcategories: z.array(z.object({
            name: z.string(),
            score: ScoreLevel,
            comment: z.string().optional()
        }))
    })),
    totalScore: z.number(),
    rank: z.string(),
    highlights: z.object({
        strengths: z.array(z.string()),
        improvements: z.array(z.string()),
        nextGoals: z.array(z.string())
    })
});

export type ScoreLevelType = z.infer<typeof ScoreLevel>;
export type EvaluationCategoryType = z.infer<typeof EvaluationCategory>;
export type EvaluationResultType = z.infer<typeof EvaluationResult>;

export interface StructuredAnalysisOutput {
    evaluation: EvaluationResultType;
    metadata?: {
        confidence: number;
        processingTime: number;
    };
}
