import type { Feedback } from './schema';

interface PrintSubmissionData {
  student_name: string;
  student_id?: string;
  assignment_title?: string;
  draft_mode?: 'single' | 'comparison';
  verbatim_text?: string;
  rough_draft_text?: string;
  final_draft_text?: string;
  teacher_criteria: string;
  total_points?: number;
  ai_grade?: number;
  ai_feedback?: Feedback;
  teacher_grade?: number;
  teacher_feedback?: string;
  created_at: string;
}

export function generatePrintHTML(data: PrintSubmissionData): string {
  const date = new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const finalGrade = data.teacher_grade ?? data.ai_grade ?? 0;

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
      line-height: 1.6;
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
    }
    
    .info-section h2 {
      color: #1e40af;
      font-size: 18px;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
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
    
    .grade-box {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 25px 0;
    }
    
    .grade-box .grade {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .grade-box .label {
      font-size: 14px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .section {
      margin: 30px 0;
    }
    
    .section h3 {
      color: #1e40af;
      font-size: 20px;
      margin: 0 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .essay-text {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 20px;
      border-radius: 4px;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.8;
      max-height: none;
    }
    
    .draft-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .draft-box {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .draft-box.rough {
      border-color: #fb923c;
    }
    
    .draft-box.final {
      border-color: #22c55e;
    }
    
    .draft-header {
      padding: 10px 15px;
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
    }
    
    .draft-box.rough .draft-header {
      background: #fed7aa;
      color: #9a3412;
    }
    
    .draft-box.final .draft-header {
      background: #bbf7d0;
      color: #14532d;
    }
    
    .draft-text {
      padding: 15px;
      background: white;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    
    .feedback-section {
      background: #eff6ff;
      border: 2px solid #93c5fd;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .feedback-section h4 {
      color: #1e40af;
      font-size: 16px;
      margin: 0 0 12px 0;
    }
    
    .feedback-list {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    .feedback-list li {
      margin: 6px 0;
      font-size: 14px;
    }
    
    .criteria-box {
      background: #fefce8;
      border: 2px solid #fde047;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    
    .criteria-box h4 {
      color: #854d0e;
      font-size: 14px;
      margin: 0 0 10px 0;
    }
    
    .criteria-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      white-space: pre-wrap;
      color: #422006;
    }
    
    .teacher-comments {
      background: #dcfce7;
      border: 2px solid #86efac;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .teacher-comments h4 {
      color: #14532d;
      font-size: 16px;
      margin: 0 0 12px 0;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
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
    <h1>📝 Graded Essay Submission</h1>
    <div class="subtitle">EssayEase - Generated on ${date}</div>
  </div>

  <div class="info-section">
    <h2>👤 Student Information</h2>
    <div class="info-grid">
      <div class="info-label">Student Name:</div>
      <div class="info-value">${data.student_name}</div>
      ${data.student_id ? `
        <div class="info-label">Student ID:</div>
        <div class="info-value">${data.student_id}</div>
      ` : ''}
      ${data.assignment_title ? `
        <div class="info-label">Assignment:</div>
        <div class="info-value">${data.assignment_title}</div>
      ` : ''}
      <div class="info-label">Submission Date:</div>
      <div class="info-value">${date}</div>
    </div>
  </div>

  <div class="grade-box">
    <div class="label">Final Grade</div>
    <div class="grade">${finalGrade}/100</div>
    ${data.teacher_grade ? '<div class="label">Teacher Reviewed</div>' : '<div class="label">AI Assessment</div>'}
  </div>

  ${data.draft_mode === 'comparison' ? `
    <div class="section">
      <h3>📄 Student Drafts</h3>
      <div class="draft-container">
        <div class="draft-box rough">
          <div class="draft-header">Rough Draft - First Version</div>
          <div class="draft-text">${data.rough_draft_text || 'N/A'}</div>
        </div>
        <div class="draft-box final">
          <div class="draft-header">Final Draft - Revised Version</div>
          <div class="draft-text">${data.final_draft_text || 'N/A'}</div>
        </div>
      </div>
    </div>
  ` : `
    <div class="section">
      <h3>📝 Student Essay (Verbatim)</h3>
      <div class="essay-text">${data.verbatim_text || 'N/A'}</div>
    </div>
  `}

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
              ${score.rationale}
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

  ${data.ai_feedback && (data.ai_feedback as any).bulletproof?.extracted_scores?.feedback ? `
    <div class="section">
      <h3>💬 Grading Feedback</h3>
      
      ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.strengths || []).length > 0 ? `
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>✓</span> Strengths
          </h4>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.strengths || []).map((strength: string) => `
              <li style="color: #047857; margin: 6px 0;">${strength}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.areas_for_improvement || []).length > 0 ? `
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>💡</span> Areas for Improvement
            <span style="font-size: 11px; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Rubric-Based</span>
          </h4>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.areas_for_improvement || []).map((area: string) => `
              <li style="color: #1e40af; margin: 6px 0;">${area}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.top_3_suggestions || []).length > 0 ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>⭐</span> Top 3 Suggestions for Next Time
          </h4>
          <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.top_3_suggestions || []).map((suggestion: string) => `
              <li style="color: #78350f; margin: 6px 0;">${suggestion}</li>
            `).join('')}
          </ol>
        </div>
      ` : ''}
      
      ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.grammar_findings || []).length > 0 ? `
        <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #713f12; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📝</span> Grammar
            <span style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Not Affecting Score</span>
          </h4>
          <p style="font-size: 12px; color: #78350f; font-style: italic; margin: 0 0 10px 0;">Constructive feedback to help you improve</p>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.grammar_findings || []).map((finding: string) => `
              <li style="color: #854d0e; margin: 6px 0; font-size: 13px;">${finding}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.spelling_findings || []).length > 0 ? `
        <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #713f12; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>✏️</span> Spelling
            <span style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Not Affecting Score</span>
          </h4>
          <p style="font-size: 12px; color: #78350f; font-style: italic; margin: 0 0 10px 0;">Constructive feedback to help you improve</p>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${((data.ai_feedback as any).bulletproof.extracted_scores.feedback.spelling_findings || []).map((finding: string) => `
              <li style="color: #854d0e; margin: 6px 0; font-size: 13px;">${finding}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.teacher_feedback ? `
        <div style="background: #faf5ff; border-left: 4px solid #9333ea; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #6b21a8; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <span>👨‍🏫</span> Teacher Comments
          </h4>
          <p style="margin: 0; color: #581c87; line-height: 1.8; white-space: pre-wrap;">${data.teacher_feedback}</p>
        </div>
      ` : ''}
    </div>
  ` : ''}

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
    <div class="criteria-box">
      <h4>Rubric Details</h4>
      <div class="criteria-text">${data.teacher_criteria}</div>
    </div>
  </div>

  <div class="footer">
    <p>Generated by EssayEase - AI-Powered Essay Grading Assistant</p>
    <p>This document was generated on ${new Date().toLocaleString('en-US')}</p>
  </div>
</body>
</html>
  `.trim();
}

export function printSubmission(data: PrintSubmissionData) {
  const html = generatePrintHTML(data);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the submission');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Auto-trigger print dialog after content loads
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

export function downloadSubmissionHTML(data: PrintSubmissionData) {
  const html = generatePrintHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `graded-submission-${data.student_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
