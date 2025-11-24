import { FileText, GitCompare, Printer, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import type { Feedback } from '@/lib/schema';

interface SubmissionHeaderProps {
    submissionId?: string;
    aiFeedback: Feedback | null;
    draftMode: 'single' | 'comparison';
    setDraftMode: (mode: 'single' | 'comparison') => void;
    onNewSubmission: () => void;
    onPrint: () => void;
}

export function SubmissionHeader({
    submissionId,
    aiFeedback,
    draftMode,
    setDraftMode,
    onNewSubmission,
    onPrint
}: SubmissionHeaderProps) {
    return (
        <PageHeader
            icon={<span className="text-2xl">📝</span>}
            title="Grade Submission"
            subtitle="Grade essays with AI assistance"
            showAddAssignment={true}
            showBridgeLock={true}
            actions={
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNewSubmission}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                    >
                        <PenTool className="w-4 h-4 mr-2" />
                        New Submission
                    </Button>
                    <div className="w-px h-8 bg-gray-300 mx-2" />
                    {submissionId && aiFeedback && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPrint}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        </>
                    )}
                    <Button
                        variant={draftMode === 'single' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDraftMode('single')}
                        className={draftMode === 'single' ? 'bg-indigo-600' : ''}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Single Essay
                    </Button>
                    <Button
                        variant={draftMode === 'comparison' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDraftMode('comparison')}
                        className={draftMode === 'comparison' ? 'bg-indigo-600' : ''}
                    >
                        <GitCompare className="w-4 h-4 mr-2" />
                        Draft Comparison
                    </Button>
                </>
            }
        />
    );
}
