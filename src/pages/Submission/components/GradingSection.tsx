import { FileText, PenTool } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GradePanel from '@/components/GradePanel';
import AnnotationViewer from '@/components/AnnotationViewer';
import type { Feedback } from '@/lib/schema';
import type { Annotation } from '@/lib/annotations/types';

interface GradingSectionProps {
    submissionId?: string;
    originalFileUrl?: string;
    sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image';
    activeTab: 'grade' | 'annotate';
    setActiveTab: (tab: 'grade' | 'annotate') => void;
    aiFeedback: Feedback | null;
    isGrading: boolean;
    teacherGrade?: number;
    setTeacherGrade: (grade: number | undefined) => void;
    teacherFeedback: string;
    setTeacherFeedback: (feedback: string) => void;
    onRunGrade: () => void;
    onSaveEdits: () => void;
    canGrade: boolean;
    isSaving: boolean;
    annotations: Annotation[];
}

export function GradingSection({
    submissionId,
    originalFileUrl,
    sourceType,
    activeTab,
    setActiveTab,
    aiFeedback,
    isGrading,
    teacherGrade,
    setTeacherGrade,
    teacherFeedback,
    setTeacherFeedback,
    onRunGrade,
    onSaveEdits,
    canGrade,
    isSaving,
    annotations
}: GradingSectionProps) {
    return (
        <div className="transform transition-all duration-300">
            {submissionId && originalFileUrl && (sourceType === 'pdf' || sourceType === 'docx') ? (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'grade' | 'annotate')}>
                    <div className="flex justify-center mb-6">
                        <TabsList className="grid grid-cols-2 w-full max-w-md h-12 bg-white dark:bg-slate-800 shadow-md">
                            <TabsTrigger
                                value="grade"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                            >
                                <FileText className="w-4 h-4" />
                                AI Grade
                            </TabsTrigger>
                            <TabsTrigger
                                value="annotate"
                                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                            >
                                <PenTool className="w-4 h-4" />
                                Annotate
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="grade">
                        <GradePanel
                            aiFeedback={aiFeedback}
                            isGrading={isGrading}
                            teacherGrade={teacherGrade}
                            setTeacherGrade={setTeacherGrade}
                            teacherFeedback={teacherFeedback}
                            setTeacherFeedback={setTeacherFeedback}
                            onRunGrade={onRunGrade}
                            onSaveEdits={onSaveEdits}
                            canGrade={canGrade}
                            isSaving={isSaving}
                            annotations={annotations}
                        />
                    </TabsContent>

                    <TabsContent value="annotate">
                        <AnnotationViewer
                            submissionId={submissionId}
                            originalFileUrl={originalFileUrl}
                            sourceType={sourceType}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                <GradePanel
                    aiFeedback={aiFeedback}
                    isGrading={isGrading}
                    teacherGrade={teacherGrade}
                    setTeacherGrade={setTeacherGrade}
                    teacherFeedback={teacherFeedback}
                    setTeacherFeedback={setTeacherFeedback}
                    onRunGrade={onRunGrade}
                    onSaveEdits={onSaveEdits}
                    canGrade={canGrade}
                    isSaving={isSaving}
                    annotations={annotations}
                />
            )}
        </div>
    );
}
