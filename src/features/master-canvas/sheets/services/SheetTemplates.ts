import { MasterWorkbookData, MasterSingleSheet } from '../types';

export interface SheetTemplateDefinition {
  id: string;
  name: string;
  category: 'Finance' | 'Project' | 'Sales' | 'Human Resources' | 'Education' | 'Operations';
  description: string;
  workbook: MasterWorkbookData;
}

export class SheetTemplates {
  static getTemplates(): SheetTemplateDefinition[] {
    return [
      {
        id: 'tpl-monthly-budget',
        name: 'Monthly Financial Budget & Cash Flow',
        category: 'Finance',
        description: 'Track personal or business income, fixed & variable expenses, and calculate net savings with summary charts.',
        workbook: {
          title: 'Monthly Financial Budget',
          version: 1,
          activeSheetId: 'sheet-1',
          lastSavedAt: new Date().toISOString(),
          sheets: [
            {
              id: 'sheet-1',
              name: 'Budget Summary',
              rows: 30,
              cols: 10,
              cells: {
                A1: { value: 'Monthly Financial Budget', format: { bold: true, fontSize: 16, textColor: '#1e3a8a' } },
                A3: { value: 'Income Category', format: { bold: true, bgColor: '#dbeafe', textColor: '#1e40af' } },
                B3: { value: 'Projected', format: { bold: true, bgColor: '#dbeafe', textColor: '#1e40af', align: 'right' } },
                C3: { value: 'Actual', format: { bold: true, bgColor: '#dbeafe', textColor: '#1e40af', align: 'right' } },
                D3: { value: 'Difference', format: { bold: true, bgColor: '#dbeafe', textColor: '#1e40af', align: 'right' } },
                
                A4: { value: 'Primary Salary' },
                B4: { value: '5500', format: { align: 'right' } },
                C4: { value: '5500', format: { align: 'right' } },
                D4: { formula: '=C4-B4', format: { align: 'right' } },

                A5: { value: 'Consulting & Freelance' },
                B5: { value: '1200', format: { align: 'right' } },
                C5: { value: '1650', format: { align: 'right' } },
                D5: { formula: '=C5-B5', format: { align: 'right' } },

                A6: { value: 'Investment Dividends' },
                B6: { value: '450', format: { align: 'right' } },
                C6: { value: '480', format: { align: 'right' } },
                D6: { formula: '=C6-B6', format: { align: 'right' } },

                A7: { value: 'Total Income', format: { bold: true, bgColor: '#f1f5f9' } },
                B7: { formula: '=SUM(B4:B6)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                C7: { formula: '=SUM(C4:C6)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                D7: { formula: '=SUM(D4:D6)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },

                A9: { value: 'Expense Category', format: { bold: true, bgColor: '#fee2e2', textColor: '#991b1b' } },
                B9: { value: 'Projected', format: { bold: true, bgColor: '#fee2e2', textColor: '#991b1b', align: 'right' } },
                C9: { value: 'Actual', format: { bold: true, bgColor: '#fee2e2', textColor: '#991b1b', align: 'right' } },
                D9: { value: 'Difference', format: { bold: true, bgColor: '#fee2e2', textColor: '#991b1b', align: 'right' } },

                A10: { value: 'Housing & Rent' },
                B10: { value: '2100', format: { align: 'right' } },
                C10: { value: '2100', format: { align: 'right' } },
                D10: { formula: '=C10-B10', format: { align: 'right' } },

                A11: { value: 'Groceries & Food' },
                B11: { value: '650', format: { align: 'right' } },
                C11: { value: '720', format: { align: 'right' } },
                D11: { formula: '=C11-B11', format: { align: 'right' } },

                A12: { value: 'Utilities & Internet' },
                B12: { value: '280', format: { align: 'right' } },
                C12: { value: '260', format: { align: 'right' } },
                D12: { formula: '=C12-B12', format: { align: 'right' } },

                A13: { value: 'Transportation' },
                B13: { value: '350', format: { align: 'right' } },
                C13: { value: '310', format: { align: 'right' } },
                D13: { formula: '=C13-B13', format: { align: 'right' } },

                A14: { value: 'Total Expenses', format: { bold: true, bgColor: '#f1f5f9' } },
                B14: { formula: '=SUM(B10:B13)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                C14: { formula: '=SUM(C10:C13)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                D14: { formula: '=SUM(D10:D13)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },

                A16: { value: 'NET MONTHLY SAVINGS', format: { bold: true, bgColor: '#dcfce7', textColor: '#15803d' } },
                C16: { formula: '=C7-C14', format: { bold: true, bgColor: '#dcfce7', textColor: '#15803d', align: 'right' } },
              },
            },
          ],
        },
      },
      {
        id: 'tpl-project-tracker',
        name: 'Project Tasks & Milestone Tracker',
        category: 'Project',
        description: 'Manage deliverables, milestones, assigned owners, priorities, and completion statuses.',
        workbook: {
          title: 'Project Milestone Tracker',
          version: 1,
          activeSheetId: 'sheet-1',
          lastSavedAt: new Date().toISOString(),
          sheets: [
            {
              id: 'sheet-1',
              name: 'Sprint Tasks',
              rows: 25,
              cols: 8,
              cells: {
                A1: { value: 'Master Cloud Project Sprint Tracker', format: { bold: true, fontSize: 16, textColor: '#1e3a8a' } },
                A3: { value: 'Task ID', format: { bold: true, bgColor: '#f1f5f9' } },
                B3: { value: 'Task Description', format: { bold: true, bgColor: '#f1f5f9' } },
                C3: { value: 'Owner', format: { bold: true, bgColor: '#f1f5f9' } },
                D3: { value: 'Priority', format: { bold: true, bgColor: '#f1f5f9' } },
                E3: { value: 'Status', format: { bold: true, bgColor: '#f1f5f9' } },
                F3: { value: 'Estimated Hrs', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                G3: { value: 'Actual Hrs', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },

                A4: { value: 'MC-101' },
                B4: { value: 'Implement Formula Engine AST' },
                C4: { value: 'Alex R.' },
                D4: { value: 'High', format: { textColor: '#dc2626', bold: true } },
                E4: { value: 'Completed', format: { textColor: '#16a34a' } },
                F4: { value: '18', format: { align: 'right' } },
                G4: { value: '16', format: { align: 'right' } },

                A5: { value: 'MC-102' },
                B5: { value: 'Virtualized Canvas Grid View' },
                C5: { value: 'Sophia K.' },
                D5: { value: 'Urgent', format: { textColor: '#991b1b', bold: true } },
                E5: { value: 'Completed', format: { textColor: '#16a34a' } },
                F5: { value: '24', format: { align: 'right' } },
                G5: { value: '22', format: { align: 'right' } },

                A6: { value: 'MC-103' },
                B6: { value: 'Cross-Sheet Reference Linking' },
                C6: { value: 'David M.' },
                D6: { value: 'Medium', format: { textColor: '#d97706' } },
                E6: { value: 'In Progress', format: { textColor: '#2563eb' } },
                F6: { value: '12', format: { align: 'right' } },
                G6: { value: '8', format: { align: 'right' } },

                A8: { value: 'Total Sprint Hours', format: { bold: true, bgColor: '#e2e8f0' } },
                F8: { formula: '=SUM(F4:F6)', format: { bold: true, bgColor: '#e2e8f0', align: 'right' } },
                G8: { formula: '=SUM(G4:G6)', format: { bold: true, bgColor: '#e2e8f0', align: 'right' } },
              },
            },
          ],
        },
      },
      {
        id: 'tpl-sales-pipeline',
        name: 'Sales Pipeline & Revenue Forecasting',
        category: 'Sales',
        description: 'Pipeline stage tracking, deal sizes, probability weighting, and expected revenue projections.',
        workbook: {
          title: 'Sales Pipeline & Revenue',
          version: 1,
          activeSheetId: 'sheet-1',
          lastSavedAt: new Date().toISOString(),
          sheets: [
            {
              id: 'sheet-1',
              name: 'Deals Pipeline',
              rows: 25,
              cols: 8,
              cells: {
                A1: { value: 'Enterprise Sales Revenue Pipeline', format: { bold: true, fontSize: 16, textColor: '#1e3a8a' } },
                A3: { value: 'Client Account', format: { bold: true, bgColor: '#f1f5f9' } },
                B3: { value: 'Lead Owner', format: { bold: true, bgColor: '#f1f5f9' } },
                C3: { value: 'Stage', format: { bold: true, bgColor: '#f1f5f9' } },
                D3: { value: 'Deal Value ($)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                E3: { value: 'Probability (%)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },
                F3: { value: 'Weighted Forecast ($)', format: { bold: true, bgColor: '#f1f5f9', align: 'right' } },

                A4: { value: 'Nexus Global Tech' },
                B4: { value: 'Elena V.' },
                C4: { value: 'Contract Review' },
                D4: { value: '45000', format: { align: 'right' } },
                E4: { value: '0.85', format: { align: 'right' } },
                F4: { formula: '=D4*E4', format: { align: 'right', bold: true } },

                A5: { value: 'Apex Logistics' },
                B5: { value: 'Marcus T.' },
                C5: { value: 'Demo Presented' },
                D5: { value: '28000', format: { align: 'right' } },
                E5: { value: '0.50', format: { align: 'right' } },
                F5: { formula: '=D5*E5', format: { align: 'right', bold: true } },

                A6: { value: 'Horizon Health' },
                B6: { value: 'Elena V.' },
                C6: { value: 'Negotiation' },
                D6: { value: '62000', format: { align: 'right' } },
                E6: { value: '0.70', format: { align: 'right' } },
                F6: { formula: '=D6*E6', format: { align: 'right', bold: true } },

                A8: { value: 'TOTAL PIPELINE', format: { bold: true, bgColor: '#dbeafe' } },
                D8: { formula: '=SUM(D4:D6)', format: { bold: true, bgColor: '#dbeafe', align: 'right' } },
                F8: { formula: '=SUM(F4:F6)', format: { bold: true, bgColor: '#dbeafe', align: 'right' } },
              },
            },
          ],
        },
      },
    ];
  }
}
