# VinhHy Audio Tour Business Workflow

This document freezes the business rules that the React admin and public web UI should explain clearly. It is a UI and workflow reference only; backend authorization, ownership checks, protected audio, and lifecycle/payment rules remain the source of truth.

## Roles

### Guest/Public
- Opens `web-public` without CMS login.
- Can browse public POIs, tours, map, and QR/package entry points.
- Can play protected audio only after receiving a valid `GuestAccessPass`.

### Vendor / Chu sap
- Registers a vendor account through the CMS registration flow.
- Can create and update their own POI/stall registrations while the lifecycle allows it.
- Can upload images and create narration drafts only for owned POIs.
- Can pay for their own POI when the POI is in `PendingPayment`.
- Cannot approve, reject, delete, restore, or activate other vendors' POIs.

### Admin
- Manages all POIs, vendors, media, narration, translations, tours, QR access, languages, users, and roles allowed by backend policy.
- Reviews vendor POI registrations.
- Requests/waives/confirms POI payments.
- Approves/rejects media and narration drafts.
- Uploads final MP3 audio.

### Existing Optional Roles
- `SuperAdmin`: legacy/admin-equivalent role.
- `ContentAdmin`: content and approval operations.
- `TourOperator`: tour and route operations.
- `AnalyticsViewer`: dashboard/analytics access only where allowed.

## POI Lifecycle

Canonical lifecycle values:

| State | Meaning | Primary actor | Next expected action |
| --- | --- | --- | --- |
| `PendingReview` | POI/stall was submitted or resubmitted and is waiting for admin review. | Admin | Approve or reject. |
| `Approved` | Content passed review but is not yet activated. | Admin | Request payment or activate if payment is not required. |
| `PendingPayment` | Admin requested payment and vendor/admin must complete payment handling. | Vendor/Admin | Vendor pays, admin marks paid, or admin waives payment. |
| `Active` | POI can be public if visibility rules are also satisfied. | System/Admin | Monitor validity dates and content. |
| `Expired` | POI is outside its validity window or has been expired by workflow. | Admin | Renew, restore to review, or keep hidden. |
| `Rejected` | POI did not pass review. | Vendor/Admin | Vendor revises where allowed, or admin leaves rejected. |

## POI Payment States

Canonical payment values:

| State | Meaning |
| --- | --- |
| `NotRequired` | POI activation does not require payment. |
| `PendingPayment` | Payment is required and not completed. |
| `Paid` | Payment was completed or simulated successfully. |
| `Waived` | Admin waived payment or handled it outside the simulated provider. |

Payment UI must not imply that the user can skip backend rules. The backend decides whether a POI can be paid, marked paid, waived, or activated.

## Media Workflow

1. Vendor uploads images only for their own POI.
2. Image starts as `Pending`.
3. Admin approves or rejects the image.
4. Rejected images should show a clear reason in the CMS.
5. Public web only displays approved images for POIs that are public.

Admin uploads may be auto-approved only if the backend explicitly supports that behavior.

## Narration Workflow

1. Vendor or Admin creates a narration draft for one POI and one language.
2. Vendor drafts are limited to owned POIs.
3. Admin reviews and approves or rejects the draft.
4. Admin uploads the final MP3, or uses the approved simulated generation workflow where available.
5. CMS preview uses protected CMS audio preview endpoints.
6. Public audio playback requires a valid `GuestAccessPass`.

The UI should present narration as a POI content workspace, not as an isolated technical table.

## Translation Workflow

1. POI translations are manually maintained in the CMS.
2. Simulated auto-translation can create draft translation content where available.
3. Vendor translation actions are limited to owned POIs.
4. Admin can manage translations for all POIs.
5. Public web should select the best translation for the current language and fall back gracefully.

## Guest Public Flow

1. Guest opens `web-public`.
2. Guest scans QR or chooses a listening package.
3. System creates or validates a `GuestAccessPass`.
4. Guest explores map, tour, or POI pages.
5. Guest can play protected audio only while the pass is valid and applicable to the selected POI/tour.
6. If the pass is missing, expired, forbidden, or invalid, the UI explains the next step in user language.

## Public Visibility Rule

A POI is public only if all conditions are true:

- `DeletedAt` is null.
- `LifecycleStatus = Active`.
- `IsActive = true`.
- `ValidFrom` is null or `ValidFrom <= now`.
- `ValidUntil` is null or `ValidUntil >= now`.

The current backend specification for this rule is `PoiAvailability.IsPubliclyAvailable`. The React UI should describe this rule consistently and should not display inactive or unavailable POIs as playable.
