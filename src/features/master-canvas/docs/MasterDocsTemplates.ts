export interface DocumentTemplate {
  id: string;
  name: string;
  category: 'Business' | 'Academic' | 'Personal' | 'Engineering' | 'Legal';
  description: string;
  thumbnailColor: string;
  content: string;
}

export const MASTER_DOCS_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'Personal',
    description: 'Start fresh with a clean, unformatted document page.',
    thumbnailColor: 'from-blue-500 to-indigo-600',
    content: '<p>Start typing your document here...</p>',
  },
  {
    id: 'project-proposal',
    name: 'Executive Project Proposal',
    category: 'Business',
    description: 'Comprehensive project charter with objectives, milestones, timeline, and budget.',
    thumbnailColor: 'from-emerald-500 to-teal-600',
    content: `
      <h1 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Executive Project Proposal</h1>
      <p style="color: #6b7280; font-size: 14px; margin-top: -4px;">Prepared by: Master Cloud Team &bull; Date: ${new Date().toLocaleDateString()}</p>
      
      <h2>1. Executive Summary</h2>
      <p>This proposal outlines the strategic initiative to develop and deploy next-generation cloud infrastructure, offering high-throughput storage and desktop virtual drive access.</p>
      
      <h2>2. Project Objectives</h2>
      <ul>
        <li>Deploy high-resilience 10 TB free storage allocation per user account.</li>
        <li>Implement WinFsp user-mode kernel filesystem driver for zero-latency Windows File Explorer streaming.</li>
        <li>Ensure zero-trust security with end-to-end authenticated API gateways and continuous rollback versioning.</li>
      </ul>
      
      <h2>3. Project Milestones &amp; Deliverables</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Phase</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Key Deliverable</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Target Date</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Phase 1</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Core Virtual Drive &amp; Sync Engine</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Q1 2026</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #16a34a; font-weight: bold;">Completed</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Phase 2</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Master Canvas Document Suite</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Q2 2026</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #2563eb; font-weight: bold;">In Progress</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Phase 3</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Enterprise Multi-Region Federation</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Q3 2026</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #64748b;">Planned</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Budget &amp; Resource Allocation</h2>
      <p>Resource allocations are bounded to guarantee maximum cost efficiency while maintaining 99.99% availability SLAs.</p>
    `,
  },
  {
    id: 'software-spec',
    name: 'Software Architecture Specification',
    category: 'Engineering',
    description: 'Technical architecture document with system design, API contracts, and security policies.',
    thumbnailColor: 'from-violet-500 to-purple-600',
    content: `
      <h1 style="color: #4338ca; border-bottom: 2px solid #6366f1; padding-bottom: 8px;">Software Architecture Specification</h1>
      <p style="color: #6b7280; font-size: 14px;">Document Version: 2.4 &bull; Status: Approved</p>
      
      <h2>1. Architecture Overview</h2>
      <p>The Master Cloud architecture employs a hybrid dual-plane model consisting of an edge static web client and a local desktop daemon utilizing user-mode virtual filesystem hooks.</p>

      <h2>2. Key Subsystems</h2>
      <ul>
        <li><strong>Web Application Plane:</strong> React 18, Vite, Tailwind CSS, and Web Workers for parallel cryptographic hashing.</li>
        <li><strong>Storage &amp; Sync Engine:</strong> SQLite Write-Ahead Logging (WAL) journal paired with chunked resumable upload pipelines.</li>
        <li><strong>Filesystem Provider:</strong> WinFsp user-mode driver exposing a native Windows drive letter (<code>M:</code>).</li>
      </ul>

      <h2>3. Security &amp; Encryption Model</h2>
      <p>All authentication sessions are verified through zero-trust signed JWTs with Argon2 password hashing. Database tables are protected by Row-Level Security (RLS) policies enforcing multi-tenant isolation at the engine level.</p>
    `,
  },
  {
    id: 'research-paper',
    name: 'Academic Research Paper',
    category: 'Academic',
    description: 'Formal academic publication template with abstract, methodology, results, and citations.',
    thumbnailColor: 'from-amber-500 to-orange-600',
    content: `
      <h1 style="text-align: center; color: #1e293b;">High-Throughput User-Mode Virtual Filesystems for Cloud Storage</h1>
      <p style="text-align: center; font-style: italic; color: #64748b;">Master Cloud Research Lab &bull; Computer Systems &amp; Distributed Storage Group</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Abstract</h3>
        <p style="font-size: 14px; margin-bottom: 0;">We present the design and empirical evaluation of a lightweight user-mode virtual filesystem architecture capable of streaming multi-gigabyte files with sub-millisecond directory enumeration latency and 0-byte local disk consumption.</p>
      </div>

      <h2>1. Introduction</h2>
      <p>Traditional cloud storage synchronization solutions replicate entire directory trees to the host storage device, consuming extensive local SSD capacity. Our approach utilizes non-blocking metadata caching coupled with range-based on-demand streaming.</p>

      <h2>2. Methodology &amp; Implementation</h2>
      <p>The filesystem driver registers kernel-level callbacks via WinFsp, responding immediately with synthetic directory entries populated from a memory-mapped cache.</p>

      <h2>3. Experimental Results</h2>
      <p>Benchmarks demonstrate a 94% reduction in first-file open latency compared to legacy WebDAV implementations.</p>
    `,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Minutes & Action Items',
    category: 'Business',
    description: 'Structured template for capturing attendees, agenda topics, discussion notes, and assigned tasks.',
    thumbnailColor: 'from-rose-500 to-pink-600',
    content: `
      <h1 style="color: #be123c;">Sprint Planning &amp; Engineering Sync</h1>
      <p style="color: #64748b; font-size: 14px;">Date: ${new Date().toLocaleDateString()} &bull; Time: 10:00 AM UTC &bull; Location: Master Cloud Virtual Room</p>

      <h2>Attendees</h2>
      <ul>
        <li>Lead Architect</li>
        <li>Senior Full-Stack Engineer</li>
        <li>DevOps &amp; Security Engineer</li>
        <li>Product Designer</li>
      </ul>

      <h2>Agenda Topics</h2>
      <ol>
        <li>Master Docs ribbon toolbar and page layout verification.</li>
        <li>10 TB quota validation and server-side safety checks.</li>
        <li>Windows Virtual Drive release packaging.</li>
      </ol>

      <h2>Action Items</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #fff1f2;">
            <th style="border: 1px solid #fecdd3; padding: 8px 12px; text-align: left;">Task</th>
            <th style="border: 1px solid #fecdd3; padding: 8px 12px; text-align: left;">Assignee</th>
            <th style="border: 1px solid #fecdd3; padding: 8px 12px; text-align: left;">Due Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Finalize Table of Contents automatic generation</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Frontend Team</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Tomorrow</td>
          </tr>
          <tr>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Run production bundle security audit</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Security Team</td>
            <td style="border: 1px solid #fecdd3; padding: 8px 12px;">Friday</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'resume',
    name: 'Modern Executive Resume',
    category: 'Personal',
    description: 'Clean, elegant professional resume layout designed for tech and corporate roles.',
    thumbnailColor: 'from-blue-600 to-cyan-600',
    content: `
      <h1 style="color: #0f172a; margin-bottom: 2px;">Alex Rivera</h1>
      <p style="color: #2563eb; font-weight: 600; font-size: 16px; margin-top: 0;">Senior Principal Software Architect</p>
      <p style="color: #64748b; font-size: 13px;">San Francisco, CA &bull; alex@mastercloud.io &bull; (555) 234-5678 &bull; linkedin.com/in/alexrivera</p>

      <h2 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px;">Professional Summary</h2>
      <p>Results-driven software architect with 12+ years of experience leading distributed cloud systems, high-throughput filesystems, and cross-platform desktop applications.</p>

      <h2 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px;">Core Competencies</h2>
      <p><strong>Languages &amp; Runtimes:</strong> Rust, TypeScript, React, Go, C++, Python, Node.js<br/>
      <strong>Cloud &amp; Databases:</strong> PostgreSQL, SQLite WAL, Supabase, AWS S3, Cloudflare Workers, Redis<br/>
      <strong>Systems:</strong> WinFsp, Linux FUSE, Tauri v2, High-Performance I/O</p>

      <h2 style="color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px;">Professional Experience</h2>
      <p><strong>Principal Architect</strong> &bull; Master Cloud Technologies (2023 &ndash; Present)<br/>
      &bull; Architected the 10 TB virtual drive storage engine, achieving sub-10ms directory retrieval across 100,000+ files.<br/>
      &bull; Led the development of the Master Canvas real-time collaborative document suite.</p>
    `,
  },
];
