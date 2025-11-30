import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { createAssignment, updateAssignment } from '@/lib/api';
import { startRubricExtraction, pollJobStatus, checkExtractionStatus, type JobStatus } from '@/lib/api/rubricJobs';
import CriteriaInput from './CriteriaInput';
import RubricPreviewModal from './RubricPreviewModal';
import { ELA_DOCUMENT_TYPES } from '@/lib/documentTypes';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignment_prompt?: string;
  grading_criteria?: string;
  document_type?: string;
  total_points?: number;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  existingAssignment?: Assignment | null;
  onSuccess?: () => void;
}

export default function AssignmentModal({ 
  isOpen, 
  onClose, 
  mode = 'create',
  existingAssignment = null,
  onSuccess
}: AssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentPrompt, setAssignmentPrompt] = useState('');
  const [criteria, setCriteria] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [documentType, setDocumentType] = useState('personal_narrative');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  // Rubric Extraction State
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [isExtractingRubric, setIsExtractingRubric] = useState(false);
  const [showRubricPreview, setShowRubricPreview] = useState(false);
  const [extractedRubric, setExtractedRubric] = useState<{
    rubricText: string;
    totalPoints: number;
    warning?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const handleRubricFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        alert('Please upload a PDF or Word document');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setRubricFile(file);
    }
  };

  const handleRubricUpload = async () => {
    if (!rubricFile) return;
    
    setIsExtractingRubric(true);
    try {
      // Get user's Gemini model and extraction prompt from localStorage
      const geminiModel = localStorage.getItem('ai_model_gemini') || 'gemini-2.0-flash-exp';
      const extractionPrompt = localStorage.getItem('ai_rubric_extraction_prompt') || '';
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(rubricFile);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:application/pdf;base64,")
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      console.log('📤 Starting rubric extraction job');
      
      // Start the background job
      const startResponse = await startRubricExtraction({
        file: base64,
        fileName: rubricFile.name,
        fileType: rubricFile.type,
        totalPoints,
        geminiModel,
        extractionPrompt,
      });

      if (!startResponse.success || !startResponse.jobId) {
        throw new Error(startResponse.error || 'Failed to start extraction job');
      }

      console.log('✅ Job started:', startResponse.jobId);

      // Poll for completion
      const result = await pollJobStatus(
        startResponse.jobId,
        checkExtractionStatus,
        (status: JobStatus) => {
          console.log('📊 Extraction status:', status);
        },
        60, // 60 attempts = 2 minutes
        2000 // 2 second intervals
      );

      if (result.result?.success) {
        setExtractedRubric(result.result);
        setShowRubricPreview(true);
        console.log('✅ Extraction complete');
      } else {
        const errorMsg = result.result?.error || result.error || 'Failed to extract rubric';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Rubric upload error:', error);
      const errorMsg = error?.message || 'Failed to extract rubric. Please try again.';
      alert(errorMsg);
    } finally {
      setIsExtractingRubric(false);
    }
  };

  const handleAcceptRubric = (rubricText: string) => {
    setCriteria(rubricText);
    
    // If we have extracted points, update the points field too
    if (extractedRubric?.totalPoints) {
      setTotalPoints(extractedRubric.totalPoints);
    }
    
    setShowRubricPreview(false);
    setRubricFile(null);
    setSuccessMessage('Rubric extracted successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Pre-populate form in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingAssignment && isOpen) {
      console.log('🔄 Pre-populating form in edit mode');
      console.log('📊 Existing assignment:', existingAssignment);
      console.log('📊 Total points from DB:', existingAssignment.total_points, typeof existingAssignment.total_points);
      
      setTitle(existingAssignment.title || '');
      setDescription(existingAssignment.description || '');
      setAssignmentPrompt(existingAssignment.assignment_prompt || '');
      setCriteria(existingAssignment.grading_criteria || '');
      setDocumentType(existingAssignment.document_type || 'personal_narrative');
      
      // Ensure totalPoints is a number
      const points = existingAssignment.total_points 
        ? (typeof existingAssignment.total_points === 'number' 
            ? existingAssignment.total_points 
            : parseFloat(existingAssignment.total_points as any))
        : 100;
      
      console.log('📊 Setting totalPoints to:', points, typeof points);
      setTotalPoints(points);
    }
  }, [mode, existingAssignment, isOpen]);

  // Clear messages when modal is closed from parent
  useEffect(() => {
    if (!isOpen) {
      setSuccessMessage(null);
      setWarningMessage(null);
    }
  }, [isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (mode === 'edit' && existingAssignment) {
        return updateAssignment(existingAssignment.id, data);
      }
      return createAssignment(data);
    },
    onSuccess: (response: any) => {
      const action = mode === 'edit' ? 'updated' : 'created';
      console.log(`✅ Assignment ${action} successfully`, response);
      console.log('📊 Response structure:', {
        hasAssignment: !!response.assignment,
        hasParseWarning: !!response.parseWarning,
        parseWarning: response.parseWarning
      });
      
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Check for parse warning in response
      if (response.parseWarning) {
        console.log('⚠️ Setting warning message');
        setWarningMessage(`Assignment ${action} but rubric format not recognized. Use "Enhance with AI" or enter rubric in standard format.`);
      } else {
        console.log('✅ Setting success message');
        setSuccessMessage(`"${title}" has been ${action} successfully!`);
      }
    },
    onError: (error) => {
      const action = mode === 'edit' ? 'update' : 'create';
      console.error(`❌ Error ${action}ing assignment:`, error);
      alert(`Failed to ${action} assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCriteria('');
    setTotalPoints(100);
    setDocumentType('personal_narrative');
    setWarningMessage(null);
    setSuccessMessage(null);
  };

  const handleDismissMessage = () => {
    // Don't prevent default or stop propagation, let it bubble naturally like the X button
    console.log('🔄 OK Button Clicked - calling resetForm and onClose');
    
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (createMutation.isPending) {
      console.log('⏳ Already creating assignment, ignoring duplicate submission');
      return;
    }
    
    if (!title.trim()) {
      alert('Please enter an assignment title');
      return;
    }
    
    console.log('📝 Creating assignment:', { title: title.trim(), document_type: documentType, has_criteria: !!criteria.trim() });
    createMutation.mutate({ 
      title: title.trim(), 
      description: description.trim() || undefined,
      assignment_prompt: assignmentPrompt.trim() || undefined,
      grading_criteria: criteria.trim() || undefined,
      document_type: documentType,
      total_points: totalPoints,
    });
  };

  const handleClose = () => {
    if (createMutation.isPending) {
      return; // Don't close while creating
    }
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 border-2 border-blue-200 dark:border-blue-800 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {mode === 'edit' ? 'Edit Assignment' : 'New Assignment'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              disabled={createMutation.isPending || !!successMessage || !!warningMessage}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <Label htmlFor="assignment-title" className="text-gray-700 dark:text-gray-300 font-medium">
              Assignment Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Persuasive Essay #1"
              className="mt-1 border-2 focus:border-blue-500"
              disabled={createMutation.isPending}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="document-type" className="text-gray-700 dark:text-gray-300 font-medium">
              Document Type
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="mt-1 border-2 focus:border-blue-500">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {ELA_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Helps AI provide more relevant feedback
            </p>
          </div>

          {/* Rubric Import Section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
            <Label className="text-sm font-medium flex items-center gap-2">
              Import Rubric <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleRubricFileSelect}
                disabled={isExtractingRubric || createMutation.isPending}
                className="flex-1 cursor-pointer text-sm"
              />
              <Button
                type="button"
                onClick={handleRubricUpload}
                disabled={!rubricFile || isExtractingRubric || createMutation.isPending}
                variant="secondary"
                size="sm"
                className="flex-shrink-0"
              >
                {isExtractingRubric ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Extract Rubric'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a PDF, DOCX, or DOC document containing your rubric. We'll extract the criteria for you.
              <br />
              <span className="text-muted-foreground/80">Word documents are automatically converted to PDF for processing.</span>
            </p>
          </div>

          <div>
            <Label htmlFor="assignment-description" className="text-gray-700 dark:text-gray-300 font-medium">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="assignment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this assignment..."
              className="mt-1 border-2 focus:border-blue-500 min-h-[80px]"
              disabled={createMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="assignment-prompt" className="text-gray-700 dark:text-gray-300 font-medium">
              Assignment Prompt <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="assignment-prompt"
              value={assignmentPrompt}
              onChange={(e) => setAssignmentPrompt(e.target.value)}
              placeholder="Enter the instructions given to students for this assignment (e.g., 'Write a 5-paragraph persuasive essay arguing for or against school uniforms')..."
              className="mt-1 border-2 focus:border-blue-500 min-h-[100px]"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Student-facing instructions that help the AI understand what students were asked to do
            </p>
          </div>

          <div>
            <CriteriaInput
              value={criteria}
              onChange={setCriteria}
              totalPoints={totalPoints}
              onTotalPointsChange={setTotalPoints}
              showCard={false}
              title="Grading Criteria"
              required={false}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissMessage}
                className="bg-green-600 hover:bg-green-700 text-white h-9 px-3 rounded-md text-sm font-medium transition-colors"
              >
                OK
              </button>
            </div>
          )}

          {/* Warning Message */}
          {warningMessage && (
            <div className="flex items-start justify-between gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Assignment Saved (with warning)</p>
                  <p className="text-xs mt-1">{warningMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissMessage}
                className="bg-yellow-600 hover:bg-yellow-700 text-white h-9 px-3 rounded-md text-sm font-medium transition-colors flex-shrink-0"
              >
                OK
              </button>
            </div>
          )}

          {/* Actions - Hide when showing success/warning message */}
          {!successMessage && !warningMessage && (
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !title.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {mode === 'edit' ? 'Update Assignment' : 'Create Assignment'}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Rubric Preview Modal */}
      <RubricPreviewModal
        isOpen={showRubricPreview}
        onClose={() => setShowRubricPreview(false)}
        onAccept={handleAcceptRubric}
        extractedRubric={extractedRubric}
      />
    </div>
  );
}
