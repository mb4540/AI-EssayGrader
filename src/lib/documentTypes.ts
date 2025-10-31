/**
 * Document Types for ELA/English
 * Simplified implementation - ELA only
 */

export interface DocumentType {
  id: string;
  label: string;
  description?: string;
  rubricTemplate?: string;
  gradingFocus?: string;
}

/**
 * ELA Document Types
 * Common writing types for English/Language Arts
 */
export const ELA_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'personal_narrative',
    label: 'Personal Narrative',
    description: 'A story about a personal experience',
    gradingFocus: 'Focus on storytelling elements: clear sequence of events, sensory details, personal reflection, engaging introduction, and meaningful conclusion. Evaluate narrative techniques like dialogue, pacing, and descriptive language.',
    rubricTemplate: `Focus and Theme: Clear focus on a specific event or experience
Narrative Elements: Characters, setting, conflict, and resolution
Descriptive Language: Sensory details and vivid descriptions
Organization: Logical sequence with clear beginning, middle, end
Voice and Style: Personal voice and engaging narrative style
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'argumentative',
    label: 'Argumentative Essay',
    description: 'Takes a position and supports it with evidence',
    gradingFocus: 'Focus on claim clarity, evidence quality, reasoning, counterarguments, and logical organization. Evaluate how well the writer supports their position with credible sources and addresses opposing viewpoints.',
    rubricTemplate: `Claim/Thesis: Clear, arguable position statement
Evidence: Relevant, credible sources and examples
Reasoning: Logical connections between claim and evidence
Counterarguments: Addresses opposing views effectively
Organization: Logical structure with clear progression
Conventions: Grammar, spelling, punctuation, citations`,
  },
  {
    id: 'informational',
    label: 'Informational/Explanatory',
    description: 'Explains a topic or process',
    gradingFocus: 'Focus on clarity of explanation, accuracy of information, logical organization, and use of appropriate examples. Evaluate how well the writer breaks down complex topics for reader understanding.',
    rubricTemplate: `Topic Development: Clear, focused explanation of topic
Organization: Logical structure (chronological, cause-effect, etc.)
Supporting Details: Relevant facts, definitions, examples
Clarity: Clear explanations accessible to audience
Transitions: Smooth connections between ideas
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'literary_analysis',
    label: 'Literary Analysis',
    description: 'Analyzes a piece of literature',
    gradingFocus: 'Focus on thesis about the literary work, textual evidence, literary devices, interpretation depth, and analytical reasoning. Evaluate understanding of themes, characters, and author\'s craft.',
    rubricTemplate: `Thesis: Clear analytical claim about the text
Textual Evidence: Specific quotes and examples from text
Literary Analysis: Discussion of themes, devices, techniques
Interpretation: Insightful analysis beyond plot summary
Organization: Clear structure supporting thesis
Conventions: Grammar, spelling, punctuation, citations`,
  },
  {
    id: 'compare_contrast',
    label: 'Compare & Contrast',
    description: 'Compares two or more things',
    gradingFocus: 'Focus on clear identification of similarities and differences, balanced treatment of subjects, meaningful criteria for comparison, and insightful conclusions about the comparison.',
    rubricTemplate: `Thesis: Clear statement of comparison purpose
Criteria: Meaningful points of comparison
Balance: Equal treatment of both subjects
Organization: Point-by-point or block structure
Analysis: Insightful conclusions from comparison
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'research_paper',
    label: 'Research Paper',
    description: 'In-depth research on a topic',
    gradingFocus: 'Focus on research quality, source credibility, synthesis of information, proper citations, and depth of analysis. Evaluate how well the writer integrates multiple sources to support their thesis.',
    rubricTemplate: `Research Question/Thesis: Clear focus for research
Source Quality: Credible, relevant sources
Synthesis: Integration of multiple sources
Analysis: Original insights beyond sources
Organization: Logical structure with clear sections
Citations: Proper format (MLA, APA, etc.)
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'book_review',
    label: 'Book Review/Report',
    description: 'Review or summary of a book',
    gradingFocus: 'Focus on summary accuracy, evaluation of book\'s strengths and weaknesses, supported opinions, and recommendations. Evaluate critical thinking about the book\'s themes, characters, and overall quality.',
    rubricTemplate: `Summary: Accurate overview without spoilers
Analysis: Discussion of themes, characters, style
Evaluation: Supported opinions about book quality
Evidence: Specific examples from the book
Recommendation: Clear audience and rating
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'descriptive',
    label: 'Descriptive Essay',
    description: 'Describes a person, place, or thing',
    gradingFocus: 'Focus on sensory details, vivid imagery, spatial organization, and creating a clear mental picture for the reader. Evaluate use of figurative language and descriptive techniques.',
    rubricTemplate: `Dominant Impression: Clear focus/mood throughout
Sensory Details: Appeals to five senses
Figurative Language: Metaphors, similes, imagery
Organization: Logical spatial or emphatic order
Vivid Language: Precise, descriptive word choice
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'creative_writing',
    label: 'Creative Writing/Short Story',
    description: 'Original creative fiction',
    gradingFocus: 'Focus on plot development, character development, setting, dialogue, narrative techniques, and creative originality. Evaluate storytelling craft and engagement.',
    rubricTemplate: `Plot: Engaging story with conflict and resolution
Characters: Developed, believable characters
Setting: Vivid time and place descriptions
Dialogue: Natural, purposeful conversations
Creativity: Original ideas and unique voice
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'poetry',
    label: 'Poetry',
    description: 'Original poem',
    gradingFocus: 'Focus on poetic devices (imagery, metaphor, rhythm, sound), emotional impact, originality, and adherence to form if specified. Evaluate creative use of language and meaning.',
    rubricTemplate: `Imagery: Vivid sensory language and figurative devices
Sound: Rhythm, rhyme, alliteration, assonance (if applicable)
Meaning: Clear theme or emotional impact
Creativity: Original ideas and unique expression
Form: Adherence to specified form (if assigned)
Conventions: Intentional grammar and punctuation choices`,
  },
  {
    id: 'reflection',
    label: 'Reflection',
    description: 'Reflects on learning or experience',
    gradingFocus: 'Focus on depth of reflection, personal growth insights, connections to learning, and honest self-assessment. Evaluate critical thinking about experiences and learning process.',
    rubricTemplate: `Experience Description: Clear account of what happened
Personal Insight: Thoughtful reflection on meaning
Growth: Evidence of learning or change
Connections: Links to broader concepts or goals
Honesty: Genuine, thoughtful self-assessment
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'summary',
    label: 'Summary',
    description: 'Summarizes a text or event',
    gradingFocus: 'Focus on accuracy, completeness of main ideas, conciseness, objectivity, and proper paraphrasing. Evaluate ability to identify and convey essential information without personal opinion.',
    rubricTemplate: `Main Ideas: Includes all key points
Accuracy: Faithful to original source
Conciseness: Brief, focused on essentials
Objectivity: No personal opinions or bias
Paraphrasing: Own words, not copying
Conventions: Grammar, spelling, punctuation`,
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other writing type',
    gradingFocus: 'Focus on general writing quality: clear purpose, organization, development of ideas, and conventions. Evaluate based on standard writing criteria.',
    rubricTemplate: `Purpose: Clear writing goal and focus
Organization: Logical structure and flow
Development: Well-supported ideas
Clarity: Clear, effective communication
Voice: Appropriate tone for audience
Conventions: Grammar, spelling, punctuation`,
  },
];

/**
 * Get document type by ID
 */
export function getDocumentType(id: string): DocumentType | undefined {
  return ELA_DOCUMENT_TYPES.find((type) => type.id === id);
}

/**
 * Get document type label by ID
 */
export function getDocumentTypeLabel(id: string): string {
  const type = getDocumentType(id);
  return type?.label || 'Essay';
}
