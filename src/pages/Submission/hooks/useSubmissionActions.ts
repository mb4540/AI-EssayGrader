import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ingestSubmission, gradeSubmission, saveTeacherEdits, uploadFile, getInlineAnnotations } from '@/lib/api';
import { printSubmission } from '@/lib/print';
import { generateAnnotatedPrintHTML } from '@/lib/printAnnotated';
import type { Annotation } from '@/lib/annotations/types';
import type { useSubmissionState } from './useSubmissionState';

type SubmissionState = ReturnType<typeof useSubmissionState>;

export function useSubmissionActions(state: SubmissionState) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Immediate UI feedback state for Run Grade button
    const [isRunGradeStarting, setIsRunGradeStarting] = useState(false);
    const runGradeInFlightRef = useRef(false);

    const {
        submissionId, setSubmissionId,
        selectedStudentUuid,
        studentName, studentId,
        assignmentId,
        criteria,
        totalPoints,
        verbatimText, setVerbatimText,
        roughDraftText, setRoughDraftText,
        finalDraftText, setFinalDraftText,
        sourceType, setSourceType,
        setRoughDraftSourceType,
        setFinalDraftSourceType,
        draftMode,
        imageDataUrl, setImageDataUrl,
        setStoredImageUrl,
        pendingFile, setPendingFile,
        setOriginalFileUrl,
        setAiFeedback,
        annotations, setAnnotations,
        setAnnotationsRefreshKey,
        teacherGrade,
        teacherFeedback,
        aiFeedback,
        existingSubmission,
        setSaveMessage
    } = state;

    const ingestMutation = useMutation({
        mutationFn: ingestSubmission,
        onSuccess: (data) => {
            setSubmissionId(data.submission_id);
        },
    });

    const gradeMutation = useMutation({
        mutationFn: gradeSubmission,
        onSuccess: async (data) => {
            setAiFeedback(data);

            // Fetch annotations from database after grading
            // Add delay to ensure annotations are fully saved
            if (submissionId) {
                try {
                    // Wait 1 second for annotations to be saved (increased from 500ms)
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const annotationsData = await getInlineAnnotations(submissionId);
                    const newAnnotations = annotationsData.annotations || [];

                    console.log(`✓ Loaded ${newAnnotations.length} annotations after grading`);

                    // Force state update with new array reference
                    setAnnotations([...newAnnotations]);

                    // Invalidate the submission query to refresh all data
                    queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });

                    // Force a second fetch after another delay to catch any stragglers
                    setTimeout(async () => {
                        try {
                            const retryData = await getInlineAnnotations(submissionId);
                            const retryAnnotations = retryData.annotations || [];
                            if (retryAnnotations.length > newAnnotations.length) {
                                console.log(`✓ Retry found ${retryAnnotations.length - newAnnotations.length} more annotations`);
                                setAnnotations([...retryAnnotations]);
                            }
                        } catch (err) {
                            console.error('Retry fetch failed:', err);
                        }
                    }, 2000);

                    // Third fetch for Pass 2 annotations (which complete ~5 seconds after grading)
                    setTimeout(async () => {
                        try {
                            const pass2Data = await getInlineAnnotations(submissionId);
                            const pass2Annotations = pass2Data.annotations || [];
                            const currentCount = annotations.length;
                            if (pass2Annotations.length > currentCount) {
                                console.log(`✓ Pass 2 fetch found ${pass2Annotations.length - currentCount} more annotations (Total: ${pass2Annotations.length})`);
                                setAnnotations([...pass2Annotations]);
                                // Trigger refresh in VerbatimViewer
                                setAnnotationsRefreshKey(prev => prev + 1);
                            }
                        } catch (err) {
                            console.error('Pass 2 fetch failed:', err);
                        }
                    }, 5000);
                } catch (error) {
                    console.error('Failed to fetch annotations after grading:', error);
                    setAnnotations([]);
                }
            }
        },
    });

    const saveMutation = useMutation({
        mutationFn: saveTeacherEdits,
        onSuccess: () => {
            // Show success toast notification (auto-closes after 3 seconds)
            setSaveMessage('Grade Saved');

            // Invalidate and refetch the submission query to update UI state
            const effectiveId = state.id || submissionId;
            if (effectiveId) {
                queryClient.invalidateQueries({ queryKey: ['submission', effectiveId] });
            }

            // Navigate to the submission URL if not already there (for new submissions)
            if (!state.id && submissionId) {
                navigate(`/submission/${submissionId}`, { replace: true });
            }
        },
    });

    // Upload image to Netlify Blobs after submission is created
    const uploadImage = async (submissionId: string, imageData: string) => {
        try {
            const response = await fetch('/.netlify/functions/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submission_id: submissionId,
                    image_data: imageData
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            setStoredImageUrl(data.image_url);
            return data.image_url;
        } catch (error) {
            console.error('Image upload failed:', error);
            return null;
        }
    };

    const handleTextExtracted = (text: string, type: 'text' | 'docx' | 'pdf' | 'doc' | 'image', fileData?: string) => {
        setVerbatimText(text);
        setSourceType(type);

        if (type === 'image' && fileData) {
            // For images, store in imageDataUrl for upload-image function
            setImageDataUrl(fileData);
        } else if ((type === 'pdf' || type === 'docx' || type === 'doc') && fileData) {
            // For documents, store in pendingFile for upload-file function
            setPendingFile({ data: fileData, extension: type });
        }
    };

    const handleTextEnhanced = (enhancedText: string) => {
        setVerbatimText(enhancedText);
    };

    const handleRoughDraftExtracted = (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', _imageDataUrl?: string) => {
        setRoughDraftText(text);
        setRoughDraftSourceType(sourceType);
    };

    const handleFinalDraftExtracted = (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', _imageDataUrl?: string) => {
        setFinalDraftText(text);
        setFinalDraftSourceType(sourceType);
    };

    const handleRoughDraftEnhanced = (enhancedText: string) => {
        setRoughDraftText(enhancedText);
    };

    const handleFinalDraftEnhanced = (enhancedText: string) => {
        setFinalDraftText(enhancedText);
    };

    const handleRunGrade = async () => {
        // Prevent double-clicks
        if (runGradeInFlightRef.current) return;
        runGradeInFlightRef.current = true;
        setIsRunGradeStarting(true);

        try {
            // First ingest if not already done
            if (!submissionId) {
                // Validation
                if (!selectedStudentUuid) {
                    alert('Please select a student from the dropdown');
                    return;
                }

                if (draftMode === 'single') {
                    if (!criteria || !verbatimText) {
                        alert('Please provide grading criteria and essay text');
                        return;
                    }
                } else {
                    if (!criteria || !roughDraftText || !finalDraftText) {
                        alert('Please provide grading criteria and both draft versions');
                        return;
                    }
                }

                // FERPA COMPLIANT: Send only UUID to API (no PII)
                const result = await ingestMutation.mutateAsync({
                    student_id: selectedStudentUuid,  // Only UUID sent to cloud
                    assignment_id: assignmentId || undefined,
                    teacher_criteria: criteria,
                    source_type: sourceType,
                    draft_mode: draftMode,
                    verbatim_text: draftMode === 'single' ? verbatimText : undefined,
                    rough_draft_text: draftMode === 'comparison' ? roughDraftText : undefined,
                    final_draft_text: draftMode === 'comparison' ? finalDraftText : undefined,
                });

                setSubmissionId(result.submission_id);

                // Upload image if we have one
                if (imageDataUrl && sourceType === 'image') {
                    const imageUrl = await uploadImage(result.submission_id, imageDataUrl);
                    if (imageUrl) {
                        // Image uploaded successfully
                    }
                }

                // Upload original document file if we have one
                if (pendingFile) {
                    try {
                        const fileUrl = await uploadFile(result.submission_id, pendingFile.data, pendingFile.extension);
                        setOriginalFileUrl(fileUrl); // Update state so Annotate tab appears immediately
                        setPendingFile(null); // Clear after successful upload
                    } catch (error) {
                        console.error('Failed to upload original file:', error);
                        // Don't block grading if file upload fails
                    }
                }

                // Then grade
                await gradeMutation.mutateAsync({
                    submission_id: result.submission_id,
                });
            } else {
                // Just grade existing submission
                await gradeMutation.mutateAsync({
                    submission_id: submissionId,
                });
            }
        } finally {
            setIsRunGradeStarting(false);
            runGradeInFlightRef.current = false;
        }
    };

    const handleSaveEdits = async () => {
        if (!submissionId) {
            alert('Please run grading first');
            return;
        }

        await saveMutation.mutateAsync({
            submission_id: submissionId,
            teacher_grade: teacherGrade ?? aiFeedback?.overall_grade ?? 0,
            teacher_feedback: teacherFeedback,
        });
    };

    const handleNewSubmission = () => {
        // IMPORTANT: Navigate to clean URL first to clear the URL param
        // This prevents the useQuery from refetching the old submission
        if (state.id) {
            navigate('/submission', { replace: true });
        }
        
        // Reset loadedSubmissionId to prevent race condition
        state.setLoadedSubmissionId(null);
        
        // Reset student selection but keep assignment
        state.setSelectedStudentUuid('');
        state.setStudentName('');
        state.setStudentId('');
        // Reset essay content
        state.setVerbatimText('');
        state.setRoughDraftText('');
        state.setFinalDraftText('');
        state.setSourceType('text');
        state.setRoughDraftSourceType('text');
        state.setFinalDraftSourceType('text');
        // Reset grading
        state.setSubmissionId(undefined);
        state.setAiFeedback(null);
        state.setTeacherGrade(undefined);
        state.setTeacherFeedback('');
        state.setImageDataUrl(undefined);
        state.setStoredImageUrl(undefined);
        state.setPendingFile(null);
        state.setOriginalFileUrl(undefined);
        // Keep assignment and criteria for quick grading

        // Also reset annotations
        state.setAnnotations([]);
    };

    const handlePrint = async () => {
        if (!existingSubmission) {
            alert('Please save the submission first');
            return;
        }

        // Check if annotations exist
        let currentAnnotations: Annotation[] = [];
        if (submissionId) {
            try {
                const annotationsData = await getInlineAnnotations(submissionId);
                currentAnnotations = annotationsData.annotations || [];
            } catch (error) {
                console.error('Failed to fetch annotations:', error);
            }
        }

        // Use annotated print if annotations exist, otherwise use regular print
        if (currentAnnotations.length > 0 && (verbatimText || finalDraftText)) {
            const html = generateAnnotatedPrintHTML({
                student_name: studentName,
                student_id: studentId || undefined,
                assignment_title: existingSubmission.assignment_title,
                verbatim_text: (draftMode === 'single' ? verbatimText : finalDraftText) || '',
                teacher_criteria: criteria,
                total_points: totalPoints,
                ai_grade: existingSubmission.ai_grade,
                ai_feedback: aiFeedback || undefined,
                teacher_grade: teacherGrade,
                teacher_feedback: teacherFeedback,
                created_at: existingSubmission.created_at,
                annotations: currentAnnotations,
            });

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } else {
            // Regular print without annotations
            printSubmission({
                student_name: studentName,
                student_id: studentId || undefined,
                assignment_title: existingSubmission.assignment_title,
                draft_mode: draftMode,
                verbatim_text: verbatimText || undefined,
                rough_draft_text: roughDraftText || undefined,
                final_draft_text: finalDraftText || undefined,
                teacher_criteria: criteria,
                total_points: totalPoints,
                ai_grade: existingSubmission.ai_grade,
                ai_feedback: aiFeedback || undefined,
                teacher_grade: teacherGrade,
                teacher_feedback: teacherFeedback,
                created_at: existingSubmission.created_at,
            });
        }
    };

    return {
        isRunGradeStarting,
        ingestMutation,
        gradeMutation,
        saveMutation,
        handleTextExtracted,
        handleTextEnhanced,
        handleRoughDraftExtracted,
        handleFinalDraftExtracted,
        handleRoughDraftEnhanced,
        handleFinalDraftEnhanced,
        handleRunGrade,
        handleSaveEdits,
        handleNewSubmission,
        handlePrint,
        refreshAssignments: () => queryClient.invalidateQueries({ queryKey: ['assignments'] })
    };
}
