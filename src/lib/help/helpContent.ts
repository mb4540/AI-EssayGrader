/**
 * Help Content Registry
 * 
 * Single source of truth for all help content in the app.
 * Used by:
 * - ContextHelp component (blue ⓘ icons)
 * - Help page (/help)
 */

export type HelpId =
  // Grade Submission page
  | 'grade.studentInfo'
  | 'grade.gradingCriteria'
  | 'grade.studentEssay'
  | 'grade.gradeAndFeedback'
  // Dashboard
  | 'dashboard.overview'
  | 'dashboard.viewModes'
  | 'dashboard.filters'
  // Students / Bridge
  | 'students.bridgeOverview'
  | 'students.importCsv'
  | 'students.classPeriods'
  | 'students.bulkAssign'
  | 'students.exportImport'
  // Assignments
  | 'assignments.createEdit'
  | 'assignments.sourceText'
  // Settings
  | 'settings.aiProvider'
  | 'settings.customPrompts'
  // Annotations
  | 'annotations.pdf';

export interface HelpBlock {
  title: string;
  summary: string;
  bullets?: string[];
  tips?: string[];
  warnings?: string[];
}

export const HELP_CONTENT: Record<HelpId, HelpBlock> = {
  // ─────────────────────────────────────────────────────────────
  // GRADE SUBMISSION PAGE
  // ─────────────────────────────────────────────────────────────
  'grade.studentInfo': {
    title: 'Student Information',
    summary: 'Select which student you are grading and optionally link to an assignment.',
    bullets: [
      'Choose a student from your roster (requires unlocking the Bridge first)',
      'Filter by class period to narrow down the list',
      'Optionally select an Assignment to auto-fill grading criteria',
      'The Student UUID is auto-generated and used for FERPA-compliant cloud storage',
    ],
    tips: [
      'No students showing? Go to the Students tab to add your roster and unlock the Bridge.',
      'Selecting an assignment saves time by pre-filling your rubric.',
    ],
  },

  'grade.gradingCriteria': {
    title: 'Grading Criteria',
    summary: 'Define how the AI should evaluate the essay. You can write simple rules and let AI expand them.',
    bullets: [
      'Enter your grading rules in plain English (e.g., "Check grammar, organization, evidence")',
      'Set the total points for the assignment',
      'Click "Enhance With AI" to turn simple rules into a detailed rubric',
      'The Assignment Prompt helps the AI understand what students were asked to do',
    ],
    tips: [
      'Start simple! Just write what you care about and let AI create the detailed rubric.',
      'If you selected an assignment, the criteria may auto-fill from that assignment.',
    ],
  },

  'grade.studentEssay': {
    title: 'Student Essay',
    summary: 'Upload or paste the student\'s work. Supports text, images, PDFs, and Word documents.',
    bullets: [
      'TEXT tab: Copy and paste the essay directly',
      'IMAGE tab: Upload a photo of handwritten work (use AI Vision for best results)',
      'Drop a PDF or DOCX file to extract text automatically',
      'Use "Single Essay" for one submission or "Draft Comparison" to compare rough and final drafts',
    ],
    tips: [
      'For handwritten essays, take a clear photo in good lighting.',
      'Toggle "AI Vision" for better handwriting recognition.',
      'Draft Comparison mode grades improvement between versions.',
    ],
  },

  'grade.gradeAndFeedback': {
    title: 'Grade & Feedback',
    summary: 'Review the AI\'s suggested grade and feedback, then make any adjustments before saving.',
    bullets: [
      'Click "Run Grade" to get AI-suggested scores and feedback',
      'Review each criterion score and the overall grade',
      'Edit the grade or feedback if you disagree with the AI',
      'Click "Save Final Grade" when you\'re satisfied',
    ],
    tips: [
      'You\'re the teacher! The AI is just making suggestions—your judgment matters.',
      'Inline annotations show specific issues in the essay text.',
    ],
    warnings: [
      'Grading typically takes 10-30 seconds. Please wait for it to complete.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────
  'dashboard.overview': {
    title: 'Dashboard Overview',
    summary: 'View and manage all your graded submissions in one place.',
    bullets: [
      'See all submissions with student names, grades, and dates',
      'Click any submission to view or edit it',
      'Export grades to CSV for your gradebook',
      'Delete submissions or entire assignments',
    ],
    warnings: [
      'Deleting an assignment removes ALL submissions for that assignment permanently.',
    ],
  },

  'dashboard.viewModes': {
    title: 'View Modes',
    summary: 'Organize submissions the way that works best for you.',
    bullets: [
      'List View: See everything at once, sortable by name, grade, or date',
      'By Assignment: Group submissions into folders by assignment title',
      'By Class: Group by class period, then by student',
    ],
    tips: [
      'Use "By Assignment" when grading a whole class set.',
      'Use "By Class" to see all work from a specific period.',
    ],
  },

  'dashboard.filters': {
    title: 'Filters & Sorting',
    summary: 'Narrow down submissions by class period, date range, or sort order.',
    bullets: [
      'Filter by class period to see only students from that class',
      'Use date range presets (Today, This Week, etc.) or custom dates',
      'Toggle sort direction (newest/oldest first)',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // STUDENTS / BRIDGE
  // ─────────────────────────────────────────────────────────────
  'students.bridgeOverview': {
    title: 'Student Identity Bridge',
    summary: 'The Bridge keeps student names secure and FERPA-compliant by storing them locally on your computer.',
    bullets: [
      'Student names are encrypted in a local file—never sent to our servers',
      'Our cloud only sees anonymous UUIDs, not real names',
      'You must unlock the Bridge with your passphrase to see student names',
      'Lock the Bridge when stepping away from your computer',
    ],
    warnings: [
      'If you lose your passphrase, we cannot recover your student roster.',
      'Always back up your Bridge file to a secure location.',
    ],
  },

  'students.importCsv': {
    title: 'Import Students from CSV',
    summary: 'Quickly add many students at once by importing a CSV file.',
    bullets: [
      'CSV format: name, localId (required), classPeriod (optional)',
      'Example: "John Smith,12345,Period 1"',
      'Existing students (matched by localId) will be updated',
      'New students will be added automatically',
    ],
    tips: [
      'Export your roster from your gradebook as CSV first.',
      'Include class period in the 3rd column to auto-assign students.',
    ],
  },

  'students.classPeriods': {
    title: 'Class Periods',
    summary: 'Organize students into class periods for easier filtering throughout the app.',
    bullets: [
      'Add class periods manually or import them via CSV',
      'Each student can be assigned to one class period',
      'Filter by class period on the Grade page and Dashboard',
      'Class periods show student counts for quick reference',
    ],
  },

  'students.bulkAssign': {
    title: 'Bulk Assign Class Period',
    summary: 'Select multiple students and assign them to a class period at once.',
    bullets: [
      'Use checkboxes to select students in the roster table',
      'Choose a class period from the dropdown',
      'Click "Assign Class Period" to update all selected students',
      'Changes sync to the database automatically',
    ],
  },

  'students.exportImport': {
    title: 'Export & Import Bridge',
    summary: 'Back up your student roster or transfer it to another computer.',
    bullets: [
      'Export Bridge: Download an encrypted backup file',
      'Import Bridge: Restore your roster from a backup',
      'Store backups on a secure USB drive or school network',
    ],
    warnings: [
      'The backup is encrypted with your passphrase—you\'ll need it to restore.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ASSIGNMENTS
  // ─────────────────────────────────────────────────────────────
  'assignments.createEdit': {
    title: 'Create & Edit Assignments',
    summary: 'Pre-define assignments with rubrics so you can grade faster.',
    bullets: [
      'Set a title, description, and grading criteria',
      'Optionally attach a source text (book, article) for book reports',
      'When grading, select the assignment to auto-fill criteria',
      'Edit assignments anytime from the Dashboard or Grade page',
    ],
    tips: [
      'Create assignments before grading to save time on repeated rubrics.',
    ],
  },

  'assignments.sourceText': {
    title: 'Source Texts (Book Reports)',
    summary: 'Attach a source text to an assignment so the AI can evaluate comprehension.',
    bullets: [
      'Upload a PDF, DOCX, or TXT file as the source text',
      'Add a writing prompt describing what students should address',
      'The AI will check if students accurately reference the source',
      'Great for book reports, article responses, and document analysis',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────────────────────
  'settings.aiProvider': {
    title: 'AI Provider & Model',
    summary: 'Choose which AI model grades your essays.',
    bullets: [
      'Gemini 2.5 Pro (recommended): Fast and accurate',
      'OpenAI GPT-4o: Alternative option',
      'Changes apply immediately to new grading requests',
    ],
  },

  'settings.customPrompts': {
    title: 'Custom Prompts',
    summary: 'Fine-tune how the AI grades by customizing the system prompts.',
    bullets: [
      'Rubric Prompt: How AI expands your simple rules into a rubric',
      'Grading Prompt: How AI evaluates essays against the rubric',
      'Feedback Prompt: How AI writes student feedback',
    ],
    tips: [
      'Most teachers don\'t need to change these—defaults work well.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ANNOTATIONS
  // ─────────────────────────────────────────────────────────────
  'annotations.pdf': {
    title: 'PDF Annotations',
    summary: 'Mark up PDF or Word documents directly with highlights, drawings, and comments.',
    bullets: [
      'Switch to the "Annotate" tab after uploading a PDF/DOCX',
      'Use drawing tools to highlight or circle text',
      'Add text comments anywhere on the document',
      'Print or export the annotated version',
    ],
    tips: [
      'Annotations are saved automatically with the submission.',
    ],
  },
};

/**
 * Get help content by ID
 */
export function getHelpContent(id: HelpId): HelpBlock {
  return HELP_CONTENT[id];
}

/**
 * Get all help IDs for a given prefix (e.g., 'grade' returns all grade.* IDs)
 */
export function getHelpIdsByPrefix(prefix: string): HelpId[] {
  return (Object.keys(HELP_CONTENT) as HelpId[]).filter(id => id.startsWith(prefix));
}
