# Implementation Plan: INFBOTT Settings System & Pure Black Dynamic UI Upgrade

Upgrade the INFBOTT application with a production-grade, fully functional Settings Dashboard inspired by modern multi-section mobile/desktop settings architecture, alongside a pure black UI overhaul (#000000), dynamic interactive AI chat widgets, and a zero-lag asynchronous media upload pipeline.

## User Review Required

> [!IMPORTANT]
> - **Settings Architecture**: Full-screen layered view with drill-down sub-pages, search filtering, and categorized rounded panels matching the reference design.
> - **Color System**: Pure Black (`#000000`) application canvas, `#111111` secondary background, `#2C2C2C` settings cards, `#1A1A1A` secondary surfaces, `#414141` dividers, `#FFFFFF` text, `#A0A0A0` secondary text, and `#9b72cb` purple premium accent.
> - **Storage Strategy**: Dual-mode storage (IndexedDB client cache for guest sessions, Firebase Storage and Firestore sync when authenticated) ensuring zero friction for testing and persistent cloud backups for authenticated accounts.

---

## 1. Core Architecture & Settings Modules

### A. Settings Dashboard Component Tree (`src/components/settings/`)
We will organize settings into clean, modular components under `src/components/settings/`:
- `SettingsView.tsx`: Main container with search input, top navigation (Back, "Settings", Info), category lists, and sub-page routing.
- Sub-pages / Sections:
  1. `AccountSection.tsx`: Profile picture & avatar upload (with canvas cropper/compression), display name change, email status, UID, account creation date, and metadata sync with Firebase Auth + Firestore `users/{uid}`.
  2. `WorkspaceSection.tsx`: Personal workspace stats, default workspace title, autosave toggle, cloud sync frequency.
  3. `PremiumSection.tsx`: Real subscription status, current credits breakdown (`userCredits`), feature matrix (Argon Pro, unlimited Flash, high-res canvas, web grounding), upgrade trigger dialog.
  4. `PersonalizationSection.tsx`: AI response style (Concise, Balanced, In-Depth, Code Specialist), language selection (English, Hindi, Hinglish), response length presets, custom system instructions editor (synced to Firestore and localStorage).
  5. `MemorySection.tsx`: Master memory toggle, live memory list fetched from Firestore `memories` collection via `memoryService.ts`, memory editing modal, individual delete, and "Clear All Memories" with confirmation.
  6. `PluginsSection.tsx`: Real plugin manager (Google Web Grounding, Code & Game Sandbox, Document Vision, Image Studio, Minecraft Generator), enable/disable toggles, permission badges, active status.
  7. `CodexSection.tsx`: Coding language preference (TypeScript, Python, JavaScript, C++, HTML/CSS, SQL), code formatting style, auto-run sandboxes toggle, inline explanation toggle.
  8. `GeneralSection.tsx`: Theme selector (Pure Black, Liquid OLED, High Contrast), chat sound effects toggle, Enter key behavior, font size options, reduced motion.
  9. `UsageSection.tsx`: Live usage metrics (total messages sent, model usage breakdown, generated images count, remaining credits, storage consumed in MB), historical breakdown.
  10. `NotificationsSection.tsx`: Browser notification permission request (`Notification.requestPermission()`), chat completion alerts, security notifications, sound alerts.
  11. `VoiceSection.tsx`: Speech synthesis voice picker (Alloy, Echo, Fable, Onyx, Nova, Shimmer), speech rate slider (0.8x - 1.5x), auto-read response toggle, microphone input status and permission check.
  12. `SafetySection.tsx`: Safety filters, prompt injection protection toggle, safe web search toggle, detailed policy descriptions.
  13. `SecuritySection.tsx`: Password update (via Firebase Auth `updatePassword` or password reset email), email verification button, active session timestamp, provider ID, reauthentication guard.
  14. `StorageSection.tsx`: Real storage manager displaying uploaded chat files, file sizes, mime types, storage usage gauge, delete file confirmation, cache clear.
  15. `PrivacySection.tsx`: Full account data export (downloads complete JSON containing user profile, chat sessions, memories, notebook snippets), account deletion with multi-step confirmation and Firestore cascade deletion.
  16. `HistorySection.tsx`: Chat history search, conversation export (JSON, Markdown, PDF), clear all conversations with confirmation.
  17. `AdsSection.tsx`: Transparent disclosure showing INFBOTT is 100% ad-free, zero trackers, private by default.
  18. `SettingsSearch.tsx`: Instant fuzzy search over all setting titles, keywords, and descriptions with direct jump links and empty state.

---

## 2. Pure Black UI Theme System

### Visual Specifications
- **Main Canvas & Chat Background**: `#000000` (pure OLED black).
- **Secondary Background**: `#111111` (subtle contrast for inputs and sidebars).
- **Settings Cards / Panels**: `#2C2C2C` with subtle `border border-[#414141]/50` and rounded corners.
- **Secondary Surfaces / Item Rows**: `#1A1A1A`.
- **Dividers & Borders**: `#414141`.
- **Typography**: `#FFFFFF` for titles and active text, `#A0A0A0` for subtitles and metadata.
- **Accent**: `#9b72cb` for premium badges, active toggles, and highlights.
- **Danger / Logout**: `#ef4444` for irreversible actions and sign out.

---

## 3. Dynamic AI Chat UI & Interactive Widgets

### Dynamic Components (`src/components/chat/dynamic/`)
1. **Interactive Form & Decision Buttons**: Structured options returned by the AI that allow the user to click to trigger immediate follow-ups or set parameters.
2. **Interactive Data Tables & Cards**: Formatted financial, comparison, or spec tables with column sorting and search.
3. **Color Palette & Design Previews**: Clickable color swatch cards with one-click hex copying.
4. **Live Progress Indicators**: Multi-step progress bars for multi-stage complex workflows (e.g. data processing, synthesis).
5. **Rich Document & Media Cards**: Media previews with download, fullscreen zoom, and metadata.

---

## 4. Zero-Lag Asynchronous Media Upload Pipeline

### Architecture
- **Non-blocking Upload Queue**: File uploads run in background state via an `UploadManager` without holding or locking the chat input, scroll position, or message streaming.
- **Per-file Progress Tracking**: Individual percentage bars, lightweight thumbnail generation using `URL.createObjectURL` and Web Workers for image resizing.
- **Pause, Resume, and Cancel**: File upload items can be cancelled or removed before sending.
- **Media Support**: Images (PNG, JPG, WEBP, GIF), Videos (MP4, WEBM), Documents (PDF, DOCX, TXT, CSV, JSON, Markdown), Audio (MP3, WAV, OGG).
- **Resilience**: Files are validated before upload; incomplete uploads are prevented from being attached to AI prompts.

---

## 5. Verification & Testing Plan

1. **Automated Verification**:
   - `npm run lint` (`tsc --noEmit`): Verify 0 TypeScript compilation errors across all new and edited files.
   - Run `tests/verification.test.ts` to ensure zero regressions in routing, security, and credit deduction.
   - Run `compile_applet` (`npm run build`) to ensure Vite bundle builds cleanly.
2. **Interactive Feature Verification**:
   - Open Settings via sidebar user profile button and header settings icon.
   - Test Settings Search filter for instant navigation to any setting.
   - Verify every toggle, slider, and input in all 17 sub-sections.
   - Test profile avatar upload and display name update with persistence.
   - Test Memory add, edit, individual delete, and clear all.
   - Test Export Data (JSON download) and Verify Chat History clear.
   - Test File Upload in chat while simultaneously typing and receiving streamed AI messages.
   - Test Log Out confirmation and verify clean redirection to sign-in screen.
