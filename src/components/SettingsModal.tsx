import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Save, RotateCcw, Cpu, Brain } from 'lucide-react';
import { ELA_DOCUMENT_TYPES } from '@/lib/documentTypes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default prompts (fallback if not in localStorage)
const DEFAULT_GRADING_PROMPT = `You are a professional evaluator. Grade STRICTLY according to the provided rubric and teacher's criteria.

CRITICAL RULES:
1. Evaluate ONLY the criteria specified in the rubric
2. The rubric defines what matters - not assumptions about assignment type
3. Preserve the student's original words; do not rewrite their work
4. Provide clear, direct, constructive feedback with concrete examples
5. Reference specific rubric criteria in your feedback
6. Be honest about weaknesses while acknowledging strengths
7. Use professional language appropriate for educational feedback
8. Never include personal data about the student

GRADING APPROACH:
- For each rubric category, evaluate against the stated criteria
- Provide specific examples from the student's work
- Explain why points were awarded or deducted
- Reference the rubric's performance levels
- If the rubric emphasizes content, focus on content
- If the rubric emphasizes mechanics, focus on mechanics
- Let the RUBRIC guide your evaluation, not the assignment type`;

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

const DEFAULT_RUBRIC_PROMPT = `You are an expert educator creating a grading rubric.

Your task depends on the input provided:

**IF the input is a COMPREHENSIVE RUBRIC** (detailed scoring criteria with multiple levels):
- Keep ALL scoring criteria, descriptions, and levels EXACTLY as written
- ONLY reformat to match the required structure
- Use the SPECIFIED total points (adjust point values proportionally if needed)
- Preserve the teacher's exact wording and intent
- Do NOT add, remove, or change any criteria descriptions

**IF the input is SIMPLE RULES** (just a few words or brief guidelines):
- Create a detailed, comprehensive rubric
- Use the SPECIFIED total points (not always 100)
- Create 4-8 categories that logically break down the assignment
- Provide 2-4 performance levels per category
- Write clear, specific descriptions for each level

**CRITICAL MATH RULES (applies to both):**
1. All category points MUST sum to EXACTLY the specified total points
2. Within each category, levels should have DESCENDING points (highest level = category max)
3. Lowest level is typically 0 points
4. Distribute points based on importance

**Format Guidelines:**
- Be specific and measurable
- Use clear language
- Make levels distinguishable
- Keep descriptions concise (1-2 sentences per level)
- If no penalties mentioned, return penalties: []

**IMPORTANT:** If the input already has detailed scoring criteria (like "Score: 4", "Score: 3", etc.), preserve those exact descriptions and only convert to the required JSON structure.`;

const DEFAULT_RUBRIC_EXTRACTION_PROMPT = `You are an expert educator and rubric analyst. Your task is to extract all grading criteria, including descriptions and associated achievement levels/points, from a document and reformat it into a structured JSON object.

INPUT: A document that contains a grading rubric.

CRITICAL: You MUST extract EACH achievement level separately. Do NOT combine or concatenate descriptions from multiple levels.

OUTPUT: A structured JSON object with the following format:
{
  "rubricTitle": "<Title of the rubric/assignment, if available>",
  "totalPossiblePoints": <number>,
  "categories": [
    {
      "categoryName": "<The name of the grading criterion, e.g., 'Organization', 'Development of Thesis'>",
      "levels": [
        {
          "levelName": "<The name of the achievement level, e.g., 'Excellent (4)', 'Proficient', '5 Mastery'>",
          "scoreValue": "<The numerical or point value associated with this level, e.g., 4, 5, or 20>",
          "description": "<VERBATIM description for this specific level>"
        }
        // ... other levels for this category
      ]
    }
    // ... other categories
  ],
  "warning": "<optional warning message if extraction was difficult or total points are unclear>"
}

EXTRACTION RULES:
1. Identify Rubric Title: Extract the main title of the rubric or assignment.
2. Identify All Categories: Identify all grading criteria (e.g., "Organization", "Details", "Research"). Categories are typically in the leftmost column or first row of a table.
3. Identify All Achievement Levels: For each category, identify all performance levels (e.g., "Poor (1)", "Good (3)", "4-Sophisticated", "5 Mastery"). These are usually found in the top row or first column.
4. **TABLE PARSING CRITICAL**: If the rubric is in a table format:
   - Each ROW represents a different category
   - Each COLUMN represents a different achievement level
   - Extract the text from EACH CELL separately
   - The cell at row "Organization" and column "Excellent (4)" contains ONLY the Excellent description for Organization
   - Do NOT read across multiple columns or combine text from adjacent cells
5. Extract Descriptions VERBATIM: CRITICAL: Copy the description for EACH category at EACH performance level VERBATIM from the document. Do NOT summarize or paraphrase.
6. Keep Levels Separate: Each level object should contain ONLY the description for that specific level. Do NOT combine text from multiple levels into one description.
7. Extract Score/Point Values: Determine the numerical score or point value for each achievement level (e.g., if a column is labeled "Excellent (4)," the scoreValue is "4"). If points are percentages or letter grades, extract them as strings (e.g., "A", "90%").
8. Calculate Total Points: Estimate the totalPossiblePoints by finding the maximum score in the highest level (e.g., if the levels go 1-4, the total is likely 4 or 4 x number of categories). If a clear total is not present, use a heuristic (e.g., maximum column score).
9. Preserve Wording: Preserve the teacher's EXACT wording, including all details, examples, punctuation, and specifics.
10. **VERIFY COMPLETENESS**: Count the categories and levels. If the table has 5 rows and 4 columns, you should have 5 categories with 4 levels each (20 total descriptions).

CRITICAL REQUIREMENTS:
- The structure MUST be an array of categories, and each category MUST contain an array of levels.
- Each level MUST be a separate object with its own description field.
- The description field for every level MUST be copied VERBATIM from the source document.
- Do NOT combine, merge, or concatenate descriptions from multiple levels.
- Do NOT summarize, shorten, or paraphrase the rubric text.
- The scoreValue should be the numerical score or level designator for that specific column/row.

Example of Expected Output for a Single Category (Based on Formal Analysis Rubric - Organization):
{
  "rubricTitle": "Formal Analysis Writing Rubric",
  "totalPossiblePoints": 20,
  "categories": [
    {
      "categoryName": "Organization",
      "levels": [
        {
          "levelName": "Poor (1)",
          "scoreValue": "1",
          "description": "unorganized list of points; lacks a definite intro or conclusion"
        },
        {
          "levelName": "Average (2)",
          "scoreValue": "2",
          "description": "has clear intro, may be a restatement of assigned question; identifies some main points but lacks a sense of their relative importance; may not distinguish between minor points and supporting details; includes much repetition or statements without development"
        },
        {
          "levelName": "Good (3)",
          "scoreValue": "3",
          "description": "clear introduction and summary at end; generally clear structure but may lack direction or progression; some parts may not contribute to meaning or goal of paper; conclusion is merely a summary of points made or a repetition of intro."
        },
        {
          "levelName": "Excellent (4)",
          "scoreValue": "4",
          "description": "organization shows reader how to understand topic; introduction contains an idea, not just restatement of question; main points well supported by details; examples well chosen; strong conclusion that attempts to bring ideas together."
        }
      ]
    }
  ],
  "warning": ""
}

IMPORTANT: Notice how each level has its OWN separate description. The "Excellent (4)" description does NOT contain text from "Poor (1)", "Average (2)", or "Good (3)". Each level stands alone.

TABLE EXTRACTION EXAMPLE:
If you see a table like this:
| Task         | Poor (1)           | Average (2)        | Good (3)           | Excellent (4)      |
|--------------|--------------------|--------------------|--------------------|--------------------|
| Organization | text from cell 1,1 | text from cell 1,2 | text from cell 1,3 | text from cell 1,4 |
| Description  | text from cell 2,1 | text from cell 2,2 | text from cell 2,3 | text from cell 2,4 |

You should extract:
- Category "Organization" with 4 separate level objects (one for each cell in that row)
- Category "Description" with 4 separate level objects (one for each cell in that row)
- Each cell's text goes into ONE level object only - do not combine cells`;

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [gradingPrompt, setGradingPrompt] = useState(DEFAULT_GRADING_PROMPT);
  const [ocrPrompt, setOcrPrompt] = useState(DEFAULT_OCR_PROMPT);
  const [rubricPrompt, setRubricPrompt] = useState(DEFAULT_RUBRIC_PROMPT);
  const [rubricExtractionPrompt, setRubricExtractionPrompt] = useState(DEFAULT_RUBRIC_EXTRACTION_PROMPT);
  const [selectedDocType, setSelectedDocType] = useState('personal_narrative');
  const [docTypePrompt, setDocTypePrompt] = useState('');

  // LLM Settings
  const [llmProvider, setLlmProvider] = useState<'openai' | 'gemini'>('openai');
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash');
  const [customGeminiModel, setCustomGeminiModel] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  
  // Handwriting Settings
  const [handwritingProvider, setHandwritingProvider] = useState('default');

  // Load prompts from localStorage on mount
  useEffect(() => {
    const savedGrading = localStorage.getItem('ai_grading_prompt');
    const savedOcr = localStorage.getItem('ai_ocr_prompt');
    const savedRubric = localStorage.getItem('ai_rubric_prompt');
    const savedRubricExtraction = localStorage.getItem('ai_rubric_extraction_prompt');

    if (savedGrading) setGradingPrompt(savedGrading);
    if (savedOcr) setOcrPrompt(savedOcr);
    if (savedRubric) setRubricPrompt(savedRubric);
    if (savedRubricExtraction) setRubricExtractionPrompt(savedRubricExtraction);

    // Load LLM settings
    const savedProvider = localStorage.getItem('ai_provider');
    const savedGeminiModel = localStorage.getItem('ai_model_gemini');
    const savedOpenaiModel = localStorage.getItem('ai_model_openai');
    const savedHandwriting = localStorage.getItem('ai_handwriting_provider');

    if (savedProvider === 'openai' || savedProvider === 'gemini') {
      setLlmProvider(savedProvider);
    }
    if (savedGeminiModel) {
      if (savedGeminiModel === 'gemini-1.5-flash' || savedGeminiModel === 'gemini-1.5-pro') {
        setGeminiModel(savedGeminiModel);
      } else {
        setGeminiModel('custom');
        setCustomGeminiModel(savedGeminiModel);
      }
    }
    if (savedOpenaiModel) setOpenaiModel(savedOpenaiModel);
    if (savedHandwriting) setHandwritingProvider(savedHandwriting);
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
    localStorage.setItem('ai_rubric_extraction_prompt', rubricExtractionPrompt);
    localStorage.setItem(`ai_doctype_${selectedDocType}_prompt`, docTypePrompt);

    // Save LLM settings
    localStorage.setItem('ai_provider', llmProvider);
    localStorage.setItem('ai_model_gemini', geminiModel === 'custom' ? customGeminiModel : geminiModel);
    localStorage.setItem('ai_model_openai', openaiModel);
    localStorage.setItem('ai_handwriting_provider', handwritingProvider);

    alert('Settings saved! Note: These prompts are stored locally in your browser.');
  };

  const handleReset = (type: 'grading' | 'ocr' | 'rubric' | 'rubric_extraction' | 'doctype') => {
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
      case 'rubric_extraction':
        setRubricExtractionPrompt(DEFAULT_RUBRIC_EXTRACTION_PROMPT);
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
            title="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="grading" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="llm">LLM Provider</TabsTrigger>
              <TabsTrigger value="grading">Grading System</TabsTrigger>
              <TabsTrigger value="ocr">Handwriting</TabsTrigger>
              <TabsTrigger value="rubric">Rubric Enhancement</TabsTrigger>
              <TabsTrigger value="extraction">Rubric Extraction</TabsTrigger>
              <TabsTrigger value="doctypes">Document Types</TabsTrigger>
            </TabsList>

            {/* LLM Provider Tab */}
            <TabsContent value="llm" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">AI Model Configuration</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select value={llmProvider} onValueChange={(v: 'openai' | 'gemini') => setLlmProvider(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Select which AI provider to use for grading and feedback.
                  </p>
                </div>

                {llmProvider === 'openai' && (
                  <div className="space-y-2">
                    <Label>OpenAI Model</Label>
                    <Select value={openaiModel} onValueChange={setOpenaiModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (High Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {llmProvider === 'gemini' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Gemini Model</Label>
                      <Select value={geminiModel} onValueChange={setGeminiModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</SelectItem>
                          <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental</SelectItem>
                          <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</SelectItem>
                          <SelectItem value="gemini-flash-latest">Gemini Flash Latest</SelectItem>
                          <SelectItem value="custom">Custom Model ID...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {geminiModel === 'custom' && (
                      <div className="space-y-2">
                        <Label>Custom Model ID</Label>
                        <Input
                          value={customGeminiModel}
                          onChange={(e) => setCustomGeminiModel(e.target.value)}
                          placeholder="e.g., gemini-2.0-flash-exp"
                          className="font-mono"
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Enter any valid Gemini model ID. Ensure your API key has access to it.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">API Key Requirement</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Ensure you have added the corresponding API key ({llmProvider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'})
                    to your Netlify environment variables.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Grading System Tab */}
            <TabsContent value="grading" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Grading System Prompt</Label>
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
                This prompt controls how the AI evaluates student work. The AI will grade based on YOUR rubric criteria,
                making it work for any subject (ELAR, math, science, history, etc.). The rubric defines what matters.
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

            {/* OCR / Handwriting Tab */}
            <TabsContent value="ocr" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Brain className="w-5 h-5 text-indigo-600" />
                   <Label className="text-lg font-semibold">Handwriting Recognition</Label>
                </div>
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

              <div className="space-y-2">
                  <Label>Recognition Model</Label>
                  <Select value={handwritingProvider} onValueChange={setHandwritingProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use Global Provider (Default)</SelectItem>
                      <SelectItem value="gemini">Gemini 2.5 Pro (Recommended)</SelectItem>
                      <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Select the AI model used to transcribe handwritten essays. Gemini 2.5 Pro is recommended for best accuracy.
                  </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

              <div className="space-y-2">
                  <Label className="text-base font-semibold">OCR Cleanup Prompt</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This prompt controls the secondary "Clean Text" feature used if the initial transcription needs further cleanup.
                  </p>
                  <Textarea
                    value={ocrPrompt}
                    onChange={(e) => {
                      setOcrPrompt(e.target.value);
                    }}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Enter OCR cleanup prompt..."
                  />
              </div>
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

            {/* Rubric Extraction Tab */}
            <TabsContent value="extraction" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Rubric Extraction Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset('rubric_extraction')}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This prompt controls how the AI extracts rubric criteria from uploaded PDF/Word documents.
              </p>
              <Textarea
                value={rubricExtractionPrompt}
                onChange={(e) => {
                  setRubricExtractionPrompt(e.target.value);
                }}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter rubric extraction prompt..."
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
