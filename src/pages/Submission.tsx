import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileText, GitCompare, Printer, Download, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerbatimViewer from '@/components/VerbatimViewer';
import CriteriaInput from '@/components/CriteriaInput';
import GradePanel from '@/components/GradePanel';
import DraftComparison from '@/components/DraftComparison';
import AnnotationViewer from '@/components/AnnotationViewer';
import { ingestSubmission, gradeSubmission, saveTeacherEdits, getSubmission, listAssignments, uploadFile, getInlineAnnotations } from '@/lib/api';
import { printSubmission, downloadSubmissionHTML } from '@/lib/print';
import { generateAnnotatedPrintHTML } from '@/lib/printAnnotated';
import type { Feedback } from '@/lib/schema';
import type { Annotation } from '@/lib/annotations/types';
import { useBridge } from '@/hooks/useBridge';

export default function Submission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bridge = useBridge();

  const [draftMode, setDraftMode] = useState<'single' | 'comparison'>('single');
  const [selectedStudentUuid, setSelectedStudentUuid] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [assignmentId, setAssignmentId] = useState<string | undefined>();
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
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [storedImageUrl, setStoredImageUrl] = useState<string | undefined>();
  const [pendingFile, setPendingFile] = useState<{ data: string; extension: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'grade' | 'annotate'>('grade');
  const [originalFileUrl, setOriginalFileUrl] = useState<string | undefined>();

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
    }
  }, [assignmentId, assignmentsData]);

  // Load existing submission if ID is provided
  const { data: existingSubmission } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingSubmission && existingSubmission.student_id) {
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
  }, [existingSubmission]);

  const ingestMutation = useMutation({
    mutationFn: ingestSubmission,
    onSuccess: (data) => {
      setSubmissionId(data.submission_id);
    },
  });

  const gradeMutation = useMutation({
    mutationFn: gradeSubmission,
    onSuccess: (data) => {
      setAiFeedback(data);
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveTeacherEdits,
    onSuccess: () => {
      alert('Grade saved successfully!');
      navigate('/');
    },
  });

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

  const handleRunGrade = async () => {
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

  const canGrade = !!studentName && !!criteria && (
    draftMode === 'single' ? !!verbatimText : (!!roughDraftText && !!finalDraftText)
  );

  const handlePrint = async () => {
    if (!existingSubmission) {
      alert('Please save the submission first');
      return;
    }
    
    // Check if annotations exist
    let annotations: Annotation[] = [];
    if (submissionId) {
      try {
        const annotationsData = await getInlineAnnotations(submissionId);
        annotations = annotationsData.annotations || [];
      } catch (error) {
        console.error('Failed to fetch annotations:', error);
      }
    }
    
    // Use annotated print if annotations exist, otherwise use regular print
    if (annotations.length > 0 && (verbatimText || finalDraftText)) {
      const html = generateAnnotatedPrintHTML({
        student_name: studentName,
        student_id: studentId || undefined,
        assignment_title: existingSubmission.assignment_title,
        verbatim_text: (draftMode === 'single' ? verbatimText : finalDraftText) || '',
        teacher_criteria: criteria,
        ai_grade: existingSubmission.ai_grade,
        ai_feedback: aiFeedback || undefined,
        teacher_grade: teacherGrade,
        teacher_feedback: teacherFeedback,
        created_at: existingSubmission.created_at,
        annotations: annotations,
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
        ai_grade: existingSubmission.ai_grade,
        ai_feedback: aiFeedback || undefined,
        teacher_grade: teacherGrade,
        teacher_feedback: teacherFeedback,
        created_at: existingSubmission.created_at,
      });
    }
  };

  const handleDownload = () => {
    if (!existingSubmission) {
      alert('Please save the submission first');
      return;
    }
    
    downloadSubmissionHTML({
      student_name: studentName,
      student_id: studentId || undefined,
      assignment_title: existingSubmission.assignment_title,
      draft_mode: draftMode,
      verbatim_text: verbatimText || undefined,
      rough_draft_text: roughDraftText || undefined,
      final_draft_text: finalDraftText || undefined,
      teacher_criteria: criteria,
      ai_grade: existingSubmission.ai_grade,
      ai_feedback: aiFeedback || undefined,
      teacher_grade: teacherGrade,
      teacher_feedback: teacherFeedback,
      created_at: existingSubmission.created_at,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <Card className="shadow-xl border-t-4 border-t-indigo-500 bg-white mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <CardTitle className="text-2xl text-gray-900">Grade Submission</CardTitle>
              </div>
              <div className="flex gap-2">
                {submissionId && aiFeedback && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <div className="w-px h-8 bg-gray-300 mx-2" />
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
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Top Row: Student Info and Grading Criteria side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Student Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-300 text-sm">👤</span>
              </div>
              Student Information
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student-select" className="text-gray-700 dark:text-gray-300 font-medium">
                  Select Student <span className="text-red-500">*</span>
                </Label>
                {bridge.isLocked ? (
                  <div className="mt-1 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      🔒 Student roster is locked. Please unlock it first.
                    </p>
                    <Button
                      onClick={() => navigate('/bridge')}
                      variant="outline"
                      size="sm"
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      Go to Students Page to Unlock
                    </Button>
                  </div>
                ) : bridge.students.length === 0 ? (
                  <div className="mt-1 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      No students in roster. Please add students first.
                    </p>
                    <Button
                      onClick={() => navigate('/bridge')}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      Go to Students Page
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedStudentUuid}
                      onValueChange={(uuid) => {
                        setSelectedStudentUuid(uuid);
                        const student = bridge.findByUuid(uuid);
                        if (student) {
                          setStudentName(student.name);
                          setStudentId(student.localId);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue placeholder="Choose a student from your roster" />
                      </SelectTrigger>
                      <SelectContent>
                        {bridge.students.map((student) => (
                          <SelectItem key={student.uuid} value={student.uuid}>
                            {student.name} ({student.localId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStudentUuid && (
                      <p className="text-sm text-gray-500 mt-1">
                        Selected: {studentName} (ID: {studentId})
                      </p>
                    )}
                  </>
                )}
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300 font-medium">
                  Student UUID <span className="text-gray-400 text-xs">(auto-filled)</span>
                </Label>
                <Input
                  value={selectedStudentUuid}
                  disabled
                  placeholder="UUID will be auto-filled"
                  className="mt-1 border-gray-300 bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="assignment" className="text-gray-700 dark:text-gray-300 font-medium">
                  Assignment <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Select value={assignmentId || ''} onValueChange={(value) => setAssignmentId(value || undefined)}>
                  <SelectTrigger className="mt-1 border-gray-300">
                    <SelectValue placeholder="Select an assignment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentsData?.assignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Grading Criteria */}
          <div className="transform transition-all duration-300">
            <CriteriaInput 
              value={criteria} 
              onChange={setCriteria}
              totalPoints={totalPoints}
              onTotalPointsChange={setTotalPoints}
            />
          </div>
        </div>

        {/* Essay Section - Full Width for Single, 50/50 for Comparison */}
        <div className="mb-6">
          {draftMode === 'single' ? (
            <VerbatimViewer 
              text={verbatimText} 
              sourceType={sourceType}
              onTextExtracted={handleTextExtracted}
              onTextEnhanced={handleTextEnhanced}
              imageUrl={storedImageUrl}
              submissionId={submissionId}
              showAnnotations={!!submissionId && !!aiFeedback}
            />
          ) : (
            <DraftComparison
              roughDraft={roughDraftText}
              finalDraft={finalDraftText}
              roughDraftSourceType={roughDraftSourceType}
              finalDraftSourceType={finalDraftSourceType}
              onRoughDraftChange={setRoughDraftText}
              onFinalDraftChange={setFinalDraftText}
              onRoughDraftExtracted={handleRoughDraftExtracted}
              onFinalDraftExtracted={handleFinalDraftExtracted}
              onRoughDraftEnhanced={handleRoughDraftEnhanced}
              onFinalDraftEnhanced={handleFinalDraftEnhanced}
            />
          )}
        </div>

        {/* Grading Panel with Optional Annotation Tab */}
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
                  isGrading={gradeMutation.isPending}
                  teacherGrade={teacherGrade}
                  setTeacherGrade={setTeacherGrade}
                  teacherFeedback={teacherFeedback}
                  setTeacherFeedback={setTeacherFeedback}
                  onRunGrade={handleRunGrade}
                  onSaveEdits={handleSaveEdits}
                  canGrade={canGrade}
                  isSaving={saveMutation.isPending}
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
              isGrading={gradeMutation.isPending}
              teacherGrade={teacherGrade}
              setTeacherGrade={setTeacherGrade}
              teacherFeedback={teacherFeedback}
              setTeacherFeedback={setTeacherFeedback}
              onRunGrade={handleRunGrade}
              onSaveEdits={handleSaveEdits}
              canGrade={canGrade}
              isSaving={saveMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
