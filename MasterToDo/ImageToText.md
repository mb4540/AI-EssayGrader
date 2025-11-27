# Plan: Image to Text (Verbatim Transcription)

**Goal:** Implement a high-accuracy, verbatim handwriting transcription feature using Multimodal LLMs (Vision).

**Target Models:** 
- **Primary (Recommended):** `gemini-2.5-pro` (Stable) - Best for reasoning/handwriting.
- **Alternative:** `gpt-4o` (OpenAI) - For users who prefer or only have OpenAI keys.

**Rationale:** 
- **Accuracy:** Gemini 2.5 Pro is optimized for complex reasoning and handling messy handwriting ("gibberish" from Tesseract is a major pain point).
- **Flexibility:** The system should support both providers (OpenAI/Gemini) consistent with the rest of the application, but default to the best tool for the job.
- **Verbatim Requirement:** The system must extract text *exactly* as written, including spelling and grammar errors, to ensure authentic grading.
- **Fallback:** The existing "Enhance Text" (OCR Cleanup) feature will serve as a fallback if the raw LLM output is still difficult to read.

---

## 🛠️ Implementation Tasks

### Phase 1: Backend (Netlify Function)
- [ ] **Create `netlify/functions/transcribe-image.ts`**
    - **Inputs:** 
        - `image`: Base64 encoded image string.
        - `provider`: 'gemini' | 'openai' (optional, defaults to gemini).
    - **Environment Variables:** Check for `GEMINI_API_KEY` and `OPENAI_API_KEY`.
    - **Model Configuration:** 
        - If Gemini: Use `gemini-2.5-pro`.
        - If OpenAI: Use `gpt-4o`.
    - **System Prompt:** 
        > "Transcribe the handwritten text in the image exactly as it appears. Do not correct, rephrase, or alter the words. Provide a literal and verbatim transcription. Preserve all spelling errors, punctuation errors, and grammatical mistakes. Do not add any conversational text or markdown formatting like 'Here is the text:'. Return ONLY the raw text."
    - **Error Handling:** Handle API limits, invalid images, and generic failures.
    - **Response:** JSON object `{ text: "extracted text..." }`.

### Phase 2: Frontend (UI Components)
- [ ] **Update `src/components/FileDrop.tsx`** (Image Tab)
    - **State Management:** 
        - Read preferred provider from localStorage (or Settings).
        - Add a toggle/indicator: "Using AI Vision (Gemini)" or "Using AI Vision (GPT-4o)".
    - **API Call:** Replace the call to `extractTextFromImage` with a call to the new `transcribe-image` endpoint.
    - **Loading State:** The Vision API will be slower than local Tesseract. Ensure the loading spinner says "Analyzing handwriting with AI..." or similar.
    - **Fallback Button:** If the AI result is messy, the "Clean Text" button (Enhance Text) is already present in the text tab. Ensure the flow allows the user to edit/clean the result *after* transcription.

### Phase 3: Settings & Configuration
- [ ] **Update `src/components/SettingsModal.tsx`**
    - Add a section for "Handwriting Recognition".
    - **Model Selection:** Allow user to override the global provider specifically for handwriting if desired (e.g., use OpenAI for grading but Gemini for handwriting).
    - **API Key Check:** Ensure the UI warns if the required API key is missing.

### Phase 4: Testing & Refinement
- [ ] **Test Cases:**
    - Clear handwriting.
    - Messy/Cursive handwriting.
    - Image with mixed text/drawing.
    - Non-text image (should handle gracefully).
- [ ] **Verification:**
    - Does it preserve spelling errors? (Crucial).
    - Does it hallucinations? (Gemini 2.5 Pro should be low hallucination for this).

---

## 📝 User Workflow
1.  **Upload:** Teacher uploads an image of a student essay in the "Image" tab.
2.  **Process:** System automatically sends to `transcribe-image`.
    - Uses Gemini 2.5 Pro by default (or user's preference).
    - *Loading Indicator:* "Transcribing..."
3.  **Result:** Raw, verbatim text appears in the editor.
4.  **Review:** Teacher checks text.
    - *Scenario A (Good):* Text matches image (including errors). Teacher proceeds to grade.
    - *Scenario B (Messy):* Handwriting was too bad. Teacher clicks "Clean Text" (Sparkles icon) to use the secondary "OCR Cleanup" AI pass.
