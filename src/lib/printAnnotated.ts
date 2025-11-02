/**
 * Generate print-friendly HTML with inline annotations
 * 
 * Displays essay text with double-spacing, highlights, and inline feedback
 */

import type { Feedback } from './schema';
import type { Annotation } from './annotations/types';

interface PrintAnnotatedData {
  student_name: string;
  student_id?: string;
  assignment_title?: string;
  verbatim_text: string;
  teacher_criteria: string;
  ai_grade?: number;
  ai_feedback?: Feedback;
  teacher_grade?: number;
  teacher_feedback?: string;
  created_at: string;
  annotations: Annotation[];
}

export function generateAnnotatedPrintHTML(data: PrintAnnotatedData): string {
  const date = new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const finalGrade = data.teacher_grade ?? data.ai_grade ?? 0;

  // Filter to only approved or teacher-created annotations
  const activeAnnotations = data.annotations.filter(
    a => a.status === 'teacher_approved' || a.status === 'teacher_created' || a.status === 'ai_suggested'
  );

  // Render essay with annotations
  const annotatedEssay = renderAnnotatedEssay(data.verbatim_text, activeAnnotations);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Graded Submission - ${data.student_name}</title>
  <style>
    @media print {
      @page { margin: 0.75in; }
      body { margin: 0; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 2.0; /* Double-spaced */
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
      line-height: 1.4;
    }
    
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
    }
    
    .info-section {
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 15px 20px;
      margin-bottom: 25px;
      border-radius: 4px;
      line-height: 1.6;
    }
    
    .info-section h2 {
      color: #1e40af;
      font-size: 18px;
      margin: 0 0 12px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 8px;
      font-size: 14px;
    }
    
    .info-label {
      font-weight: 600;
      color: #475569;
    }
    
    .info-value {
      color: #1a1a1a;
    }
    
    .grade-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 24px;
      font-weight: bold;
    }
    
    .section {
      margin: 30px 0;
      line-height: 1.6;
    }
    
    .section h3 {
      color: #1e40af;
      font-size: 20px;
      margin: 0 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .essay-text {
      font-family: 'Courier New', monospace;
      font-size: 12pt;
      white-space: pre-wrap;
      background: #fafafa;
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      line-height: 2.0; /* Double-spaced for annotations */
    }
    
    .annotated-line {
      display: block;
      margin-bottom: 0.5em;
    }
    
    .highlight {
      background-color: #fef08a;
      padding: 2px 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    .annotation-note {
      display: block;
      color: #dc2626;
      font-style: italic;
      font-size: 10pt;
      margin-left: 20px;
      margin-top: 4px;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    
    .annotation-category {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9pt;
    }
    
    .unmatched-annotations {
      background: #fef2f2;
      border: 2px solid #fca5a5;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      line-height: 1.6;
    }
    
    .unmatched-annotations h4 {
      color: #991b1b;
      font-size: 14px;
      margin: 0 0 10px 0;
    }
    
    .no-print {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .print-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .print-btn:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <h1>📝 Graded Essay Submission with Annotations</h1>
    <div class="subtitle">EssayEase - Generated on ${date}</div>
  </div>

  <div class="info-section">
    <h2>👤 Student Information</h2>
    <div class="info-grid">
      <div class="info-label">Student:</div>
      <div class="info-value">${data.student_name}</div>
      ${data.assignment_title ? `
        <div class="info-label">Assignment:</div>
        <div class="info-value">${data.assignment_title}</div>
      ` : ''}
      <div class="info-label">Date:</div>
      <div class="info-value">${date}</div>
      <div class="info-label">Final Grade:</div>
      <div class="info-value"><span class="grade-badge">${finalGrade}/100</span></div>
      <div class="info-label">Annotations:</div>
      <div class="info-value">${activeAnnotations.length} inline comments</div>
    </div>
  </div>

  <div class="section">
    <h3>📝 Student Essay with Inline Annotations</h3>
    <div class="essay-text">${annotatedEssay}</div>
  </div>

  ${generateFeedbackSection(data)}

  <div class="footer">
    <p>Generated by EssayEase • ${date}</p>
    <p style="font-size: 10px; color: #94a3b8;">
      This document contains ${activeAnnotations.length} inline annotation(s) for teacher review.
    </p>
  </div>
</body>
</html>
  `;
}

function generateFeedbackSection(data: PrintAnnotatedData): string {
  const feedback = data.ai_feedback;
  if (!feedback) return '';

  const bulletproof = (feedback as any).bulletproof?.extracted_scores?.feedback;
  if (!bulletproof) return '';

  let html = '<div class="page-break"></div>\n';
  html += '<div class="section">\n';
  html += '<h3>📊 Grading Feedback</h3>\n';

  // Strengths
  if (bulletproof.strengths?.length > 0) {
    html += '<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px;">\n';
    html += '<h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">✓ Strengths</h4>\n';
    html += '<ul style="margin: 0; padding-left: 20px; line-height: 1.8;">\n';
    bulletproof.strengths.forEach((strength: string) => {
      html += `<li style="color: #047857;">${escapeHtml(strength)}</li>\n`;
    });
    html += '</ul>\n</div>\n';
  }

  // Areas for Improvement
  if (bulletproof.areas_for_improvement?.length > 0) {
    html += '<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px;">\n';
    html += '<h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">💡 Areas for Improvement</h4>\n';
    html += '<ul style="margin: 0; padding-left: 20px; line-height: 1.8;">\n';
    bulletproof.areas_for_improvement.forEach((area: string) => {
      html += `<li style="color: #1e40af;">${escapeHtml(area)}</li>\n`;
    });
    html += '</ul>\n</div>\n';
  }

  // Top 3 Suggestions
  if (bulletproof.top_3_suggestions?.length > 0) {
    html += '<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">\n';
    html += '<h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⭐ Top 3 Suggestions for Next Time</h4>\n';
    html += '<ol style="margin: 0; padding-left: 20px; line-height: 1.8;">\n';
    bulletproof.top_3_suggestions.forEach((suggestion: string) => {
      html += `<li style="color: #78350f;">${escapeHtml(suggestion)}</li>\n`;
    });
    html += '</ol>\n</div>\n';
  }

  // Teacher Feedback
  if (data.teacher_feedback) {
    html += '<div style="background: #faf5ff; border-left: 4px solid #9333ea; padding: 15px; margin: 15px 0; border-radius: 4px;">\n';
    html += '<h4 style="color: #6b21a8; margin: 0 0 10px 0; font-size: 16px;">👨‍🏫 Teacher Comments</h4>\n';
    html += `<p style="margin: 0; color: #581c87; line-height: 1.8;">${escapeHtml(data.teacher_feedback)}</p>\n`;
    html += '</div>\n';
  }

  html += '</div>\n';
  return html;
}

function renderAnnotatedEssay(text: string, annotations: Annotation[]): string {
  const lines = text.split('\n');
  const result: string[] = [];

  // Group annotations by line
  const annotationsByLine = new Map<number, Annotation[]>();
  const unmatchedAnnotations: Annotation[] = [];

  for (const annotation of annotations) {
    if (annotation.line_number > 0 && annotation.line_number <= lines.length) {
      if (!annotationsByLine.has(annotation.line_number)) {
        annotationsByLine.set(annotation.line_number, []);
      }
      annotationsByLine.get(annotation.line_number)!.push(annotation);
    } else {
      unmatchedAnnotations.push(annotation);
    }
  }

  // Render each line with its annotations
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const lineAnnotations = annotationsByLine.get(lineNumber) || [];

    if (lineAnnotations.length === 0) {
      // No annotations - just render the line
      result.push(`<span class="annotated-line">${escapeHtml(line)}</span>`);
    } else {
      // Has annotations - render with highlights
      let renderedLine = escapeHtml(line);
      
      // Sort annotations by start_offset
      const sortedAnnotations = [...lineAnnotations].sort((a, b) => a.start_offset - b.start_offset);
      
      // Apply highlights (simple approach - just highlight the quoted text)
      sortedAnnotations.forEach(annotation => {
        const quotedText = escapeHtml(annotation.quote);
        renderedLine = renderedLine.replace(quotedText, `<span class="highlight">${quotedText}</span>`);
      });
      
      result.push(`<span class="annotated-line">${renderedLine}</span>`);
      
      // Add annotation notes below the line
      sortedAnnotations.forEach(annotation => {
        result.push(
          `<span class="annotation-note">` +
          `<span class="annotation-category">${annotation.category}:</span> ` +
          `${escapeHtml(annotation.suggestion)}` +
          `</span>`
        );
      });
    }
  });

  // Add unmatched annotations at the bottom
  if (unmatchedAnnotations.length > 0) {
    result.push(`<div class="unmatched-annotations">`);
    result.push(`<h4>⚠️ Additional Comments:</h4>`);
    unmatchedAnnotations.forEach(annotation => {
      result.push(
        `<div style="margin: 8px 0;">` +
        `<strong>${annotation.category}:</strong> ${escapeHtml(annotation.suggestion)}` +
        `</div>`
      );
    });
    result.push(`</div>`);
  }

  return result.join('\n');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
