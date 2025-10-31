import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Save, RotateCcw } from 'lucide-react';
import { ELA_DOCUMENT_TYPES } from '@/lib/documentTypes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default prompts (fallback if not in localStorage)
const DEFAULT_GRADING_PROMPT = `You are a professional writing evaluator. Grade strictly according to the provided rubric and teacher's criteria. Preserve the student's original words; do not rewrite their work. Provide clear, direct, constructive feedback that identifies specific issues with concrete examples from the text. Focus on: grammar, spelling, punctuation, capitalization, sentence structure, organization, evidence quality, and clarity. Be honest about weaknesses while acknowledging strengths. Use professional language appropriate for educational feedback. Never include personal data about the student.`;

const DEFAULT_OCR_PROMPT = `You are a text cleanup assistant for handwritten essay OCR results.

Your ONLY job is to:
1. Fix spelling errors
2. Fix spacing issues (remove extra spaces, add missing spaces)
3. Remove OCR artifacts (|, ®, ©, random symbols that aren't punctuation)
4. Fix obvious character recognition errors (e.g., "helgE" → "help", "opfibhe" → "of the")

CRITICAL RULES:
- DO NOT change the student's words, ideas, or sentence structure
- DO NOT add or remove sentences
- DO NOT improve grammar or style
- DO NOT change punctuation (except fixing obvious OCR errors)
- Keep the exact same meaning and content
- Preserve line breaks and paragraph structure

Output ONLY the cleaned text, nothing else.`;

const DEFAULT_RUBRIC_PROMPT = `You are an expert educator helping teachers create detailed, effective grading rubrics.

Your task: Transform simple grading rules into a clear, comprehensive rubric that:
- Uses a 100-point scale
- Breaks down into specific categories with point values
- Provides clear criteria for each category
- Is concise but thorough (aim for 150-300 words)
- Uses bullet points for easy scanning
- Includes any penalties if relevant

Keep the rubric practical and easy to apply. Focus on clarity over complexity.

Format example:
Scoring (100 pts total):
- Category Name (XX pts): specific criteria
- Another Category (XX pts): what to look for

Penalties (if applicable):
- Issue: -X pts`;

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [gradingPrompt, setGradingPrompt] = useState(DEFAULT_GRADING_PROMPT);
  const [ocrPrompt, setOcrPrompt] = useState(DEFAULT_OCR_PROMPT);
  const [rubricPrompt, setRubricPrompt] = useState(DEFAULT_RUBRIC_PROMPT);
  const [selectedDocType, setSelectedDocType] = useState('personal_narrative');
  const [docTypePrompt, setDocTypePrompt] = useState('');

  // Load prompts from localStorage on mount
  useEffect(() => {
    const savedGrading = localStorage.getItem('ai_grading_prompt');
    const savedOcr = localStorage.getItem('ai_ocr_prompt');
    const savedRubric = localStorage.getItem('ai_rubric_prompt');

    if (savedGrading) setGradingPrompt(savedGrading);
    if (savedOcr) setOcrPrompt(savedOcr);
    if (savedRubric) setRubricPrompt(savedRubric);
  }, []);

  // Load document type prompt when selection changes
  useEffect(() => {
    const docType = ELA_DOCUMENT_TYPES.find(t => t.id === selectedDocType);
    const savedPrompt = localStorage.getItem(`ai_doctype_${selectedDocType}_prompt`);
    
    if (savedPrompt) {
      setDocTypePrompt(savedPrompt);
    } else if (docType?.gradingFocus) {
      setDocTypePrompt(docType.gradingFocus);
    } else {
      setDocTypePrompt('');
    }
  }, [selectedDocType]);

  const handleSave = () => {
    localStorage.setItem('ai_grading_prompt', gradingPrompt);
    localStorage.setItem('ai_ocr_prompt', ocrPrompt);
    localStorage.setItem('ai_rubric_prompt', rubricPrompt);
    localStorage.setItem(`ai_doctype_${selectedDocType}_prompt`, docTypePrompt);
    
    alert('Settings saved! Note: These prompts are stored locally in your browser.');
  };

  const handleReset = (type: 'grading' | 'ocr' | 'rubric' | 'doctype') => {
    if (!confirm('Reset this prompt to default?')) return;
    
    switch (type) {
      case 'grading':
        setGradingPrompt(DEFAULT_GRADING_PROMPT);
        break;
      case 'ocr':
        setOcrPrompt(DEFAULT_OCR_PROMPT);
        break;
      case 'rubric':
        setRubricPrompt(DEFAULT_RUBRIC_PROMPT);
        break;
      case 'doctype':
        const docType = ELA_DOCUMENT_TYPES.find(t => t.id === selectedDocType);
        if (docType?.gradingFocus) {
          setDocTypePrompt(docType.gradingFocus);
          localStorage.removeItem(`ai_doctype_${selectedDocType}_prompt`);
        }
        break;
    }
    
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">AI Prompt Settings</h2>
            <p className="text-blue-100 text-sm mt-1">Customize AI behavior for grading, OCR, and rubrics</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="grading" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="grading">Essay Grading</TabsTrigger>
              <TabsTrigger value="ocr">OCR Cleanup</TabsTrigger>
              <TabsTrigger value="rubric">Rubric Enhancement</TabsTrigger>
              <TabsTrigger value="doctypes">Document Types</TabsTrigger>
            </TabsList>

            {/* Essay Grading Tab */}
            <TabsContent value="grading" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Essay Grading System Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('grading')}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This prompt controls how the AI grades student essays. It sets the tone, grading approach, and output format.
              </p>
              <Textarea
                value={gradingPrompt}
                onChange={(e) => {
                  setGradingPrompt(e.target.value);
                  
                }}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter grading prompt..."
              />
            </TabsContent>

            {/* OCR Cleanup Tab */}
            <TabsContent value="ocr" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">OCR Text Cleanup Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('ocr')}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This prompt controls how the AI cleans up text from handwritten essay images (OCR results).
              </p>
              <Textarea
                value={ocrPrompt}
                onChange={(e) => {
                  setOcrPrompt(e.target.value);
                  
                }}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter OCR cleanup prompt..."
              />
            </TabsContent>

            {/* Rubric Enhancement Tab */}
            <TabsContent value="rubric" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Rubric Enhancement Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('rubric')}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This prompt controls how the AI transforms simple grading rules into detailed rubrics.
              </p>
              <Textarea
                value={rubricPrompt}
                onChange={(e) => {
                  setRubricPrompt(e.target.value);
                  
                }}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter rubric enhancement prompt..."
              />
            </TabsContent>

            {/* Document Types Tab */}
            <TabsContent value="doctypes" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Document Type Grading Focus</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('doctype')}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize the grading focus for each document type. This guides the AI on what to emphasize when evaluating that type of writing.
              </p>
              
              <div>
                <Label htmlFor="doctype-select" className="text-sm font-medium mb-2 block">
                  Select Document Type
                </Label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger id="doctype-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELA_DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                value={docTypePrompt}
                onChange={(e) => {
                  setDocTypePrompt(e.target.value);
                  
                }}
                className="min-h-[250px] font-mono text-sm"
                placeholder="Enter grading focus for this document type..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                <strong>Tip:</strong> This text is added to the AI prompt when grading this document type. 
                Focus on what makes this type of writing unique and what criteria are most important.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>How it works:</strong> These prompts are stored locally in your browser and sent to the AI with each request. 
            Changes take effect immediately for all AI features (grading, OCR cleanup, and rubric enhancement). 
            Note: Prompts will not sync across devices - each browser stores its own settings.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
