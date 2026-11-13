export type DocumentTemplateCategory =
  | 'Start Fresh'
  | 'Reports'
  | 'Resumes'
  | 'Letters'
  | 'Business'
  | 'Academic'
  | 'Newsletters'
  | 'Engineering';

export type DocumentTemplateIconKey =
  | 'plus'
  | 'file-text'
  | 'file-check'
  | 'file-code'
  | 'graduation-cap'
  | 'briefcase'
  | 'user-check'
  | 'mail'
  | 'newspaper'
  | 'bar-chart'
  | 'sigma'
  | 'book-open';

export interface DocumentTemplate {
  id: string;
  name: string;
  category: DocumentTemplateCategory;
  description: string;
  thumbnailColor: string;
  accentColor: string;
  iconKey: DocumentTemplateIconKey;
  sourceName?: string;
  featured?: boolean;
  content: string;
}

const today = () =>
  new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const MASTER_DOCS_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'Start Fresh',
    description: 'Clean Microsoft Word 365 Aptos document (12pt, 1.16 spacing) ready for rich writing.',
    thumbnailColor: 'from-blue-600 to-indigo-700',
    accentColor: '#156082',
    iconKey: 'plus',
    sourceName: 'Normal.dotm',
    featured: true,
    content: '<p></p>',
  },
  {
    id: 'project-proposal',
    name: 'Executive Project Proposal',
    category: 'Business',
    description: 'Project charter with executive summary, objectives, milestone table, and budget.',
    thumbnailColor: 'from-emerald-600 to-teal-700',
    accentColor: '#156082',
    iconKey: 'file-check',
    sourceName: 'Word 365 Business',
    featured: true,
    content: `
      <p class="word-title" style="color: #0F4761;">Executive Project Proposal</p>
      <p class="word-subtitle" style="color: #595959;">Prepared by: Master Cloud Team &bull; ${today()}</p>

      <h1>1. Executive Summary</h1>
      <p>This proposal outlines the strategic initiative to develop and deploy next-generation cloud infrastructure, offering high-throughput storage, Word-grade document authoring, and desktop virtual drive access.</p>

      <h1>2. Project Objectives</h1>
      <ul>
        <li>Deploy high-resilience 10 TB storage allocation with instant cloud sync.</li>
        <li>Deliver full-fidelity document editing and OpenXML (.docx) interoperability.</li>
        <li>Maintain zero-trust security with authenticated gateways and version history.</li>
      </ul>

      <h1>3. Project Milestones &amp; Deliverables</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
        <thead>
          <tr style="background-color: #156082; color: #ffffff;">
            <th style="border: 1px solid #156082; padding: 8px 12px; text-align: left;">Phase</th>
            <th style="border: 1px solid #156082; padding: 8px 12px; text-align: left;">Key Deliverable</th>
            <th style="border: 1px solid #156082; padding: 8px 12px; text-align: left;">Target Date</th>
            <th style="border: 1px solid #156082; padding: 8px 12px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Phase 1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Core Virtual Drive &amp; Sync Engine</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Q1 2026</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; color: #196B24; font-weight: bold;">Completed</td>
          </tr>
          <tr style="background-color: #f4f7f9;">
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Phase 2</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Master Docs Fluent Ribbon &amp; Templates</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Q2 2026</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; color: #156082; font-weight: bold;">In Progress</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Phase 3</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Enterprise Multi-Region Federation</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Q3 2026</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; color: #595959;">Planned</td>
          </tr>
        </tbody>
      </table>

      <h1>4. Budget &amp; Resource Allocation</h1>
      <p>Resource allocations are structured to maximize operational reliability while maintaining predictable quarterly infrastructure cost targets.</p>
    `,
  },
  {
    id: 'chronological-resume',
    name: 'Chronological Resume',
    category: 'Resumes',
    description: 'Classic Microsoft Word chronological CV highlighting experience, role progression, and skills.',
    thumbnailColor: 'from-slate-700 to-slate-900',
    accentColor: '#156082',
    iconKey: 'user-check',
    sourceName: 'ChronologicalResume.dotx',
    featured: true,
    content: `
      <p class="word-title" style="margin-bottom: 2px;">[Your Full Name]</p>
      <p class="word-subtitle" style="color: #156082; margin-top: 0;">[Job Title / Target Role]</p>
      <p style="color: #595959; font-size: 10.5pt;">[Street Address, City, ST ZIP] &bull; [Telephone] &bull; [Email Address] &bull; [Portfolio / LinkedIn]</p>
      <hr/>

      <h1>Profile Summary</h1>
      <p>Accomplished professional with proven experience delivering high-impact results across cross-functional teams, complex technical architectures, and deadline-driven operations.</p>

      <h1>Experience</h1>
      <h2>[Senior Job Title] &mdash; [Company Name]</h2>
      <p style="color: #595959; font-style: italic;">[City, State] &bull; [Month Year] &ndash; Present</p>
      <ul>
        <li>Spearheaded key initiatives that improved operational efficiency and measurable delivery velocity.</li>
        <li>Collaborated with leadership and product stakeholders to establish clear milestones and quality standards.</li>
        <li>Mentored team members and standardized best practices across core workflows.</li>
      </ul>

      <h2>[Previous Job Title] &mdash; [Previous Company]</h2>
      <p style="color: #595959; font-style: italic;">[City, State] &bull; [Month Year] &ndash; [Month Year]</p>
      <ul>
        <li>Executed end-to-end project deliverables on schedule and within allocated budgets.</li>
        <li>Automated recurring reporting tasks, saving hours of manual review per week.</li>
      </ul>

      <h1>Education</h1>
      <p><strong>[Degree / Qualification]</strong>, [University / Institution Name] &mdash; [Completion Year]</p>

      <h1>Core Skills</h1>
      <ul>
        <li><strong>Technical &amp; Tools:</strong> Microsoft 365 Word, Project Planning, Systems Architecture, Data Analysis</li>
        <li><strong>Leadership:</strong> Stakeholder Communication, Cross-Team Coordination, Process Optimization</li>
      </ul>
    `,
  },
  {
    id: 'chronological-letter',
    name: 'Business Cover Letter',
    category: 'Letters',
    description: 'Clean formal business & cover letter built from Word’s ChronologicalLetter layout.',
    thumbnailColor: 'from-sky-600 to-blue-800',
    accentColor: '#156082',
    iconKey: 'mail',
    sourceName: 'ChronologicalLetter.dotx',
    featured: true,
    content: `
      <p class="word-title" style="font-size: 22pt; margin-bottom: 2px;">[Your Name]</p>
      <p class="word-subtitle" style="font-size: 12pt; color: #156082; margin-top: 0;">[Your Job Title]</p>
      <p style="color: #595959; font-size: 10pt;">[Address Line 1] &bull; [City, ST ZIP Code] &bull; [Telephone] &bull; [Email]</p>
      <hr/>

      <p style="margin-top: 16px;">${today()}</p>

      <p style="margin-top: 14px;">
        <strong>[Recipient Name]</strong><br/>
        [Recipient Title]<br/>
        [Company Name]<br/>
        [Company Street Address, City, ST ZIP Code]
      </p>

      <p style="margin-top: 14px;"><strong>Dear [Recipient Name],</strong></p>

      <p>I am writing to express my strong interest in the <strong>[Position / Collaboration Opportunity]</strong> at [Company Name]. With a proven background in delivering reliable, high-impact work, I am confident in my ability to bring immediate value to your team.</p>

      <p>Throughout my career, I have focused on combining clear communication with structured execution. In my recent role, I led key initiatives from initial planning through production delivery, ensuring every stakeholder requirement and quality benchmark was exceeded.</p>

      <p>Thank you for your time and consideration. I welcome the opportunity to discuss how my skills and experience align with [Company Name]&rsquo;s upcoming goals.</p>

      <p style="margin-top: 20px;">Sincerely,</p>
      <p style="margin-top: 24px;"><strong>[Your Name]</strong><br/>[Your Title]</p>
    `,
  },
  {
    id: 'adjacency-report',
    name: 'Adjacency Business Report',
    category: 'Reports',
    description: 'Structured corporate report with sage-teal accents, executive abstract, and sidebar callouts.',
    thumbnailColor: 'from-teal-600 to-emerald-800',
    accentColor: '#3B6E6C',
    iconKey: 'bar-chart',
    sourceName: 'AdjacencyReport.dotx',
    featured: true,
    content: `
      <p class="word-title" style="color: #3B6E6C; font-family: Cambria, Georgia, serif;">[Document Title]</p>
      <p class="word-subtitle" style="color: #6B705C;">[Document Subtitle &bull; Quarterly Strategic Analysis]</p>

      <blockquote style="border-left: 4px solid #3B6E6C; background-color: #f3f7f6; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Abstract:</strong> Summarize the key findings, scope, and conclusions of this report in a concise overview for executive readers.</p>
      </blockquote>

      <h1 style="color: #3B6E6C;">1. Introduction &amp; Context</h1>
      <p>Replace this placeholder with the primary background, market context, and objectives covered by this report. Use the Styles gallery in the Home tab to keep headings uniform throughout the document.</p>

      <h1 style="color: #3B6E6C;">2. Key Analysis &amp; Sidebar Highlight</h1>
      <p>Present supporting evidence, operational metrics, and regional performance details here. Structured tables help compare metrics clearly across reporting periods.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
        <thead>
          <tr style="background-color: #3B6E6C; color: #ffffff;">
            <th style="border: 1px solid #3B6E6C; padding: 8px 12px; text-align: left;">Metric</th>
            <th style="border: 1px solid #3B6E6C; padding: 8px 12px; text-align: left;">Baseline</th>
            <th style="border: 1px solid #3B6E6C; padding: 8px 12px; text-align: left;">Current</th>
            <th style="border: 1px solid #3B6E6C; padding: 8px 12px; text-align: left;">Variance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Operational Output</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">84.2%</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">93.8%</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #3B6E6C; font-weight: bold;">+9.6%</td>
          </tr>
          <tr style="background-color: #f7faf9;">
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Customer Satisfaction</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">4.3 / 5.0</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">4.8 / 5.0</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #3B6E6C; font-weight: bold;">+0.5</td>
          </tr>
        </tbody>
      </table>

      <h1 style="color: #3B6E6C;">3. Recommendations</h1>
      <ul>
        <li>Standardize quarterly review metrics across all department leads.</li>
        <li>Expand automation coverage across high-frequency customer workflows.</li>
      </ul>
    `,
  },
  {
    id: 'student-report',
    name: 'Student Report',
    category: 'Academic',
    description: 'Academic coursework & term report based on Word’s StudentReport template with metadata bar.',
    thumbnailColor: 'from-cyan-600 to-teal-700',
    accentColor: '#007C91',
    iconKey: 'graduation-cap',
    sourceName: 'StudentReport.dotx',
    featured: true,
    content: `
      <p style="color: #007C91; font-size: 10.5pt; font-weight: 600;">[Student Name] &nbsp;|&nbsp; [Course Title] &nbsp;|&nbsp; ${today()}</p>
      <p class="word-title" style="color: #0f172a; font-family: Constantia, Georgia, serif;">[Report Title]</p>
      <p class="word-subtitle" style="color: #007C91;">[Report Subtitle or Research Question]</p>
      <hr/>

      <h1 style="color: #007C91;">1. Introduction</h1>
      <p>When you click this placeholder text, begin typing your introduction. State your core thesis, research question, and why this topic matters within your course curriculum.</p>

      <h1 style="color: #007C91;">2. Research &amp; Evidence</h1>
      <p>Present supporting literature, experimental findings, and critical analysis below:</p>
      <ul>
        <li><strong>Primary Source Analysis:</strong> Summarize key arguments and empirical evidence.</li>
        <li><strong>Comparative Evaluation:</strong> Contrast competing perspectives or methodologies.</li>
        <li><strong>Data &amp; Charts:</strong> Insert structured tables or figures via the Insert tab.</li>
      </ul>

      <h1 style="color: #007C91;">3. Conclusion &amp; References</h1>
      <p>Synthesize your main findings and restate how they address your opening thesis statement.</p>
      <p style="color: #595959; font-style: italic;">Reference List &mdash; Author, A. (Year). Title of Work. Publisher / Journal.</p>
    `,
  },
  {
    id: 'apothecary-newsletter',
    name: 'Apothecary Newsletter',
    category: 'Newsletters',
    description: 'Editorial company newsletter with headline masthead, featured pull-quote, and story sections.',
    thumbnailColor: 'from-orange-600 to-rose-700',
    accentColor: '#CF543F',
    iconKey: 'newspaper',
    sourceName: 'ApothecaryNewsletter.dotx',
    featured: true,
    content: `
      <p style="text-transform: uppercase; letter-spacing: 0.12em; color: #5E6D64; font-weight: 700; font-size: 10pt; margin-bottom: 2px;">[Company or Organization Name] &bull; Issue No. 12</p>
      <p class="word-title" style="color: #CF543F; font-family: 'Book Antiqua', Georgia, serif; margin-top: 0;">Newsletter Title</p>
      <p class="word-subtitle" style="color: #5E6D64;">Story Subtitle or Quarterly Highlights Summary &mdash; ${today()}</p>
      <hr/>

      <blockquote class="word-intense-quote" style="border-top: 2px solid #CF543F; border-bottom: 2px solid #CF543F; color: #CF543F;">
        &ldquo;Highlight a bold editorial quote, leadership message, or customer milestone here to draw reader attention.&rdquo;
      </blockquote>

      <h1 style="color: #5E6D64;">Feature Story: Key Milestone Announcement</h1>
      <p>Share your primary announcement, product update, or community story here. Keep paragraphs concise and engaging for quick scanning across desktop and mobile readers.</p>

      <h1 style="color: #5E6D64;">Inside This Issue</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
        <thead>
          <tr style="background-color: #f6f2ef;">
            <th style="border: 1px solid #d6ccc2; padding: 8px 12px; text-align: left; color: #CF543F;">Sidebar Highlight</th>
            <th style="border: 1px solid #d6ccc2; padding: 8px 12px; text-align: left; color: #5E6D64;">Upcoming Events &amp; Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d6ccc2; padding: 10px 12px; vertical-align: top;">
              <strong>Team Spotlight:</strong> Recognizing outstanding contributors and engineering milestones this quarter.
            </td>
            <td style="border: 1px solid #d6ccc2; padding: 10px 12px; vertical-align: top;">
              <strong>All-Hands Townhall:</strong> Next Thursday at 10:00 AM.<br/>
              <strong>Community Summit:</strong> Registration opens next week.
            </td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Minutes & Action Items',
    category: 'Business',
    description: 'Capture attendees, agenda items, decisions, and assigned action owners cleanly.',
    thumbnailColor: 'from-rose-600 to-pink-700',
    accentColor: '#be123c',
    iconKey: 'file-text',
    sourceName: 'Word 365 Meeting Notes',
    featured: true,
    content: `
      <p class="word-title" style="color: #9f1239;">Meeting Minutes &amp; Sync Notes</p>
      <p class="word-subtitle" style="color: #595959;">Date: ${today()} &bull; Time: 10:00 AM &bull; Facilitator: [Organizer Name]</p>

      <h1 style="color: #9f1239;">Attendees</h1>
      <ul>
        <li>[Participant Name] &mdash; Project Lead</li>
        <li>[Participant Name] &mdash; Engineering</li>
        <li>[Participant Name] &mdash; Product &amp; Design</li>
      </ul>

      <h1 style="color: #9f1239;">Agenda &amp; Discussion Summary</h1>
      <ol>
        <li>Review current sprint deliverables and timeline health.</li>
        <li>Align on architecture, security compliance, and QA readiness.</li>
        <li>Confirm next release milestones and owners.</li>
      </ol>

      <h1 style="color: #9f1239;">Action Items</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
        <thead>
          <tr style="background-color: #fff1f2;">
            <th style="border: 1px solid #fecdd3; padding: 8px 12px; text-align: left; color: #9f1239;">Action Item</th>
            <th style="border: 1px solid #fecdd3; padding: 8px 12px; text-align: left; color: #9f1239;">Owner</th>
            <th style="border: 1px solid #fecdd3; padding: 8px 12px; text-align: left; color: #9f1239;">Due Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Finalize specification sign-off and release checklist</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Product Team</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Friday</td>
          </tr>
          <tr>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Complete automated integration verification</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Engineering</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Next Monday</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'red-and-black-report',
    name: 'Red & Black Annual Report',
    category: 'Reports',
    description: 'High-contrast executive Annual Report modeled on Word’s RedAndBlackReport.dotx.',
    thumbnailColor: 'from-red-600 to-zinc-800',
    accentColor: '#EF4623',
    iconKey: 'bar-chart',
    sourceName: 'RedAndBlackReport.dotx',
    content: `
      <p class="word-title" style="color: #EF4623;">Annual Report</p>
      <p class="word-subtitle" style="color: #262626; font-weight: 700;">FY 2026 &bull; [Company Name]</p>

      <blockquote style="border-left: 4px solid #EF4623; background-color: #fef2f2; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0; color: #1f2937;"><em>&ldquo;[Add an executive quote here from company leadership or summarize the defining milestone of the fiscal year.]&rdquo;</em></p>
      </blockquote>

      <h1 style="color: #EF4623;">Year in Review</h1>
      <p>Detail annual growth, key product launches, customer expansion, and operational milestones achieved during FY 2026.</p>

      <h1 style="color: #EF4623;">Financial Performance Overview</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
        <thead>
          <tr style="background-color: #262626; color: #ffffff;">
            <th style="border: 1px solid #262626; padding: 8px 12px; text-align: left;">Category</th>
            <th style="border: 1px solid #262626; padding: 8px 12px; text-align: left;">FY 2025</th>
            <th style="border: 1px solid #262626; padding: 8px 12px; text-align: left;">FY 2026</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Annual Revenue</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">\$4.2M</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; color: #EF4623;">\$6.1M</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">Operating Margin</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px;">18.4%</td>
            <td style="border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold;">23.1%</td>
          </tr>
        </tbody>
      </table>

      <hr/>
      <p style="font-size: 9.5pt; color: #595959;">[Company Name] &bull; Tel: [Telephone] &bull; [Address, City, ST ZIP] &bull; [Website] &bull; [Email]</p>
    `,
  },
  {
    id: 'essential-report',
    name: 'Essential Executive Report',
    category: 'Reports',
    description: 'Bold charcoal & gold executive report layout based on Word’s EssentialReport.dotx.',
    thumbnailColor: 'from-amber-500 to-stone-800',
    accentColor: '#C59200',
    iconKey: 'briefcase',
    sourceName: 'EssentialReport.dotx',
    content: `
      <p style="text-transform: uppercase; letter-spacing: 0.14em; color: #B48200; font-weight: 700; font-size: 10pt; margin-bottom: 4px;">[Document Subtitle / Department]</p>
      <p class="word-title" style="color: #262626; border-bottom: 4px solid #F5C201; padding-bottom: 8px;">[Type the Document Title]</p>
      <p style="color: #595959; margin-top: 10px;">[Type the abstract of the document here. The abstract is typically a concise summary of the contents and key takeaways.]</p>

      <h1 style="color: #262626;">Heading 1: Primary Analysis</h1>
      <p>Use this section for your main report narrative. Highlight crucial takeaways using pull-quotes or a structured sidebar box below.</p>

      <blockquote style="border-left: 4px solid #F5C201; background-color: #fffbeb; padding: 12px 16px; margin: 14px 0;">
        <p style="margin: 0;"><strong>Sidebar Callout:</strong> A sidebar is a standalone supplement to the main document containing key stats, definitions, or executive highlights.</p>
      </blockquote>

      <h2 style="color: #595959;">Supporting Details</h2>
      <ul>
        <li>Itemized finding or operational recommendation #1.</li>
        <li>Itemized finding or operational recommendation #2.</li>
      </ul>
    `,
  },
  {
    id: 'timeless-report',
    name: 'Timeless Annual Report',
    category: 'Reports',
    description: 'Clean steel-blue & warm terracotta stakeholder report from Word’s TimelessReport.dotx.',
    thumbnailColor: 'from-slate-600 to-sky-800',
    accentColor: '#7E97AD',
    iconKey: 'book-open',
    sourceName: 'TimelessReport.dotx',
    content: `
      <p class="word-title" style="color: #4A6B82;">Annual Report</p>
      <p class="word-subtitle" style="color: #CC8E60;">FY 2026 &bull; [Company Name]</p>
      <p style="color: #595959;"><em>[You can add an abstract or key executive statement here summarizing organizational progress and strategic direction.]</em></p>
      <hr/>

      <h1 style="color: #4A6B82;">Letter to Stakeholders</h1>
      <p>Dear Partners and Team Members,</p>
      <p>Over the past year, our organization strengthened core infrastructure, expanded customer trust, and delivered sustained growth across every major initiative.</p>

      <h1 style="color: #4A6B82;">Strategic Priorities Ahead</h1>
      <ul>
        <li>Accelerate product innovation and cloud reliability standards.</li>
        <li>Deepen enterprise partnerships and global availability.</li>
      </ul>

      <p style="margin-top: 24px; font-size: 9.5pt; color: #595959;">
        <strong>[Company Name]</strong><br/>
        [Street Address, City, ST ZIP Code] &bull; Tel: [Telephone] &bull; [Website]
      </p>
    `,
  },
  {
    id: 'origin-report',
    name: 'Origin Structured Report',
    category: 'Reports',
    description: 'Refined editorial report template modeled on OriginReport.Dotx with indigo-mist styling.',
    thumbnailColor: 'from-indigo-500 to-slate-700',
    accentColor: '#5B678D',
    iconKey: 'file-text',
    sourceName: 'OriginReport.Dotx',
    content: `
      <p class="word-title" style="color: #4A5578; font-family: 'Bookman Old Style', Georgia, serif;">[Type the Document Title]</p>
      <p class="word-subtitle" style="color: #727CA3;">[Type the Document Subtitle]</p>
      <p style="color: #595959; font-size: 10.5pt;">[Author Name] &bull; [Company Name] &bull; ${today()}</p>
      <hr/>

      <h1 style="color: #4A5578;">1. Overview</h1>
      <p>Begin documenting your research summary, business case, or formal policy brief. Use consistent heading hierarchy for automatic Table of Contents generation.</p>

      <h1 style="color: #4A5578;">2. Detailed Findings</h1>
      <p>Insert structured evidence, comparative notes, and technical diagrams where appropriate.</p>
    `,
  },
  {
    id: 'adjacency-resume',
    name: 'Adjacency Modern Resume',
    category: 'Resumes',
    description: 'Clean modern resume with olive-teal headers from Word’s AdjacencyResume.dotx.',
    thumbnailColor: 'from-teal-600 to-cyan-800',
    accentColor: '#3B6E6C',
    iconKey: 'user-check',
    sourceName: 'AdjacencyResume.dotx',
    content: `
      <p class="word-title" style="color: #3B6E6C; margin-bottom: 4px;">[Type Your Name]</p>
      <p style="color: #595959; font-size: 10.5pt; margin-top: 0;">[Phone Number] &bull; [E-mail Address] &bull; [Street Address] &bull; [Website]</p>
      <hr/>

      <h1 style="color: #3B6E6C;">Objectives</h1>
      <p>[Type your concise career objective and target role statement here.]</p>

      <h1 style="color: #3B6E6C;">Experience</h1>
      <p><strong>[Job Title]</strong> &nbsp;|&nbsp; [Start Date] &ndash; [End Date]<br/>
      <em>[Company Name] &nbsp;|&nbsp; [Company Address]</em></p>
      <ul>
        <li>[Type key job responsibility or quantifiable achievement.]</li>
        <li>[Type key leadership or technical project outcome.]</li>
      </ul>

      <h1 style="color: #3B6E6C;">Education</h1>
      <p><strong>[School / University Name]</strong><br/>
      [Completion Date] &nbsp;|&nbsp; [Degree Title]</p>
      <ul>
        <li>[Type list of honors, coursework, or accomplishments.]</li>
      </ul>
    `,
  },
  {
    id: 'apothecary-resume',
    name: 'Apothecary Editorial Resume',
    category: 'Resumes',
    description: 'Serif editorial CV layout modeled on Word’s ApothecaryResume.dotx.',
    thumbnailColor: 'from-stone-600 to-rose-800',
    accentColor: '#CF543F',
    iconKey: 'user-check',
    sourceName: 'ApothecaryResume.dotx',
    content: `
      <p class="word-title" style="color: #5E6D64; font-family: 'Book Antiqua', Georgia, serif; margin-bottom: 2px;">[Type Your Name]</p>
      <p style="color: #CF543F; font-size: 10.5pt; margin-top: 0;">[Address] &bull; [Phone] &bull; [E-mail] &bull; [Website]</p>
      <hr/>

      <h1 style="color: #CF543F;">Objectives</h1>
      <p>[Describe your specialization, design/business strengths, and career goals.]</p>

      <h1 style="color: #CF543F;">Experience</h1>
      <p><strong>[Job Title]</strong> &bull; [Start Date] &ndash; [End Date]<br/>
      <em>[Company Name] &bull; [City, Country]</em></p>
      <ul>
        <li>[Type key responsibilities and delivered outcomes.]</li>
      </ul>

      <h1 style="color: #CF543F;">Skills &amp; Education</h1>
      <p><strong>Skills:</strong> [Type list of core skills and tools]</p>
      <p><strong>Education:</strong> [Degree], [School Name] ([Year])</p>
    `,
  },
  {
    id: 'timeless-resume',
    name: 'Timeless Executive Resume',
    category: 'Resumes',
    description: 'Structured corporate resume template modeled on Word’s TimelessResume.dotx.',
    thumbnailColor: 'from-sky-700 to-slate-800',
    accentColor: '#4A6B82',
    iconKey: 'user-check',
    sourceName: 'TimelessResume.dotx',
    content: `
      <p class="word-title" style="color: #4A6B82; margin-bottom: 2px;">[Your Name]</p>
      <p style="color: #595959; font-size: 10.5pt;">[Street Address] &bull; [City, ST ZIP Code] &bull; [Telephone] &bull; [Email] &bull; [Website]</p>
      <hr/>

      <h1 style="color: #4A6B82;">Objective</h1>
      <p>To contribute senior expertise in strategic execution, engineering, or operations within an innovative growth-focused organization.</p>

      <h1 style="color: #4A6B82;">Skills &amp; Abilities</h1>
      <ul>
        <li>Program Management &amp; Cross-Functional Leadership</li>
        <li>Technical Documentation, Systems Design &amp; Stakeholder Alignment</li>
      </ul>

      <h1 style="color: #4A6B82;">Experience</h1>
      <p><strong>[Job Title, Company Name]</strong> &mdash; <em>[Dates From &ndash; To]</em></p>
      <p>[Summarize responsibilities, team leadership scope, and quantifiable results.]</p>

      <h1 style="color: #4A6B82;">Education</h1>
      <p><strong>[Degree / Major]</strong> &mdash; [Institution Name], [City, State]</p>
    `,
  },
  {
    id: 'essential-resume',
    name: 'Essential Bold Resume',
    category: 'Resumes',
    description: 'High-impact modern resume with bold header and amber accent from EssentialResume.dotx.',
    thumbnailColor: 'from-zinc-700 to-amber-700',
    accentColor: '#B48200',
    iconKey: 'user-check',
    sourceName: 'EssentialResume.dotx',
    content: `
      <p class="word-title" style="color: #262626; border-bottom: 3px solid #F5C201; padding-bottom: 6px;">[Type Your Name]</p>
      <p style="color: #595959; font-size: 10.5pt;">[E-mail] &bull; [Phone Number] &bull; [Address] &bull; [Website]</p>

      <h1 style="color: #262626;">Objectives</h1>
      <p>[Type your target role summary and core professional value proposition.]</p>

      <h1 style="color: #262626;">Experience</h1>
      <p><strong>[Company Name]</strong> | [Company Address]<br/>
      <em>[Job Title] ([Start Date] &ndash; [End Date])</em></p>
      <ul>
        <li>[Deliverable or achievement highlight]</li>
      </ul>

      <h1 style="color: #262626;">Education &amp; Skills</h1>
      <p><strong>[School Name]</strong> &mdash; [Degree] ([Completion Date])</p>
      <p><strong>Core Skills:</strong> [Skill 1], [Skill 2], [Skill 3], [Skill 4]</p>
    `,
  },
  {
    id: 'timeless-letter',
    name: 'Timeless Formal Letter',
    category: 'Letters',
    description: 'Executive company letterhead correspondence modeled on TimelessLetter.dotx.',
    thumbnailColor: 'from-slate-600 to-cyan-800',
    accentColor: '#4A6B82',
    iconKey: 'mail',
    sourceName: 'TimelessLetter.dotx',
    content: `
      <p style="color: #4A6B82; font-weight: 700; font-size: 13pt; margin-bottom: 2px;">[Company Name]</p>
      <p style="color: #595959; font-size: 9.5pt; margin-top: 0;">[Street Address, City, ST ZIP Code] &bull; Tel: [Telephone] &bull; Fax: [Fax] &bull; [Email] &bull; [Website]</p>
      <hr/>

      <p style="margin-top: 18px;">${today()}</p>
      <p style="margin-top: 12px;">
        <strong>[Recipient Name]</strong><br/>
        [Recipient Street Address, City, ST ZIP Code]
      </p>

      <p style="margin-top: 14px;">Dear [Recipient Name],</p>
      <p>[Write your formal business correspondence, client proposal follow-up, or executive introduction here.]</p>
      <p>[Provide concise supporting points or next-step scheduling details in the closing paragraph.]</p>

      <p style="margin-top: 20px;">Best regards,</p>
      <p style="margin-top: 24px;"><strong>[Sender Name]</strong><br/>[Sender Title]</p>
    `,
  },
  {
    id: 'red-and-black-letter',
    name: 'Red & Black Business Letter',
    category: 'Letters',
    description: 'Distinctive red-accent corporate letter modeled on RedAndBlackLetter.dotx.',
    thumbnailColor: 'from-red-600 to-neutral-900',
    accentColor: '#EF4623',
    iconKey: 'mail',
    sourceName: 'RedAndBlackLetter.dotx',
    content: `
      <p style="color: #EF4623; font-weight: 700; font-size: 11pt;">${today()}</p>
      <div style="border-left: 3px solid #EF4623; padding-left: 12px; margin: 14px 0;">
        <p style="margin: 0; font-weight: 700; color: #EF4623;">To:</p>
        <p style="margin: 2px 0 0 0;">[Recipient Name]<br/>[Recipient Address]<br/>[City, ST ZIP Code]</p>
      </div>

      <p style="margin-top: 16px;"><strong>Dear [Recipient],</strong></p>
      <p>If you&rsquo;re ready to write, click anywhere in this paragraph and start typing. Customize accent colors or font pairings anytime from the Design ribbon tab.</p>
      <p>Include key updates, formal requests, or agreement confirmation details here clearly and concisely.</p>

      <p style="margin-top: 20px;">Warm regards,</p>
      <p style="margin-top: 24px;"><strong>[Your Name]</strong><br/>[Company Name]</p>
    `,
  },
  {
    id: 'word-blog-post',
    name: 'Blog Article & Post',
    category: 'Newsletters',
    description: 'Modern Word 365 blog article layout (Blog.dotx) with lead hook, subheadings, and takeaways.',
    thumbnailColor: 'from-blue-500 to-orange-600',
    accentColor: '#156082',
    iconKey: 'newspaper',
    sourceName: 'Blog.dotx',
    content: `
      <p class="word-title">[Engaging Article Headline Goes Here]</p>
      <p class="word-subtitle" style="color: #595959;">By [Author Name] &bull; Published ${today()} &bull; 5 min read</p>

      <p style="font-size: 13pt; color: #262626;"><em>Lead paragraph: Hook your audience right away by framing the core problem or insight this article explores.</em></p>

      <h1>Why This Topic Matters Now</h1>
      <p>Expand on the main context, trends, or real-world examples readers should understand before diving into actionable steps.</p>

      <blockquote class="word-intense-quote">
        &ldquo;Use an Intense Quote callout block to emphasize a memorable insight or key statistic.&rdquo;
      </blockquote>

      <h1>Key Takeaways</h1>
      <ul>
        <li>Practical step or lesson #1 for your readers.</li>
        <li>Practical step or lesson #2 with measurable impact.</li>
        <li>Closing call-to-action or next resource link.</li>
      </ul>
    `,
  },
  {
    id: 'software-spec',
    name: 'Architecture Specification',
    category: 'Engineering',
    description: 'Technical design spec with system topology, subsystem contracts, and security policies.',
    thumbnailColor: 'from-indigo-600 to-purple-700',
    accentColor: '#4338ca',
    iconKey: 'file-code',
    sourceName: 'Word 365 Engineering',
    content: `
      <p class="word-title" style="color: #3730a3;">Software Architecture Specification</p>
      <p class="word-subtitle">Document Version: 2.4 &bull; Status: Approved &bull; ${today()}</p>

      <h1 style="color: #3730a3;">1. Architecture Overview</h1>
      <p>The platform employs a hybrid dual-plane architecture pairing an edge reactive web application with resilient cloud storage APIs and local virtual filesystem drivers.</p>

      <h1 style="color: #3730a3;">2. Key Subsystems</h1>
      <ul>
        <li><strong>Web Application Plane:</strong> React 18, TypeScript, Vite, Tailwind CSS, and Word-compatible document canvas.</li>
        <li><strong>Storage &amp; Sync Engine:</strong> Chunked resumable upload pipelines with checksum integrity verification.</li>
        <li><strong>Filesystem Provider:</strong> User-mode virtual drive integration exposing cloud namespaces directly in Explorer.</li>
      </ul>

      <h1 style="color: #3730a3;">3. Security &amp; Encryption Model</h1>
      <p>All sessions verify signed JWT claims, strict tenant Row-Level Security (RLS), and encrypted transport boundaries.</p>
    `,
  },
  {
    id: 'research-paper',
    name: 'Academic Research Paper',
    category: 'Academic',
    description: 'Formal APA / IEEE style scholarly paper with abstract callout, methodology, and citations.',
    thumbnailColor: 'from-amber-600 to-orange-700',
    accentColor: '#b45309',
    iconKey: 'graduation-cap',
    sourceName: 'Word 365 Academic',
    content: `
      <p class="word-title" style="text-align: center; font-size: 22pt;">High-Throughput User-Mode Virtual Filesystems for Cloud Storage</p>
      <p style="text-align: center; font-style: italic; color: #595959;">Master Cloud Research Group &bull; Computer Systems &amp; Distributed Storage</p>

      <blockquote style="border-left: 4px solid #156082; background-color: #f8fafc; padding: 12px 16px; margin: 18px 0;">
        <p style="margin-top: 0;"><strong>Abstract</strong></p>
        <p style="margin-bottom: 0;">We present the design and empirical evaluation of a lightweight user-mode virtual filesystem architecture capable of streaming multi-gigabyte files with sub-millisecond directory enumeration latency.</p>
      </blockquote>

      <h1>1. Introduction</h1>
      <p>Traditional cloud synchronization clients replicate full directory trees locally. Range-based on-demand streaming avoids unnecessary disk consumption while preserving instantaneous random-access reads.</p>

      <h1>2. Methodology &amp; Experimental Results</h1>
      <p>Benchmarks demonstrate significant reductions in cold-open file latency and memory footprint across concurrent workloads.</p>

      <h1>3. References</h1>
      <p>[1] Master Cloud Systems Team (2026). <em>Hybrid Edge-to-Kernel Storage Virtualization</em>.</p>
    `,
  },
  {
    id: 'equations-workbook',
    name: 'Equations & STEM Worksheet',
    category: 'Academic',
    description: 'Technical formulas, scientific derivations, and variable tables (LiveContent Equations.dotx).',
    thumbnailColor: 'from-blue-700 to-violet-700',
    accentColor: '#4F81BD',
    iconKey: 'sigma',
    sourceName: 'Equations.dotx',
    content: `
      <p class="word-title" style="color: #1F4E79; font-family: Cambria, Georgia, serif;">Mathematical &amp; Physical Equations</p>
      <p class="word-subtitle">STEM Reference Sheet &amp; Derivation Notes &bull; ${today()}</p>

      <h1 style="color: #1F4E79;">1. Fundamental Identities</h1>
      <ul>
        <li><strong>Quadratic Formula:</strong> x = (&minus;b &plusmn; &radic;(b&sup2; &minus; 4ac)) / 2a</li>
        <li><strong>Euler&rsquo;s Identity:</strong> e<sup>i&pi;</sup> + 1 = 0</li>
        <li><strong>Normal Distribution:</strong> f(x) = (1 / (&sigma;&radic;(2&pi;))) &middot; exp(&minus;(x &minus; &mu;)&sup2; / 2&sigma;&sup2;)</li>
      </ul>

      <h1 style="color: #1F4E79;">2. Variable Definitions Table</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
        <thead>
          <tr style="background-color: #4F81BD; color: #ffffff;">
            <th style="border: 1px solid #4F81BD; padding: 8px 12px; text-align: left;">Symbol</th>
            <th style="border: 1px solid #4F81BD; padding: 8px 12px; text-align: left;">Quantity</th>
            <th style="border: 1px solid #4F81BD; padding: 8px 12px; text-align: left;">SI Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;"><em>F</em></td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Force</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">N (kg&middot;m/s&sup2;)</td>
          </tr>
          <tr style="background-color: #f4f7fb;">
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;"><em>E</em></td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Energy</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">J (N&middot;m)</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'cover-page-banded',
    name: 'Banded Executive Cover & Brief',
    category: 'Business',
    description: 'Word Built-In Banded Cover Page paired with an executive briefing document.',
    thumbnailColor: 'from-blue-800 to-sky-700',
    accentColor: '#0F4761',
    iconKey: 'file-check',
    sourceName: 'Built-In Building Blocks.dotx',
    content: `
      <div style="background-color: #0F4761; color: #ffffff; padding: 28px 24px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 10pt; letter-spacing: 0.14em; text-transform: uppercase; color: #9ecae1;">Executive Brief</p>
        <p class="word-title" style="color: #ffffff; margin: 8px 0 6px 0;">[DOCUMENT TITLE]</p>
        <p style="margin: 0; font-size: 13pt; color: #dbeafe;">[Document Subtitle &bull; Confidential Strategy Overview]</p>
      </div>
      <p style="color: #595959; font-size: 10.5pt;"><strong>Author:</strong> [Your Name] &nbsp;|&nbsp; <strong>Organization:</strong> [Company Name] &nbsp;|&nbsp; <strong>Date:</strong> ${today()}</p>
      <hr/>

      <h1>Executive Briefing</h1>
      <p>Provide decision-makers with a structured one-page brief outlining business context, options evaluated, financial impact, and recommended next steps.</p>

      <h2>Key Recommendations</h2>
      <ol>
        <li>Approve milestone schedule and allocate core engineering resources.</li>
        <li>Establish weekly KPI tracking and risk mitigation checkpoints.</li>
      </ol>
    `,
  },
];
