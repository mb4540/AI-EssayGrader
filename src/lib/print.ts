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

  <div class="criteria-box">
    <h4>📋 Grading Criteria Used</h4>
    <div class="criteria-text">${data.teacher_criteria}</div>
  </div>

  ${data.ai_feedback ? `
    <div class="feedback-section">
      <h4>🤖 AI Assessment Details</h4>
      
      ${data.ai_feedback.rubric_scores && data.ai_feedback.rubric_scores.length > 0 ? `
        <div style="margin: 15px 0;">
          <strong>Category Scores:</strong>
          <ul class="feedback-list">
            ${data.ai_feedback.rubric_scores.map(score => `
              <li><strong>${score.category}:</strong> ${score.score}/100 - ${score.comments}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.ai_feedback.improvement_summary ? `
        <div style="margin: 15px 0; padding: 12px; background: #faf5ff; border-radius: 4px;">
          <strong style="color: #7c3aed;">📈 Improvement Analysis:</strong>
          <p style="margin: 8px 0;">${data.ai_feedback.improvement_summary}</p>
          ${data.ai_feedback.growth_percentage !== undefined ? `
            <p style="margin: 8px 0;"><strong>Growth:</strong> ${data.ai_feedback.growth_percentage}%</p>
          ` : ''}
        </div>
      ` : ''}
      
      <div style="margin: 15px 0;">
        <strong>Summary:</strong>
        <p style="margin: 8px 0;">${data.ai_feedback.supportive_summary}</p>
      </div>
      
      ${data.ai_feedback.top_3_suggestions.length > 0 ? `
        <div style="margin: 15px 0;">
          <strong>Top Suggestions for Improvement:</strong>
          <ul class="feedback-list">
            ${data.ai_feedback.top_3_suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.ai_feedback.grammar_findings.length > 0 ? `
        <div style="margin: 15px 0;">
          <strong>Grammar Issues:</strong>
          <ul class="feedback-list">
            ${data.ai_feedback.grammar_findings.slice(0, 10).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.ai_feedback.spelling_findings.length > 0 ? `
        <div style="margin: 15px 0;">
          <strong>Spelling Issues:</strong>
          <ul class="feedback-list">
            ${data.ai_feedback.spelling_findings.slice(0, 10).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  ` : ''}

  ${data.teacher_feedback ? `
    <div class="teacher-comments">
      <h4>👨‍🏫 Teacher Comments</h4>
      <div style="white-space: pre-wrap; font-size: 14px;">${data.teacher_feedback}</div>
    </div>
  ` : ''}

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
