// Print Utilities Tests
// Tests for generating printable HTML and download functionality

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePrintHTML, printSubmission, downloadSubmissionHTML } from './print';
import type { Feedback } from './schema';

describe('Print Utilities', () => {
  const mockFeedback: Feedback = {
    overall_grade: 85,
    supportive_summary: 'Great work overall!',
    top_3_suggestions: ['Add more examples', 'Improve transitions', 'Check grammar'],
    grammar_findings: ['Missing comma in line 5'],
    spelling_findings: ['Misspelled "their" as "thier"'],
    structure_findings: ['Needs better transitions'],
    evidence_findings: ['Add more examples'],
    rubric_scores: [
      { category: 'Content', score: 85, comments: 'Good ideas' },
      { category: 'Organization', score: 90, comments: 'Well structured' },
    ],
    improvement_summary: 'Significant improvement from draft',
    growth_percentage: 15,
  };

  const baseData = {
    student_name: 'John Doe',
    student_id: 'S12345',
    assignment_title: 'Essay 1',
    verbatim_text: 'This is my essay text.',
    teacher_criteria: 'Focus on clarity and organization',
    ai_grade: 85,
    created_at: '2025-01-15T10:00:00Z',
  };

  describe('generatePrintHTML', () => {
    it('should generate valid HTML', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include student name', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('John Doe');
    });

    it('should include student ID when provided', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('S12345');
    });

    it('should include assignment title when provided', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('Essay 1');
    });

    it('should include essay text', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('This is my essay text.');
    });

    it('should include teacher criteria', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('Focus on clarity and organization');
    });

    it('should display AI grade when no teacher grade', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('85/100');
      expect(html).toContain('AI Assessment');
    });

    it('should display teacher grade when provided', () => {
      const data = { ...baseData, teacher_grade: 92 };
      const html = generatePrintHTML(data);

      expect(html).toContain('92/100');
      expect(html).toContain('Teacher Reviewed');
    });

    it('should prefer teacher grade over AI grade', () => {
      const data = { ...baseData, ai_grade: 85, teacher_grade: 92 };
      const html = generatePrintHTML(data);

      expect(html).toContain('92/100');
      expect(html).not.toContain('85/100');
    });

    it('should format date correctly', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('January 15, 2025');
    });

    it('should include print button', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('window.print()');
      expect(html).toContain('Print / Save as PDF');
    });

    it('should include CSS styles', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('<style>');
      expect(html).toContain('@media print');
      expect(html).toContain('</style>');
    });

    it('should handle missing optional fields', () => {
      const minimalData = {
        student_name: 'Jane Smith',
        teacher_criteria: 'Write well',
        created_at: '2025-01-15T10:00:00Z',
      };

      const html = generatePrintHTML(minimalData);

      expect(html).toContain('Jane Smith');
      expect(html).toContain('0/100'); // Default grade
    });

    it('should display comparison mode with drafts', () => {
      const data = {
        ...baseData,
        draft_mode: 'comparison' as const,
        rough_draft_text: 'First draft text',
        final_draft_text: 'Final draft text',
      };

      const html = generatePrintHTML(data);

      expect(html).toContain('Rough Draft');
      expect(html).toContain('Final Draft');
      expect(html).toContain('First draft text');
      expect(html).toContain('Final draft text');
    });

    it('should display single mode with verbatim text', () => {
      const data = {
        ...baseData,
        draft_mode: 'single' as const,
      };

      const html = generatePrintHTML(data);

      expect(html).toContain('Student Essay (Verbatim)');
      expect(html).toContain('This is my essay text.');
    });

    it('should include AI feedback when provided', () => {
      const data = { ...baseData, ai_feedback: mockFeedback };
      const html = generatePrintHTML(data);

      expect(html).toContain('AI Assessment Details');
      expect(html).toContain('Great work overall!');
      expect(html).toContain('Add more examples');
    });

    it('should include rubric scores', () => {
      const data = { ...baseData, ai_feedback: mockFeedback };
      const html = generatePrintHTML(data);

      expect(html).toContain('Content');
      expect(html).toContain('85/100');
      expect(html).toContain('Good ideas');
      expect(html).toContain('Organization');
      expect(html).toContain('90/100');
    });

    it('should include improvement summary', () => {
      const data = { ...baseData, ai_feedback: mockFeedback };
      const html = generatePrintHTML(data);

      expect(html).toContain('Improvement Analysis');
      expect(html).toContain('Significant improvement from draft');
      expect(html).toContain('15%');
    });

    it('should include grammar findings', () => {
      const data = { ...baseData, ai_feedback: mockFeedback };
      const html = generatePrintHTML(data);

      expect(html).toContain('Grammar Issues');
      expect(html).toContain('Missing comma in line 5');
    });

    it('should include spelling findings', () => {
      const data = { ...baseData, ai_feedback: mockFeedback };
      const html = generatePrintHTML(data);

      expect(html).toContain('Spelling Issues');
      expect(html).toContain('Misspelled "their" as "thier"');
    });

    it('should limit grammar findings to 10', () => {
      const manyFindings = Array(20).fill('Grammar issue');
      const data = {
        ...baseData,
        ai_feedback: { ...mockFeedback, grammar_findings: manyFindings },
      };
      const html = generatePrintHTML(data);

      const matches = html.match(/Grammar issue/g);
      expect(matches?.length).toBeLessThanOrEqual(10);
    });

    it('should include teacher feedback when provided', () => {
      const data = {
        ...baseData,
        teacher_feedback: 'Excellent work! Keep it up.',
      };
      const html = generatePrintHTML(data);

      expect(html).toContain('Teacher Comments');
      expect(html).toContain('Excellent work! Keep it up.');
    });

    it('should include footer with generation info', () => {
      const html = generatePrintHTML(baseData);

      expect(html).toContain('FastAI Grader');
      expect(html).toContain('Generated');
    });

    it('should handle special characters in text', () => {
      const data = {
        ...baseData,
        verbatim_text: 'Text with <html> & "quotes"',
      };
      const html = generatePrintHTML(data);

      expect(html).toContain('Text with <html> & "quotes"');
    });

    it('should preserve whitespace in essay text', () => {
      const data = {
        ...baseData,
        verbatim_text: 'Line 1\n\nLine 2\n  Indented',
      };
      const html = generatePrintHTML(data);

      expect(html).toContain('white-space: pre-wrap');
    });
  });

  describe('printSubmission', () => {
    let mockWindow: any;

    beforeEach(() => {
      mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        onload: null,
      };

      vi.spyOn(window, 'open').mockReturnValue(mockWindow);
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should open new window', () => {
      printSubmission(baseData);

      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('should write HTML to window', () => {
      printSubmission(baseData);

      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('should trigger print after load', () => {
      printSubmission(baseData);

      // Simulate onload
      mockWindow.onload();
      vi.advanceTimersByTime(250);

      expect(mockWindow.focus).toHaveBeenCalled();
      expect(mockWindow.print).toHaveBeenCalled();
    });

    it('should alert if popup blocked', () => {
      vi.spyOn(window, 'open').mockReturnValue(null);

      printSubmission(baseData);

      expect(window.alert).toHaveBeenCalledWith('Please allow popups to print the submission');
    });
  });

  describe('downloadSubmissionHTML', () => {
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {},
      } as any;

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create download link', () => {
      downloadSubmissionHTML(baseData);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should set correct filename', () => {
      downloadSubmissionHTML(baseData);

      expect(mockLink.download).toContain('graded-submission');
      expect(mockLink.download).toContain('John-Doe');
      expect(mockLink.download).toContain('.html');
    });

    it('should handle spaces in student name', () => {
      const data = { ...baseData, student_name: 'Jane Mary Smith' };
      downloadSubmissionHTML(data);

      expect(mockLink.download).toContain('Jane-Mary-Smith');
    });

    it('should create blob with HTML content', () => {
      downloadSubmissionHTML(baseData);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.href).toBe('blob:mock-url');
    });

    it('should clean up after download', () => {
      downloadSubmissionHTML(baseData);

      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
