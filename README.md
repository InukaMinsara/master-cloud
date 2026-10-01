# MASTER CLOUD

[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**MASTER CLOUD** is a premium, modern, scalable cloud-storage and file-collaboration platform inspired by the engineering excellence of Google Drive, Dropbox, OneDrive, and WeTransfer.

> **ABSOLUTE STORAGE POLICY**: Every registered user automatically receives **10 TB (10,995,116,277,760 bytes)** of high-speed cloud storage completely free. No paid plans, no billing, no credit card required, and no subscription upgrades. Storage quotas are strictly enforced at the engine and database levels.

Designed from the ground up for high reliability, zero-trust security, and graceful extensibility, MASTER CLOUD features a **Dual-Engine Architecture** that operates seamlessly out-of-the-box in local development with high-fidelity IndexedDB persistence and transitions into a full PostgreSQL/Supabase production backend with Row-Level Security (RLS) and object storage.

---

## 🌟 Key Features

### 1. Robust File & Folder Management
* **Hierarchical Folders**: Unlimited nested directories, breadcrumb navigation, and custom tint colors.
* **Drag-and-Drop Operations**: Drag files from desktop into any folder, or drag files/folders into subfolders.
* **Bulk Operations**: Multi-selection bar with one-click bulk download, bulk trash, and bulk move.
* **File Operations**: Upload, Download, Rename, Move, Copy, Soft Delete, Restore, Permanent Purge, and Star/Unstar.

### 2. High-Fidelity Upload Center
* **Live Telemetry**: Real-time byte progress, live transfer speed (e.g. `4.2 MB/s`), and file queue state.
* **Resumable / Chunked Architecture**: Handles large files without memory exhaustion.
* **Queue Controls**: Pause, Cancel, and Retry failed uploads with error diagnostics.

### 3. Smart Storage Analytics & Optimizer
* **Dynamic Breakdown**: Real-time storage metrics by category: Documents, Photos, Videos, Code, Archives, and Trash.
* **Deterministic Cleanup Suggestions**:
  * Large asset detection (> 5 MB).
  * Dormant file identification (> 90 days unmodified).
  * Duplicate detection via SHA-256 checksum matching.
* **Safe Authorization**: User confirmation required before any deletion.

### 4. Advanced Sharing & Collaboration
* **User-to-User Sharing**: Granular permissions (`Viewer`, `Commenter`, `Editor`, `Owner`).
* **Secure Public Links**:
  * Unpredictable random token generation.
  * Optional password protection (hashed authorization).
  * Expiration date scheduling.
  * Instant QR code generation for mobile transfers.
  * Download restriction controls.
* **Guest File Requests (`/request/:token`)**: Create dedicated dropboxes where non-registered users can upload directly into a folder without viewing its contents.

### 5. Multi-Format File Preview
* **Images**: High-resolution viewer with zoom (`0.5x` to `3x`) and 90° clockwise rotation.
* **Video & Audio**: Built-in media streaming players with playback controls.
* **Code & Documents**: Interactive syntax viewer for JSON, YAML, Markdown, TXT, CSV, and code files.
* **Unsupported Formats**: Clean metadata summary and direct download fallback.

### 6. File Details Workspace & Revision Control
* **Side-Over Workspace**: Instant metadata inspection (Size, MIME, Checksum, Location, Timestamps, Owner).
* **Live Comments**: Collaborative discussion thread attached directly to files.
* **Revision History**: Track multiple file versions, view diffs, and restore any previous version without data loss.

### 7. Global Command Center (`Ctrl + K`)
* Keyboard-driven command palette for instant navigation, file search, folder creation, theme toggling, and quick actions.

### 8. Device Center & Security Audit
* **Device Management**: Audit active sessions, operating systems, browsers, and IP addresses with remote session revocation.
* **Activity Log**: Immutable audit trail of every upload, download, move, share, and authentication event.

---

## 🏗️ Architecture & Technology Stack

```
MASTER CLOUD
├── Frontend
│   ├── React 18 & TypeScript (Strict Type Safety)
│   ├── Vite 6 (Lightning Fast HMR & Production Bundler)
│   ├── Tailwind CSS & custom design tokens (Light / Dark / System mode)
│   ├── Zustand (Decoupled, high-performance reactive stores)
│   ├── Lucide Icons & Radix UI accessible patterns
│   └── JSZip (Client-side folder and bundle packaging)
│
├── Backend & Infrastructure
│   ├── Supabase (PostgreSQL 15+, Supabase Auth, Storage)
│   ├── Row-Level Security (RLS) on all 15 core tables
│   ├── Storage Bucket: `master-cloud-files`
│   └── High-Fidelity Local Engine (Fallback IndexedDB + LocalStorage)
│
└── Future Module Boundaries (Decoupled Interfaces)
    ├── Cloud-to-Cloud Sync (Google Drive, Dropbox, OneDrive)
    ├── Multi-Device Sync Daemon
    ├── Automated Backup & Snapshot Engine
    └── Isolated AI Module Interface
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher (v25+ supported)
* **npm**: v9.0.0 or higher

### Installation

1. **Clone or navigate to the repository**:
   ```bash
   cd "d:/Im Share X/Master Cloud"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Configure your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_STORAGE_BUCKET=master-cloud-files
   ```
   *(If left unconfigured, MASTER CLOUD automatically runs in high-speed Local Engine mode with full functionality and persistent IndexedDB storage).*

4. **Run Database Migrations** (For Supabase projects):
   Apply the complete schema migration located at:
   ```
   supabase/migrations/20260101000000_master_cloud_init.sql
   ```
   You can run this using the Supabase CLI (`supabase db push`) or copy and execute the SQL directly in the **Supabase Dashboard SQL Editor**.

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Verification

Run the core verification test suite:
```bash
npm test
```

Build production bundle and verify type-checking:
```bash
npm run build
```

---

## 🔒 Security Architecture

* **Never Expose Service Roles**: Client code only accesses public anon keys.
* **Row-Level Security (RLS)**: Enforces that users can only access their own resources or resources explicitly shared with them.
* **Token Hardening**: Public share tokens use 128-bit cryptographic entropy (`crypto.getRandomValues`).
* **Safe Checksums**: Client-side SHA-256 verification detects corrupted or tampered uploads.
* **Path Traversal Protection**: All paths are sanitized against directory traversal.

---

## 🗺️ Future Roadmap

- [ ] Multi-Device Desktop Sync Daemon (Electron / Tauri)
- [ ] Cloud-to-Cloud sync adapter for Google Drive, OneDrive, and Dropbox
- [ ] Isolated AI assistant module for automatic document summarization
- [ ] Zero-Knowledge end-to-end client-side encryption keys
- [ ] Enterprise team workspaces and advanced compliance logs

---

## 📄 License
Released under the [MIT License](LICENSE).
