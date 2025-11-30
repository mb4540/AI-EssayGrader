import CriteriaInput from '@/components/CriteriaInput';
import AssignmentModal from '@/components/CreateAssignmentModal';
import { Toast } from '@/components/ui/toast';
import { useSubmissionState } from './Submission/hooks/useSubmissionState';
import { useSubmissionActions } from './Submission/hooks/useSubmissionActions';
import { SubmissionHeader } from './Submission/components/SubmissionHeader';
import { StudentInfoCard } from './Submission/components/StudentInfoCard';
import { SubmissionContent } from './Submission/components/SubmissionContent';
import { GradingSection } from './Submission/components/GradingSection';

export default function Submission() {
  const state = useSubmissionState();
  const actions = useSubmissionActions(state);

  const canGrade = !!state.studentName && !!state.criteria && (
    state.draftMode === 'single' ? !!state.verbatimText : (!!state.roughDraftText && !!state.finalDraftText)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Toast Notification */}
        {state.saveMessage && (
          <Toast
            message={state.saveMessage}
            duration={3000}
            onClose={() => state.setSaveMessage(null)}
          />
        )}

        <SubmissionHeader
          submissionId={state.submissionId}
          aiFeedback={state.aiFeedback}
          draftMode={state.draftMode}
          setDraftMode={state.setDraftMode}
          onNewSubmission={actions.handleNewSubmission}
          onPrint={actions.handlePrint}
        />

        {/* Student Information - Full Width */}
        <div className="mb-6">
          <StudentInfoCard
            bridge={state.bridge}
            selectedStudentUuid={state.selectedStudentUuid}
            setSelectedStudentUuid={state.setSelectedStudentUuid}
            studentName={state.studentName}
            setStudentName={state.setStudentName}
            studentId={state.studentId}
            setStudentId={state.setStudentId}
            assignmentId={state.assignmentId}
            setAssignmentId={state.setAssignmentId}
            assignmentsData={state.assignmentsData}
            setEditingAssignment={state.setEditingAssignment}
            setIsEditModalOpen={state.setIsEditModalOpen}
          />
        </div>

        {/* Grading Criteria - Full Width */}
        <div className="mb-6 transform transition-all duration-300">
          <CriteriaInput
            value={state.criteria}
            onChange={state.setCriteria}
            totalPoints={state.totalPoints}
            onTotalPointsChange={state.setTotalPoints}
            assignmentPrompt={state.assignmentPrompt}
            onAssignmentPromptChange={state.setAssignmentPrompt}
          />
        </div>

        {/* Essay Section */}
        <SubmissionContent
          draftMode={state.draftMode}
          verbatimText={state.verbatimText}
          sourceType={state.sourceType}
          onTextExtracted={actions.handleTextExtracted}
          onTextEnhanced={actions.handleTextEnhanced}
          storedImageUrl={state.storedImageUrl}
          submissionId={state.submissionId}
          aiFeedback={state.aiFeedback}
          annotationsRefreshKey={state.annotationsRefreshKey}
          rubric={(state.aiFeedback as any)?.bulletproof?.rubric}
          roughDraftText={state.roughDraftText}
          finalDraftText={state.finalDraftText}
          roughDraftSourceType={state.roughDraftSourceType}
          finalDraftSourceType={state.finalDraftSourceType}
          setRoughDraftText={state.setRoughDraftText}
          setFinalDraftText={state.setFinalDraftText}
          onRoughDraftExtracted={actions.handleRoughDraftExtracted}
          onFinalDraftExtracted={actions.handleFinalDraftExtracted}
          onRoughDraftEnhanced={actions.handleRoughDraftEnhanced}
          onFinalDraftEnhanced={actions.handleFinalDraftEnhanced}
        />

        {/* Grading Panel with Optional Annotation Tab */}
        <GradingSection
          submissionId={state.submissionId}
          originalFileUrl={state.originalFileUrl}
          sourceType={state.sourceType}
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          aiFeedback={state.aiFeedback}
          isGrading={actions.gradeMutation.isPending}
          teacherGrade={state.teacherGrade}
          setTeacherGrade={state.setTeacherGrade}
          teacherFeedback={state.teacherFeedback}
          setTeacherFeedback={state.setTeacherFeedback}
          onRunGrade={actions.handleRunGrade}
          onSaveEdits={actions.handleSaveEdits}
          canGrade={canGrade}
          isSaving={actions.saveMutation.isPending}
          annotations={state.annotations}
        />
      </div>

      {/* Edit Assignment Modal */}
      <AssignmentModal
        isOpen={state.isEditModalOpen}
        onClose={() => {
          state.setIsEditModalOpen(false);
          state.setEditingAssignment(null);
        }}
        mode="edit"
        existingAssignment={state.editingAssignment}
        onSuccess={() => {
          actions.refreshAssignments();
          // Logic to update local state if needed
          if (state.editingAssignment?.id === state.assignmentId) {
            // We can't easily access the new assignment data here without fetching it.
            // But invalidating queries will trigger a refetch.
            // The useEffect in useSubmissionState will run when assignmentsData changes.
            // And it will update criteria if it matches assignmentId.
            // So this should work automatically!
          }
        }}
      />
    </div>
  );
}
