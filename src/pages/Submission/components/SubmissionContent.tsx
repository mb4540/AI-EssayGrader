import VerbatimViewer from '@/components/VerbatimViewer';
import DraftComparison from '@/components/DraftComparison';
import type { Feedback } from '@/lib/schema';

interface SubmissionContentProps {
    draftMode: 'single' | 'comparison';
    verbatimText: string;
    sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image';
    onTextExtracted: (text: string, type: 'text' | 'docx' | 'pdf' | 'doc' | 'image', fileData?: string) => void;
    onTextEnhanced: (enhancedText: string) => void;
    storedImageUrl?: string;
    submissionId?: string;
    aiFeedback: Feedback | null;
    annotationsRefreshKey: number;

    // Comparison props
    roughDraftText: string;
    finalDraftText: string;
    roughDraftSourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image';
    finalDraftSourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image';
    setRoughDraftText: (text: string) => void;
    setFinalDraftText: (text: string) => void;
    onRoughDraftExtracted: (text: string, type: 'text' | 'docx' | 'pdf' | 'doc' | 'image', fileData?: string) => void;
    onFinalDraftExtracted: (text: string, type: 'text' | 'docx' | 'pdf' | 'doc' | 'image', fileData?: string) => void;
    onRoughDraftEnhanced: (enhancedText: string) => void;
    onFinalDraftEnhanced: (enhancedText: string) => void;
}

export function SubmissionContent({
    draftMode,
    verbatimText,
    sourceType,
    onTextExtracted,
    onTextEnhanced,
    storedImageUrl,
    submissionId,
    aiFeedback,
    annotationsRefreshKey,
    roughDraftText,
    finalDraftText,
    roughDraftSourceType,
    finalDraftSourceType,
    setRoughDraftText,
    setFinalDraftText,
    onRoughDraftExtracted,
    onFinalDraftExtracted,
    onRoughDraftEnhanced,
    onFinalDraftEnhanced
}: SubmissionContentProps) {
    return (
        <div className="mb-6">
            {draftMode === 'single' ? (
                <VerbatimViewer
                    text={verbatimText}
                    sourceType={sourceType}
                    onTextExtracted={onTextExtracted}
                    onTextEnhanced={onTextEnhanced}
                    imageUrl={storedImageUrl}
                    submissionId={submissionId}
                    showAnnotations={!!submissionId && !!aiFeedback}
                    annotationsRefreshKey={annotationsRefreshKey}
                />
            ) : (
                <DraftComparison
                    roughDraft={roughDraftText}
                    finalDraft={finalDraftText}
                    roughDraftSourceType={roughDraftSourceType}
                    finalDraftSourceType={finalDraftSourceType}
                    onRoughDraftChange={setRoughDraftText}
                    onFinalDraftChange={setFinalDraftText}
                    onRoughDraftExtracted={onRoughDraftExtracted}
                    onFinalDraftExtracted={onFinalDraftExtracted}
                    onRoughDraftEnhanced={onRoughDraftEnhanced}
                    onFinalDraftEnhanced={onFinalDraftEnhanced}
                />
            )}
        </div>
    );
}
