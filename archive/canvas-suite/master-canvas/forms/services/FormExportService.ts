import { MasterFormData, MasterFormResponse, MasterFormQuestion } from '../types';
import { CanvasService } from '@/services/canvasService';
import { toast } from 'sonner';

export class FormExportService {
  /**
   * Export form responses as CSV file
   */
  public static exportToCSV(formData: MasterFormData): void {
    if (formData.responses.length === 0) {
      toast.info('No responses available to export.');
      return;
    }

    const headers = [
      'Response ID',
      'Submitted At',
      'Responder Email',
      'Time Spent (s)',
      'Total Score',
      'Max Score',
      'Score %',
      'Pass Status',
      ...formData.questions
        .filter(q => !['section-header', 'image-block', 'video-block'].includes(q.type))
        .map(q => `"${q.title.replace(/"/g, '""')}"`)
    ];

    const rows = formData.responses.map(resp => {
      const row = [
        resp.id,
        resp.submittedAt,
        resp.responderEmail || 'Anonymous',
        resp.timeSpentSeconds || 0,
        resp.totalScore ?? 'N/A',
        resp.maxPossibleScore ?? 'N/A',
        resp.percentageScore !== undefined ? `${resp.percentageScore}%` : 'N/A',
        resp.passed !== undefined ? (resp.passed ? 'PASSED' : 'FAILED') : 'N/A',
      ];

      formData.questions
        .filter(q => !['section-header', 'image-block', 'video-block'].includes(q.type))
        .forEach(q => {
          const ans = resp.answers[q.id];
          let valStr = '';

          if (ans === undefined || ans === null) {
            valStr = '';
          } else if (Array.isArray(ans)) {
            valStr = ans.join('; ');
          } else if (typeof ans === 'object') {
            valStr = Object.entries(ans).map(([k, v]) => `${k}: ${v}`).join(' | ');
          } else {
            valStr = String(ans);
          }

          row.push(`"${valStr.replace(/"/g, '""')}"`);
        });

      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const safeTitle = (formData.title || 'Master_Form').replace(/[^a-zA-Z0-9_-]/g, '_');
    CanvasService.exportToLocalFile(`${safeTitle}_Responses.csv`, csvContent, 'text/csv');
    toast.success('Responses exported to CSV successfully');
  }

  /**
   * Export form responses as JSON file
   */
  public static exportToJSON(formData: MasterFormData): void {
    const jsonStr = JSON.stringify(formData, null, 2);
    const safeTitle = (formData.title || 'Master_Form').replace(/[^a-zA-Z0-9_-]/g, '_');
    CanvasService.exportToLocalFile(`${safeTitle}_Backup.json`, jsonStr, 'application/json');
    toast.success('Form and responses exported as JSON');
  }

  /**
   * One-click Export to MASTER SHEETS
   * Creates a live Master Sheets workbook in Master Cloud
   */
  public static async exportToMasterSheets(formData: MasterFormData): Promise<string | null> {
    try {
      const activeQuestions = formData.questions.filter(
        q => !['section-header', 'image-block', 'video-block'].includes(q.type)
      );

      // Build rows and columns for Master Sheets
      const colHeaders = [
        'Submission Time',
        'Responder Email',
        'Score',
        'Result',
        ...activeQuestions.map(q => q.title),
      ];

      const cellsData: Record<string, any> = {};

      // Row 0: Headers
      colHeaders.forEach((header, cIdx) => {
        const colLetter = String.fromCharCode(65 + (cIdx % 26)); // A, B, C...
        const cellKey = `${colLetter}1`;
        cellsData[cellKey] = {
          value: header,
          formatted: header,
          type: 'text',
          bold: true,
          bg: '#ede9fe',
          color: '#5b21b6',
        };
      });

      // Data Rows
      formData.responses.forEach((resp, rIdx) => {
        const rowNum = rIdx + 2;
        const rowValues = [
          new Date(resp.submittedAt).toLocaleString(),
          resp.responderEmail || 'Anonymous',
          resp.totalScore !== undefined ? `${resp.totalScore}/${resp.maxPossibleScore}` : '-',
          resp.passed !== undefined ? (resp.passed ? 'Pass' : 'Fail') : '-',
          ...activeQuestions.map(q => {
            const ans = resp.answers[q.id];
            if (Array.isArray(ans)) return ans.join(', ');
            if (typeof ans === 'object' && ans !== null) return JSON.stringify(ans);
            return String(ans ?? '');
          }),
        ];

        rowValues.forEach((val, cIdx) => {
          const colLetter = String.fromCharCode(65 + (cIdx % 26));
          const cellKey = `${colLetter}${rowNum}`;
          cellsData[cellKey] = {
            value: val,
            formatted: val,
            type: 'text',
          };
        });
      });

      const sheetPayload = {
        title: `${formData.title} - Responses`,
        sheets: [
          {
            id: 'sheet-1',
            name: 'Form Responses',
            rowCount: Math.max(formData.responses.length + 10, 50),
            colCount: Math.max(colHeaders.length + 5, 26),
            cells: cellsData,
          },
        ],
        activeSheetId: 'sheet-1',
        lastSavedAt: new Date().toISOString(),
      };

      // Create new Master Canvas document for Sheets
      const { file } = await CanvasService.createCanvasDocument(
        'sheets',
        `${formData.title} (Responses)`
      );

      // Save the sheet payload
      await CanvasService.saveCanvasDocument(file.id, sheetPayload);
      toast.success('Successfully exported to Master Sheets! Opening workbook...');
      return file.id;
    } catch (err: any) {
      console.error('Failed to export to Master Sheets:', err);
      toast.error('Failed to export to Master Sheets: ' + (err.message || 'Unknown error'));
      return null;
    }
  }

  /**
   * Generate a printable PDF summary report HTML document
   */
  public static printSummaryReport(formData: MasterFormData): void {
    const totalResponses = formData.responses.length;
    const questions = formData.questions.filter(
      q => !['section-header', 'image-block', 'video-block'].includes(q.type)
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${formData.title} - Executive Summary Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; }
          h1 { color: #6d28d9; margin-bottom: 4px; font-size: 24px; }
          .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
          .kpi-value { font-size: 28px; font-weight: 700; color: #6d28d9; }
          .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
          .question-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
          .question-title { font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #0f172a; }
          .response-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; font-size: 13px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <h1>${formData.title}</h1>
        <div class="subtitle">Generated by MASTER FORMS &bull; Master Cloud Platform &bull; ${new Date().toLocaleDateString()}</div>
        
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${totalResponses}</div>
            <div class="kpi-label">Total Submissions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${questions.length}</div>
            <div class="kpi-label">Active Questions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${formData.quizSettings.isQuiz ? 'Quiz / Exam' : 'Survey'}</div>
            <div class="kpi-label">Form Type</div>
          </div>
        </div>

        <h2>Question Breakdown & Responses</h2>
        ${questions.map((q, idx) => {
          const sampleAnswers = formData.responses.slice(0, 10).map(r => r.answers[q.id]).filter(Boolean);
          return `
            <div class="question-card">
              <div class="question-title">${idx + 1}. ${q.title} <span style="font-size: 12px; font-weight: normal; color: #64748b;">(${q.type})</span></div>
              <div>
                ${sampleAnswers.length > 0 
                  ? sampleAnswers.map(ans => `<div class="response-item">&bull; ${Array.isArray(ans) ? ans.join(', ') : (typeof ans === 'object' ? JSON.stringify(ans) : ans)}</div>`).join('') 
                  : '<div style="font-size: 13px; color: #94a3b8; font-style: italic;">No responses recorded.</div>'}
              </div>
            </div>
          `;
        }).join('')}

        <div class="footer">
          Master Cloud &bull; 10 TB Permanent Free Storage &bull; Confidential
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
