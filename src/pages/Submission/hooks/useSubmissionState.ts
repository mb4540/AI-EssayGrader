import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listAssignments, getSubmission } from '@/lib/api';
import { useBridge } from '@/hooks/useBridge';
import type { Feedback } from '@/lib/schema';
import type { Annotation } from '@/lib/annotations/types';

export function useSubmissionState() {
    const { id } = useParams();
    const bridge = useBridge();

    const [draftMode, setDraftMode] = useState<'single' | 'comparison'>('single');
    const [selectedStudentUuid, setSelectedStudentUuid] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [assignmentId, setAssignmentId] = useState<string | undefined>();
    const [assignmentPrompt, setAssignmentPrompt] = useState('');
    const [criteria, setCriteria] = useState('');
    const [totalPoints, setTotalPoints] = useState(100);
    const [verbatimText, setVerbatimText] = useState('');
    const [roughDraftText, setRoughDraftText] = useState('');
    const [finalDraftText, setFinalDraftText] = useState('');
    const [sourceType, setSourceType] = useState<'text' | 'docx' | 'pdf' | 'doc' | 'image'>('text');
    const [roughDraftSourceType, setRoughDraftSourceType] = useState<'text' | 'docx' | 'pdf' | 'doc' | 'image'>('text');
    const [finalDraftSourceType, setFinalDraftSourceType] = useState<'text' | 'docx' | 'pdf' | 'doc' | 'image'>('text');
    const [submissionId, setSubmissionId] = useState<string | undefined>(id);
    const [aiFeedback, setAiFeedback] = useState<Feedback | null>(null);
    const [teacherGrade, setTeacherGrade] = useState<number | undefined>();
    const [teacherFeedback, setTeacherFeedback] = useState('');
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
    const [storedImageUrl, setStoredImageUrl] = useState<string | undefined>();
    const [pendingFile, setPendingFile] = useState<{ data: string; extension: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'grade' | 'annotate'>('grade');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);
    const [originalFileUrl, setOriginalFileUrl] = useState<string | undefined>();
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [annotationsRefreshKey, setAnnotationsRefreshKey] = useState(0);

    // Load assignments list
    const { data: assignmentsData } = useQuery({
        queryKey: ['assignments'],
        queryFn: listAssignments,
    });

    // Auto-populate criteria when assignment is selected
    useEffect(() => {
        if (assignmentId && assignmentsData?.assignments) {
            const selectedAssignment = assignmentsData.assignments.find(a => a.id === assignmentId);
            if (selectedAssignment?.grading_criteria && !criteria) {
                setCriteria(selectedAssignment.grading_criteria);
            }
            if (selectedAssignment?.total_points) {
                setTotalPoints(selectedAssignment.total_points);
            }
            if (selectedAssignment?.assignment_prompt) {
                setAssignmentPrompt(selectedAssignment.assignment_prompt);
            }
        }
    }, [assignmentId, assignmentsData]);

    // Load existing submission if ID is provided (from URL or state)
    const effectiveId = id || submissionId;
    const { data: existingSubmission } = useQuery({
        queryKey: ['submission', effectiveId],
        queryFn: () => getSubmission(effectiveId!),
        enabled: !!effectiveId,
    });

    const [loadedSubmissionId, setLoadedSubmissionId] = useState<string | null>(null);

    useEffect(() => {
        if (existingSubmission && existingSubmission.student_id) {
            // Only load data if we haven't loaded this submission yet
            // This prevents overwriting local state during background refetches (e.g. annotation polling)
            if (existingSubmission.id === loadedSubmissionId) {
                return;
            }

            setLoadedSubmissionId(existingSubmission.id);

            // Set the selected UUID and resolve student info from bridge
            setSelectedStudentUuid(existingSubmission.student_id);
            const student = bridge.findByUuid(existingSubmission.student_id);
            setStudentName(student?.name || 'Unknown');
            setStudentId(student?.localId || '');
            setAssignmentId(existingSubmission.assignment_id);
            setCriteria(existingSubmission.teacher_criteria);

            // Set draft mode and corresponding text fields
            if (existingSubmission.draft_mode) {
                setDraftMode(existingSubmission.draft_mode);
            }

            if (existingSubmission.draft_mode === 'comparison') {
                setRoughDraftText(existingSubmission.rough_draft_text || '');
                setFinalDraftText(existingSubmission.final_draft_text || '');
            } else {
                setVerbatimText(existingSubmission.verbatim_text || '');
            }

            setSourceType(existingSubmission.source_type as 'text' | 'docx' | 'pdf' | 'doc' | 'image');
            setAiFeedback(existingSubmission.ai_feedback || null);
            setTeacherGrade(existingSubmission.teacher_grade);
            setTeacherFeedback(existingSubmission.teacher_feedback || '');

            // Load stored image URL if available
            if ((existingSubmission as any).image_url) {
                setStoredImageUrl((existingSubmission as any).image_url);
            }

            // Load original file URL if available (for annotations)
            if ((existingSubmission as any).original_file_url) {
                setOriginalFileUrl((existingSubmission as any).original_file_url);
            }
        }
    }, [existingSubmission, bridge, loadedSubmissionId]);

    useEffect(() => {
        if (!submissionId) {
            setLoadedSubmissionId(null);
        }
    }, [submissionId]);

    return {
        // State
        draftMode, setDraftMode,
        selectedStudentUuid, setSelectedStudentUuid,
        studentName, setStudentName,
        studentId, setStudentId,
        assignmentId, setAssignmentId,
        assignmentPrompt, setAssignmentPrompt,
        criteria, setCriteria,
        totalPoints, setTotalPoints,
        verbatimText, setVerbatimText,
        roughDraftText, setRoughDraftText,
        finalDraftText, setFinalDraftText,
        sourceType, setSourceType,
        roughDraftSourceType, setRoughDraftSourceType,
        finalDraftSourceType, setFinalDraftSourceType,
        submissionId, setSubmissionId,
        aiFeedback, setAiFeedback,
        teacherGrade, setTeacherGrade,
        teacherFeedback, setTeacherFeedback,
        saveMessage, setSaveMessage,
        imageDataUrl, setImageDataUrl,
        storedImageUrl, setStoredImageUrl,
        pendingFile, setPendingFile,
        activeTab, setActiveTab,
        isEditModalOpen, setIsEditModalOpen,
        editingAssignment, setEditingAssignment,
        originalFileUrl, setOriginalFileUrl,
        annotations, setAnnotations,
        annotationsRefreshKey, setAnnotationsRefreshKey,
        loadedSubmissionId, setLoadedSubmissionId,

        // Data
        assignmentsData,
        existingSubmission,
        bridge,
        id
    };
}
