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
  total_points?: number;
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

  <div class="page-break"></div>

  ${data.ai_feedback && (data.ai_feedback as any).bulletproof?.extracted_scores ? `
    <div class="section">
      <h3>📊 Detailed Grading Breakdown</h3>
      
      ${((data.ai_feedback as any).bulletproof.extracted_scores.scores || []).map((score: any) => {
        const rubric = (data.ai_feedback as any).bulletproof?.rubric;
        const criterion = rubric?.criteria?.find((c: any) => c.id === score.criterion_id);
        const maxPoints = criterion?.max_points;
        
        return `
          <div style="background: white; border: 2px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 12px 0;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div style="font-weight: 600; font-size: 15px; color: #1f2937;">${score.criterion_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
              <div style="text-align: right;">
                <span style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${score.points_awarded}</span>${maxPoints ? `<span style="font-size: 18px; font-weight: bold; color: #6b7280;">/${maxPoints}</span>` : ''}<span style="font-size: 12px; color: #6b7280; margin-left: 4px;">pts</span>
              </div>
            </div>
            <div style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
              ${score.level}
            </div>
            <div style="font-size: 13px; color: #374151; line-height: 1.6;">
              ${escapeHtml(score.rationale)}
            </div>
          </div>
        `;
      }).join('')}
      
      ${(data.ai_feedback as any).bulletproof?.computed_scores ? `
        <div style="background: linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%); border: 2px solid #c084fc; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <div style="font-size: 12px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">FINAL CALCULATION</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <div>
              <span style="color: #6b7280;">Raw Score:</span>
              <span style="font-family: 'Courier New', monospace; font-weight: 600; margin-left: 8px;">${((data.ai_feedback as any).bulletproof.computed_scores.raw_points || 0)} / ${((data.ai_feedback as any).bulletproof.computed_scores.max_points || 0)}</span>
            </div>
            <div>
              <span style="color: #6b7280;">Percentage:</span>
              <span style="font-family: 'Courier New', monospace; font-weight: bold; color: #8b5cf6; margin-left: 8px;">${((data.ai_feedback as any).bulletproof.computed_scores.percent || 0)}%</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 12px; font-family: 'Courier New', monospace;">
            ✓ Calculated with ${(data.ai_feedback as any).bulletproof.calculator_version || 'BulletProof'}
          </div>
        </div>
      ` : ''}
    </div>
  ` : ''}

  ${generateFeedbackSection(data)}

  <div class="page-break"></div>

  <div class="section">
    <h3>📋 Grading Criteria</h3>
    ${data.total_points ? `
      <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 12px 20px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
        <div style="font-size: 14px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Total Points Available</div>
        <div style="font-size: 36px; font-weight: bold; color: #78350f; margin: 5px 0;">${Number(data.total_points).toFixed(2)}</div>
        <div style="font-size: 12px; color: #92400e;">Maximum Points for this Assignment</div>
      </div>
    ` : ''}
    <div style="background: #fefce8; border: 2px solid #fde047; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <h4 style="color: #854d0e; font-size: 14px; margin: 0 0 10px 0;">Rubric Details</h4>
      <div style="font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; color: #422006;">${escapeHtml(data.teacher_criteria)}</div>
    </div>
  </div>

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
  html += '<h3>💬 Grading Feedback</h3>\n';

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

  // Grammar Findings
  if (bulletproof.grammar_findings?.length > 0) {
    html += '<div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin: 15px 0; border-radius: 4px;">\n';
    html += '<h4 style="color: #713f12; margin: 0 0 10px 0; font-size: 16px;">📝 Grammar <span style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Not Affecting Score</span></h4>\n';
    html += '<p style="font-size: 12px; color: #78350f; font-style: italic; margin: 0 0 10px 0;">Constructive feedback to help you improve</p>\n';
    html += '<ul style="margin: 0; padding-left: 20px; line-height: 1.8;">\n';
    bulletproof.grammar_findings.forEach((finding: string) => {
      html += `<li style="color: #854d0e; font-size: 13px;">${escapeHtml(finding)}</li>\n`;
    });
    html += '</ul>\n</div>\n';
  }

  // Spelling Findings
  if (bulletproof.spelling_findings?.length > 0) {
    html += '<div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin: 15px 0; border-radius: 4px;">\n';
    html += '<h4 style="color: #713f12; margin: 0 0 10px 0; font-size: 16px;">✏️ Spelling <span style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Not Affecting Score</span></h4>\n';
    html += '<p style="font-size: 12px; color: #78350f; font-style: italic; margin: 0 0 10px 0;">Constructive feedback to help you improve</p>\n';
    html += '<ul style="margin: 0; padding-left: 20px; line-height: 1.8;">\n';
    bulletproof.spelling_findings.forEach((finding: string) => {
      html += `<li style="color: #854d0e; font-size: 13px;">${escapeHtml(finding)}</li>\n`;
    });
    html += '</ul>\n</div>\n';
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
