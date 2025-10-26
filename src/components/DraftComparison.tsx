import VerbatimViewer from './VerbatimViewer';

interface DraftComparisonProps {
  roughDraft: string;
  finalDraft: string;
  roughDraftSourceType?: 'text' | 'docx' | 'pdf' | 'doc' | 'image';
  finalDraftSourceType?: 'text' | 'docx' | 'pdf' | 'doc' | 'image';
  onRoughDraftChange: (text: string) => void;
  onFinalDraftChange: (text: string) => void;
  onRoughDraftExtracted?: (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', imageDataUrl?: string) => void;
  onFinalDraftExtracted?: (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', imageDataUrl?: string) => void;
  onRoughDraftEnhanced?: (text: string) => void;
  onFinalDraftEnhanced?: (text: string) => void;
}

export default function DraftComparison({
  roughDraft,
  finalDraft,
  roughDraftSourceType,
  finalDraftSourceType,
  onRoughDraftChange,
  onFinalDraftChange,
  onRoughDraftExtracted,
  onFinalDraftExtracted,
  onRoughDraftEnhanced,
  onFinalDraftEnhanced,
}: DraftComparisonProps) {
  
  const handleRoughDraftExtractedInternal = (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', imageDataUrl?: string) => {
    onRoughDraftChange(text);
    if (onRoughDraftExtracted) {
      onRoughDraftExtracted(text, sourceType, imageDataUrl);
    }
  };

  const handleFinalDraftExtractedInternal = (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', imageDataUrl?: string) => {
    onFinalDraftChange(text);
    if (onFinalDraftExtracted) {
      onFinalDraftExtracted(text, sourceType, imageDataUrl);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Rough Draft */}
      <VerbatimViewer
        text={roughDraft}
        sourceType={roughDraftSourceType}
        onTextExtracted={handleRoughDraftExtractedInternal}
        onTextEnhanced={onRoughDraftEnhanced}
        title="First Version"
        titleIcon="📄"
        borderColor="border-orange-500"
        headerGradient="from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950"
        badgeColor="bg-orange-500"
        badgeText="ROUGH DRAFT"
        placeholder="Paste or type the student's rough draft here..."
        textareaClassName="border-2 focus:border-orange-400 bg-orange-50/30 dark:bg-orange-950/20"
        wordCountColor="text-orange-600 dark:text-orange-400"
        showEnhanceButton={true}
      />

      {/* Final Draft */}
      <VerbatimViewer
        text={finalDraft}
        sourceType={finalDraftSourceType}
        onTextExtracted={handleFinalDraftExtractedInternal}
        onTextEnhanced={onFinalDraftEnhanced}
        title="Revised Version"
        titleIcon="✅"
        borderColor="border-green-500"
        headerGradient="from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
        badgeColor="bg-green-500"
        badgeText="FINAL DRAFT"
        placeholder="Paste or type the student's final draft here..."
        textareaClassName="border-2 focus:border-green-400 bg-green-50/30 dark:bg-green-950/20"
        wordCountColor="text-green-600 dark:text-green-400"
        showEnhanceButton={true}
      />
    </div>
  );
}
