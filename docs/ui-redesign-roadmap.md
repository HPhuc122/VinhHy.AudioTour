# VinhHy Audio Tour UI Redesign Roadmap

This roadmap implements the audit recommendation: keep the current .NET backend and redesign the React UI around clearer business flows inspired by the reference project. Do not copy MAUI, Razor, or .NET Admin UI code.

## Phase 1: Freeze Business Spec

Status: started.

Deliverables:
- Canonical role definitions.
- Canonical POI lifecycle and payment states.
- Media, narration, translation, guest access, and public visibility rules.
- Shared wording for Admin, Vendor, and Public UI.

Source of truth:
- `docs/business-workflow.md`
- Existing backend authorization policies and services.

## Phase 2: Simplify Navigation and Role-Specific Shell

Status: started.

Goals:
- Group CMS pages by business purpose instead of technical entities.
- Separate Admin and Vendor mental models.
- Keep existing routes and route guards.
- Fix corrupted Vietnamese navigation labels.
- Avoid deleting pages or weakening authorization.

Admin navigation target:
- Tong quan
- Dia diem va sap
  - Danh sach POI
  - Cho duyet
  - Cho thanh toan
- Noi dung
  - Thu vien anh
  - Ban thuyet minh
  - Ban dich
- Tour va ban do
  - Tour
  - Ban do
- Goi nghe va QR
  - Goi thuyet minh
  - QR truy cap
- He thong
  - Nguoi dung
  - Vai tro
  - Ngon ngu
- Ho so

Vendor navigation target:
- Tong quan
- Sap cua toi
- Dang ky dia diem/sap
- Thu vien
  - Hinh anh
  - Ban thuyet minh
  - Ban dich
- Thanh toan
- Ho so

Public navigation target:
- Trang chu
- Ban do
- Tour
- Goi nghe / Quet QR
- Dia diem

## Phase 3: Redesign Admin Dashboard and POI Management

Planned:
- Replace dense POI table workflows with review queues and a POI detail workspace.
- Promote lifecycle and payment status as stepper/status panels.
- Move row actions into a detail drawer or page.

## Phase 4: Redesign Vendor Dashboard and POI Registration

Planned:
- Provide a vendor checklist: register stall, wait for review, pay if requested, upload content, publish.
- Convert the long POI modal into a guided registration flow.

## Phase 5: Redesign Media, Narration, and Translation Workspace

Planned:
- Use POI as the primary workspace.
- Tabs: Images, Narration, Translations, Audio, History.
- Show review status, rejection reasons, and next actions.

## Phase 6: Redesign Public POI, Tour, Map, and Audio Flow

Planned:
- Make scan QR, map, tour, and audio access the primary visitor journey.
- Add friendly protected-audio states and sticky playback UX.
- Add clearer map selected-POI and route-progress panels.

## Phase 7: Polish Vietnamese Labels and UI States

Planned:
- Fix corrupted Vietnamese text.
- Replace technical error messages with user-facing task guidance.
- Improve loading, empty, expired, forbidden, and payment-required states.

## Phase 8: Final Build, Test, and Manual UX Test

Planned:
- Build React admin and public apps.
- Run backend build/test when backend code changes.
- Manually test Admin, Vendor, and Guest flows.
- Verify protected audio and public visibility rules remain intact.
