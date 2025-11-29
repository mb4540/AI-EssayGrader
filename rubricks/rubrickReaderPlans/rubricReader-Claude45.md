# Rubric Reader Feature - Implementation Plan

**Created:** 2024-11-29  
**Feature:** Extract rubrics from PDF/DOCX documents using Multimodal LLM  
**Model:** Gemini 2.5 Pro (Multimodal)  
**Target Architecture:** Multimodal-first with intelligent fallback

---

## 📋 Feature Overview

Enable teachers to upload PDF or DOCX rubric documents and have Gemini 2.5 Pro extract and reformat the rubric criteria into the application's paragraph-style format. The system will parse various rubric layouts using multimodal vision capabilities for PDFs and text extraction for DOCX files.

### User Flow
1. Teacher clicks "Create Assignment" 
2. In the modal, they see a new "Import Rubric from Document" option
3. They upload a PDF or DOCX file containing a rubric
4. System processes the document using Gemini 2.5 Pro
5. System shows a **preview modal** with:
   - Extracted criteria in paragraph format
   - Total points detected (as distinct reviewable item)
   - Warning message (if LLM had difficulty)
6. Teacher reviews and can:
   - **Accept** - Populates the "Grading Criteria" field
   - **Edit** - Modify before accepting
   - **Cancel** - Discard and try again
7. File is discarded after extraction (not stored)

---

## 🎯 Requirements Summary

| Requirement | Decision |
|------------|----------|
| **LLM Model** | Gemini 2.5 Pro (multimodal) - use user's Gemini model setting |
| **Upload Location** | Create Assignment modal only |
| **User Experience** | Preview with review/edit before accepting (Option B) |
| **Validation** | Extract whatever LLM finds, teacher reviews. Show point values clearly. |
| **File Storage** | Temporary only - discard after extraction |
| **Error Handling** | Create default rubric + warning if LLM struggles |

---

## 📁 Sample Documents Analysis

The `/rubricks` folder contains 6 sample documents to test against:

### PDF Files
1. **ArgumentativeEssayRubric.pdf** (68KB)
2. **college-writing-research-paper-rubric-2025.pdf** (30KB)
3. **staar-6-english-ii-informational-rubric.pdf** (505KB)

### DOCX/DOC Files
4. **5th narrative NEW.Edmond.doc** (43KB) - Legacy Word format
5. **Hist Research assign and rubric FULL PACKET.docx** (73KB)
6. **formal-analysis-writing-rubric_spivey1.docx** (43KB)

### Expected Rubric Variations
Based on common rubric formats, expect to encounter:
- **Point-based:** "Organization (20 pts): clear intro, body, conclusion"
- **Level-based:** "Exemplary (4): Exceeds expectations..."
- **Range-based:** "90-100: Excellent work..."
- **Percentage-based:** "Content (40%): demonstrates mastery..."
- **Mixed formats:** Combination of above
- **Embedded in larger documents:** Rubric is part of assignment packet

---

## 🏗️ Architecture

### Components

```
Frontend (React)
├── CreateAssignmentModal.tsx (Modified)
│   └── New: RubricUploadSection component
│       ├── File upload input (PDF/DOCX only)
│       ├── Upload button with loading state
│       └── Preview modal for extracted rubric
│
Backend (Netlify Functions)
└── extract-rubric-from-document.ts (New)
    ├── Parse PDF/DOCX to text/image
    ├── Send to Gemini 2.5 Pro (multimodal)
    ├── Return structured rubric data
    └── Include warning flag if extraction uncertain
```

### Data Flow

```
User uploads file
    ↓
Frontend validates (PDF/DOCX, max 5MB)
    ↓
Send to extract-rubric-from-document function
    ↓
Backend processes file:
  - PDF → Convert to base64 image for Gemini vision
  - DOCX → Extract text using mammoth
    ↓
Send to Gemini 2.5 Pro with extraction prompt
    ↓
Gemini returns structured rubric JSON
    ↓
Backend converts to paragraph format
    ↓
Return to frontend with warning flag
    ↓
Show preview modal
    ↓
Teacher accepts → populate criteria field
```

---

## 🔧 Implementation Plan

### Phase 1: Backend Function (Netlify Function)

**File:** `netlify/functions/extract-rubric-from-document.ts`

#### Inputs
```typescript
{
  file: File (base64 encoded),
  fileName: string,
  fileType: 'pdf' | 'docx' | 'doc',
  totalPoints?: number // Optional, default 100
}
```

#### Outputs
```typescript
{
  success: boolean,
  rubricText: string, // Paragraph format
  totalPoints: number,
  warning?: string, // If LLM had difficulty
  error?: string
}
```

#### Implementation Steps

1. **Accept file upload** (multipart/form-data or base64)
2. **Process file based on type:**
   - **PDF:** Convert to base64 image (or multiple images if multi-page)
   - **DOCX:** Use `mammoth` to extract text (already in package.json)
3. **Get user's Gemini model setting**
   - Read from request body (passed from frontend)
   - Default to `gemini-2.0-flash-exp` if not specified
4. **Send to Gemini 2.5 Pro with extraction prompt** (see Prompt Design below)
5. **Parse Gemini response**
   - Extract rubric criteria
   - Detect total points
   - Check for warning indicators
6. **Convert to paragraph format**
   - Match the format shown in screenshot
   - Example: `"- Organization (20): clear intro, body, conclusion"`
7. **Return response**

#### Libraries Needed
```json
{
  "mammoth": "^1.6.0",  // Already in package.json
  "@google/generative-ai": "^0.24.1", // Already in package.json
  "pdf-lib": "^1.17.1"  // Already in package.json (for PDF manipulation if needed)
}
```

**Note:** For PDF processing, we'll convert pages to images and send to Gemini's vision API.

---

### Phase 2: Gemini Prompt Design

**Goal:** Extract rubric criteria from various document formats and convert to paragraph style.

#### System Prompt

```
You are an expert educator and rubric analyst. Your task is to extract grading rubric criteria from a document and reformat it into a simple, paragraph-style format.

INPUT: Either an image of a PDF page or text extracted from a DOCX document that contains a grading rubric.

OUTPUT: A structured JSON object with the following format:
{
  "totalPoints": <number>,
  "criteria": [
    {
      "category": "<category name>",
      "points": <number>,
      "description": "<brief description>"
    }
  ],
  "warning": "<optional warning message if extraction was difficult>"
}

EXTRACTION RULES:
1. Identify all grading categories (e.g., "Organization", "Evidence", "Grammar")
2. Extract point values for each category
3. Keep descriptions brief (1-2 sentences max)
4. Preserve the teacher's exact wording when possible
5. If point values don't sum to expected total, note in warning
6. If no clear rubric is found, create a default rubric based on document content

COMMON RUBRIC FORMATS TO RECOGNIZE:
- "Category (XX pts): description"
- "Category: XX points - description"
- "Score 4: description (XX pts)"
- "Exemplary (XX%): description"
- Tables with categories, points, and descriptions

CRITICAL:
- Total points MUST be a number
- Each category MUST have a point value
- Descriptions should be concise and actionable
- If the document has no clear rubric, set warning and create a basic rubric

PARAGRAPH FORMAT EXAMPLE:
Input: "Organization (20 pts): Essay has clear introduction, body paragraphs, and conclusion"
Output: 
{
  "category": "Organization",
  "points": 20,
  "description": "clear introduction, body paragraphs, and conclusion"
}
```

#### User Prompt Template

```
Extract the grading rubric from the following document.

Expected total points: {totalPoints}

{For PDF: "Analyze the image below and extract the rubric."}
{For DOCX: "Document text:\n{extractedText}"}

Return a JSON object with the rubric criteria in paragraph format.
```

#### Gemini API Configuration

```typescript
const model = genAI.getGenerativeModel({ 
  model: userGeminiModel || 'gemini-2.0-flash-exp',
  generationConfig: {
    responseMimeType: "application/json"
  }
});

// For PDF (multimodal)
const result = await model.generateContent([
  systemPrompt,
  {
    inlineData: {
      data: base64Image,
      mimeType: "image/png" // or "image/jpeg"
    }
  }
]);

// For DOCX (text)
const result = await model.generateContent([
  systemPrompt,
  `Document text:\n${extractedText}`
]);
```

---

### Phase 3: Frontend Component

**File:** `src/components/CreateAssignmentModal.tsx` (Modify)

#### New UI Section

Add between "Document Type" and "Description" fields:

```tsx
{/* Rubric Import Section */}
<div className="space-y-2">
  <Label>Import Rubric (Optional)</Label>
  <div className="flex gap-2">
    <Input
      type="file"
      accept=".pdf,.docx,.doc"
      onChange={handleRubricFileSelect}
      disabled={isUploading}
    />
    <Button
      type="button"
      onClick={handleRubricUpload}
      disabled={!rubricFile || isUploading}
    >
      {isUploading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Extracting...
        </>
      ) : (
        'Extract Rubric'
      )}
    </Button>
  </div>
  <p className="text-sm text-muted-foreground">
    Upload a PDF or Word document containing your rubric. 
    We'll extract the criteria for you.
  </p>
</div>
```

#### Preview Modal

**File:** `src/components/RubricPreviewModal.tsx` (New)

```tsx
interface RubricPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (rubricText: string) => void;
  extractedRubric: {
    rubricText: string;
    totalPoints: number;
    warning?: string;
  };
}

export default function RubricPreviewModal({ 
  isOpen, 
  onClose, 
  onAccept,
  extractedRubric 
}: RubricPreviewModalProps) {
  const [editedText, setEditedText] = useState(extractedRubric.rubricText);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Extracted Rubric</DialogTitle>
        </DialogHeader>

        {/* Warning Message */}
        {extractedRubric.warning && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{extractedRubric.warning}</AlertDescription>
          </Alert>
        )}

        {/* Total Points Display */}
        <div className="bg-muted p-3 rounded-md">
          <span className="font-semibold">Total Points: </span>
          <span className="text-lg">{extractedRubric.totalPoints}</span>
        </div>

        {/* Editable Rubric Text */}
        <div className="space-y-2">
          <Label>Grading Criteria</Label>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            Review and edit the extracted criteria before accepting.
          </p>
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onAccept(editedText)}>
            Accept & Use This Rubric
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### State Management

```typescript
const [rubricFile, setRubricFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const [extractedRubric, setExtractedRubric] = useState<any>(null);

const handleRubricFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
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
  
  setIsUploading(true);
  try {
    // Get user's Gemini model from localStorage
    const geminiModel = localStorage.getItem('geminiModel') || 'gemini-2.0-flash-exp';
    
    // Convert file to base64
    const base64 = await fileToBase64(rubricFile);
    
    // Call backend function
    const response = await fetch('/.netlify/functions/extract-rubric-from-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: base64,
        fileName: rubricFile.name,
        fileType: rubricFile.type,
        totalPoints: totalPoints,
        geminiModel
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setExtractedRubric(data);
      setShowPreview(true);
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Rubric upload error:', error);
    alert('Failed to extract rubric. Please try again.');
  } finally {
    setIsUploading(false);
  }
};

const handleAcceptRubric = (rubricText: string) => {
  setCriteria(rubricText); // Populate the main criteria field
  setShowPreview(false);
  setRubricFile(null);
};
```

---

### Phase 4: API Client

**File:** `src/lib/api.ts` (Add function)

```typescript
export async function extractRubricFromDocument(
  file: File,
  totalPoints: number,
  geminiModel: string
): Promise<{
  success: boolean;
  rubricText: string;
  totalPoints: number;
  warning?: string;
  error?: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('totalPoints', totalPoints.toString());
  formData.append('geminiModel', geminiModel);

  const response = await fetch('/.netlify/functions/extract-rubric-from-document', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract rubric');
  }

  return response.json();
}
```

---

## 🧪 Testing Strategy

### Unit Tests

1. **Backend Function Tests**
   - Test PDF processing (convert to image)
   - Test DOCX text extraction
   - Test Gemini response parsing
   - Test error handling (invalid file, Gemini failure)

2. **Frontend Component Tests**
   - Test file upload validation
   - Test preview modal rendering
   - Test accept/cancel actions
   - Test error states

### Integration Tests

1. **End-to-End Flow**
   - Upload each of the 6 sample documents
   - Verify extracted rubrics are accurate
   - Verify point totals are correct
   - Verify warnings appear when appropriate

2. **Edge Cases**
   - Document with no rubric (should create default + warning)
   - Document with partial rubric (should extract what's there + warning)
   - Document with non-standard format (should do best effort)
   - Very large document (should handle gracefully)

### Manual Testing Checklist

- [ ] Upload ArgumentativeEssayRubric.pdf
- [ ] Upload college-writing-research-paper-rubric-2025.pdf
- [ ] Upload staar-6-english-ii-informational-rubric.pdf
- [ ] Upload 5th narrative NEW.Edmond.doc
- [ ] Upload Hist Research assign and rubric FULL PACKET.docx
- [ ] Upload formal-analysis-writing-rubric_spivey1.docx
- [ ] Verify Gemini 2.5 Pro model works
- [ ] Test with invalid file type (should reject)
- [ ] Test with file > 5MB (should reject)
- [ ] Test edit functionality in preview modal
- [ ] Test cancel in preview modal
- [ ] Test accept in preview modal
- [ ] Verify criteria field populates correctly

---

## 📊 Success Criteria

### Must Have
- ✅ Extract rubric from PDF files (using Gemini vision)
- ✅ Extract rubric from DOCX files (using text extraction)
- ✅ Use Gemini 2.5 Pro (user's model setting)
- ✅ Show preview with total points as distinct item
- ✅ Allow teacher to edit before accepting
- ✅ Show warning if extraction uncertain
- ✅ Discard file after extraction

### Should Have
- ✅ Handle various rubric formats (point-based, level-based, etc.)
- ✅ Preserve teacher's exact wording
- ✅ Validate file type and size
- ✅ Provide helpful error messages
- ✅ Loading states during upload

### Nice to Have
- 📝 Support for legacy .doc files (best effort)
- 📝 Detect rubric in multi-page documents
- 📝 Extract penalties section if present
- 📝 Suggest improvements to rubric

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All 6 sample documents tested
- [ ] Gemini 2.5 Pro tested
- [ ] Error handling verified
- [ ] UI/UX reviewed
- [ ] Code reviewed
- [ ] Tests passing

### Environment Variables
```bash
# Already configured
GEMINI_API_KEY=...
```

### Dependencies to Install
```bash
# All dependencies already in package.json
# mammoth, @google/generative-ai, pdf-lib
```

### Files to Create
- [ ] `netlify/functions/extract-rubric-from-document.ts`
- [ ] `src/components/RubricPreviewModal.tsx`

### Files to Modify
- [ ] `src/components/CreateAssignmentModal.tsx`
- [ ] `src/lib/api.ts`

---

## 🔮 Future Enhancements

### Phase 2 Features (Post-MVP)
1. **Rubric Library**
   - Save extracted rubrics for reuse
   - Share rubrics between teachers
   - Template library of common rubrics

2. **Advanced Extraction**
   - Multi-page PDF support
   - Better table detection
   - Support for more file formats

3. **Rubric Validation**
   - Check for common rubric issues
   - Suggest improvements
   - Validate point distribution

4. **Batch Processing**
   - Upload multiple rubric documents
   - Extract and compare
   - Merge rubrics

---

## 📝 Notes & Considerations

### Technical Decisions

1. **Why Gemini 2.5 Pro?**
   - Multimodal capabilities for PDF vision
   - Better at understanding complex layouts
   - Matches user's existing LLM preference

2. **Why not store files?**
   - Reduces storage costs
   - Simplifies data management
   - Teacher can re-upload if needed

3. **Why preview instead of auto-populate?**
   - LLM extraction may not be perfect
   - Teacher needs to verify accuracy
   - Allows for corrections before use

### Known Limitations

1. **Legacy .doc files**
   - Harder to parse than .docx
   - May have lower accuracy
   - Recommend converting to .docx first

2. **Scanned PDFs**
   - Gemini can handle OCR
   - But quality depends on scan quality
   - May need manual review

3. **Complex layouts**
   - Tables may not parse perfectly
   - Multi-column layouts challenging
   - LLM does best effort

### Security Considerations

1. **File validation**
   - Check file type and size
   - Sanitize file names
   - Limit upload rate

2. **LLM input sanitization**
   - Remove potential injection attempts
   - Limit text length sent to LLM
   - Validate LLM response structure

3. **Error messages**
   - Don't expose system details
   - Provide helpful user feedback
   - Log errors server-side

---

## 📚 References

### Existing Code to Reference
- `src/lib/docx.ts` - Document parsing utilities
- `src/lib/calculator/rubricParser.ts` - Rubric parsing logic
- `src/lib/calculator/rubricBuilder.ts` - Rubric building logic
- `netlify/functions/enhance-rubric.ts` - LLM rubric enhancement
- `src/components/CreateAssignmentModal.tsx` - Assignment creation UI
- `src/components/SettingsModal.tsx` - LLM settings management

### External Documentation
- [Gemini API - Multimodal](https://ai.google.dev/gemini-api/docs/vision)
- [Gemini API - JSON Mode](https://ai.google.dev/gemini-api/docs/json-mode)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX parsing

---

## ✅ Implementation Checklist

### Phase 1: Backend (Netlify Function)
- [ ] Create `extract-rubric-from-document.ts`
- [ ] Implement file parsing (PDF → image, DOCX → text)
- [ ] Implement Gemini prompt
- [ ] Add Gemini integration
- [ ] Implement response formatting
- [ ] Add error handling
- [ ] Test with sample documents

### Phase 2: Frontend (React Components)
- [ ] Create `RubricPreviewModal.tsx`
- [ ] Modify `CreateAssignmentModal.tsx`
- [ ] Add file upload UI
- [ ] Add loading states
- [ ] Add preview modal integration
- [ ] Add error handling
- [ ] Test user flow

### Phase 3: Integration & Testing
- [ ] Test with all 6 sample documents
- [ ] Test Gemini 2.5 Pro
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Manual QA testing
- [ ] Code review

### Phase 4: Documentation & Deployment
- [ ] Update README.md
- [ ] Update MasterToDo.md
- [ ] Add user documentation
- [ ] Deploy to staging
- [ ] Final testing
- [ ] Deploy to production

---

**End of Plan**
