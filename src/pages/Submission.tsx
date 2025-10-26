import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, GitCompare, Printer, Download, Info, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerbatimViewer from '@/components/VerbatimViewer';
import CriteriaInput from '@/components/CriteriaInput';
import GradePanel from '@/components/GradePanel';
import DraftComparison from '@/components/DraftComparison';
import AnnotationViewer from '@/components/AnnotationViewer';
import { ingestSubmission, gradeSubmission, saveTeacherEdits, getSubmission, listAssignments, uploadFile } from '@/lib/api';
import { printSubmission, downloadSubmissionHTML } from '@/lib/print';
import type { Feedback } from '@/lib/schema';

export default function Submission() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [draftMode, setDraftMode] = useState<'single' | 'comparison'>('single');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [assignmentId, setAssignmentId] = useState<string | undefined>();
  const [criteria, setCriteria] = useState('');
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
    }
  }, [assignmentId, assignmentsData]);

  // Load existing submission if ID is provided
  const { data: existingSubmission } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingSubmission) {
      setStudentName(existingSubmission.student_name);
      setStudentId(existingSubmission.student_id || '');
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
      // Validation based on mode
      if (draftMode === 'single') {
        if (!studentName || !criteria || !verbatimText) {
          alert('Please provide student name, criteria, and essay text');
          return;
        }
      } else {
        if (!studentName || !criteria || !roughDraftText || !finalDraftText) {
          alert('Please provide student name, criteria, and both draft versions');
          return;
        }
      }

      const result = await ingestMutation.mutateAsync({
        student_name: studentName,
        student_id: studentId || undefined,
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
          console.log('Image uploaded successfully:', imageUrl);
        }
      }
      
      // Upload original document file if we have one
      if (pendingFile) {
        try {
          const fileUrl = await uploadFile(result.submission_id, pendingFile.data, pendingFile.extension);
          console.log('Original file uploaded successfully:', fileUrl);
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

  const handlePrint = () => {
    if (!existingSubmission) {
      alert('Please save the submission first');
      return;
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Grade Submission</h1>
                <p className="text-blue-100 text-sm mt-1">AI-powered essay grading assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/help')}
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 font-bold px-4"
                size="sm"
                title="Need Help? Click here for guide"
              >
                <Info className="w-5 h-5 mr-2" />
                HELP
              </Button>
              {submissionId && aiFeedback && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrint}
                    className="text-white hover:bg-white/20"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
              {submissionId && (
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-xs text-blue-100">Submission ID</p>
                  <p className="text-sm font-mono text-white">{submissionId.slice(0, 8)}...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mode Toggle with enhanced styling */}
        <div className="mb-8 flex justify-center">
          <Tabs value={draftMode} onValueChange={(v) => setDraftMode(v as 'single' | 'comparison')}>
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-white dark:bg-slate-800 shadow-md">
              <TabsTrigger 
                value="single" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4" />
                Single Essay
              </TabsTrigger>
              <TabsTrigger 
                value="comparison" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <GitCompare className="w-4 h-4" />
                Draft Comparison
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
                <Label htmlFor="student-name" className="text-gray-700 dark:text-gray-300 font-medium">
                  Student Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <Label htmlFor="student-id" className="text-gray-700 dark:text-gray-300 font-medium">
                  Student ID <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter student ID"
                  className="mt-1 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="assignment" className="text-gray-700 dark:text-gray-300 font-medium">
                  Assignment <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Select value={assignmentId} onValueChange={setAssignmentId}>
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
            <CriteriaInput value={criteria} onChange={setCriteria} />
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
