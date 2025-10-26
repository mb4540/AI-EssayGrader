// Utility functions for managing custom AI prompts

export function getCustomPrompts() {
  return {
    grading_prompt: localStorage.getItem('ai_grading_prompt') || undefined,
    ocr_prompt: localStorage.getItem('ai_ocr_prompt') || undefined,
    rubric_prompt: localStorage.getItem('ai_rubric_prompt') || undefined,
  };
}

export function hasCustomPrompts(): boolean {
  return !!(
    localStorage.getItem('ai_grading_prompt') ||
    localStorage.getItem('ai_ocr_prompt') ||
    localStorage.getItem('ai_rubric_prompt')
  );
}
