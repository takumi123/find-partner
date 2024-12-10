'use client';

import { useState } from 'react';
import { StructuredAnalysisOutput } from '../../types/structured-output';

interface StructuredAnalysisProps {
    analysisId: string;
    geminiResult: string;
}

interface StructuredResponse {
    success: boolean;
    structuredOutput: StructuredAnalysisOutput;
}

export default function StructuredAnalysis({ analysisId, geminiResult }: StructuredAnalysisProps) {
    const [structuredOutput, setStructuredOutput] = useState<StructuredAnalysisOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStructuredAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/analytics/structured-output', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    analysisId,
                    geminiResult,
                }),
            });

            if (!response.ok) {
                throw new Error('分析に失敗しました');
            }

            const data: StructuredResponse = await response.json();
            setStructuredOutput(data.structuredOutput);
        } catch (err) {
            setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">構造化分析</h3>
                <button
                    onClick={handleStructuredAnalysis}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? '分析中...' : '構造化分析を実行'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {structuredOutput && (
                <div className="p-4 bg-gray-50 rounded-md">
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(structuredOutput, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
