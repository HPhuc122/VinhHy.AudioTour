# VinhHy Audio Tour Manual Test Checklist

Use this checklist for demo readiness and regression testing after the Phase 1-7 UX redesign work. Record the test account, browser, viewport, and date for each run.

## 1. Admin Login

- [ ] Open `web-admin`.
- [ ] Log in with an Admin account.
- [ ] Confirm the sidebar shows Admin groups: Tổng quan, Địa điểm & sạp, Nội dung, Tour & bản đồ, Gói nghe & QR, Hệ thống, Hồ sơ.
- [ ] Confirm dashboard cards load without raw API errors.
- [ ] Log out and confirm the user returns to login.

## 2. Vendor Registration / Login

- [ ] Open the vendor registration page.
- [ ] Submit an empty form and confirm Vietnamese validation is readable.
- [ ] Register a new Vendor / Chủ sạp account.
- [ ] Log in as Vendor.
- [ ] Confirm Vendor only sees Vendor menu items: Tổng quan, Sạp của tôi, Đăng ký địa điểm/sạp, Thư viện, Thanh toán, Hồ sơ.
- [ ] Confirm Admin-only menus are hidden.

## 3. Vendor POI Registration

- [ ] As Vendor, open Đăng ký địa điểm/sạp.
- [ ] Complete each wizard section: thông tin cơ bản, vị trí, hình ảnh đăng ký, xác nhận gửi duyệt.
- [ ] Submit the registration.
- [ ] Confirm the next action shows Chờ duyệt.
- [ ] Confirm Vendor cannot set lifecycle status, public active status, owner, or payment admin fields.

## 4. Admin POI Approval

- [ ] As Admin, open Địa điểm & sạp > Chờ duyệt.
- [ ] Open the POI detail drawer.
- [ ] Confirm lifecycle/payment/public visibility are clearly shown.
- [ ] Approve the POI.
- [ ] Confirm the POI moves from Chờ duyệt to Đã duyệt.
- [ ] Reject another test POI if available and confirm the status shows Bị từ chối.

## 5. Admin Request Payment

- [ ] Open an Approved POI that requires payment.
- [ ] Confirm payment is not automatically requested on approve.
- [ ] Use Request payment / Yêu cầu thanh toán if available.
- [ ] Confirm lifecycle/payment state becomes Chờ thanh toán.
- [ ] Confirm Vendor dashboard shows the payment next action.

## 6. Vendor Payment

- [ ] Log in as Vendor for a POI in PendingPayment / Chờ thanh toán.
- [ ] Open Vendor dashboard or Thanh toán.
- [ ] Start the existing payment flow.
- [ ] Confirm successful payment activates the POI only through the existing backend rules.
- [ ] Confirm Vendor cannot mark paid/waived manually unless the current backend explicitly allows it.

## 7. Active POI Public Visibility

- [ ] Confirm an active POI has: not deleted, LifecycleStatus = Active, IsActive = true, valid date window.
- [ ] Open `web-public`.
- [ ] Confirm the POI appears in Địa điểm and Bản đồ.
- [ ] Temporarily test a non-active/rejected/expired POI in seed data if available and confirm it does not appear publicly.

## 8. Vendor Image Upload

- [ ] As Vendor, open Thư viện > Hình ảnh.
- [ ] Select the Vendor-owned POI.
- [ ] Upload an image.
- [ ] Confirm the image appears as Chờ duyệt.
- [ ] Confirm Vendor cannot upload for another Vendor's POI.

## 9. Admin Image Approval

- [ ] As Admin, open Nội dung > Thư viện ảnh.
- [ ] Select the POI with pending images.
- [ ] Preview the image through the CMS authenticated image flow.
- [ ] Approve the image.
- [ ] Confirm approved image appears publicly only after POI is public/active.
- [ ] Reject another image if available and confirm the reason/status is visible.

## 10. Vendor Narration Creation

- [ ] As Vendor, open Thư viện > Bản thuyết minh.
- [ ] Select own POI.
- [ ] Create a narration draft for a language.
- [ ] Confirm duplicate POI + language errors are readable.
- [ ] Confirm the draft appears as Chờ duyệt.

## 11. Admin Narration Approval

- [ ] As Admin, open Nội dung > Bản thuyết minh.
- [ ] Select the POI.
- [ ] Review the narration text.
- [ ] Approve or reject the draft.
- [ ] Confirm status labels show Đã duyệt or Bị từ chối.

## 12. Admin MP3 Upload

- [ ] As Admin, open Nội dung > Âm thanh.
- [ ] Select a POI with approved narration.
- [ ] Upload an MP3 for the approved language.
- [ ] Preview audio through the CMS protected preview endpoint.
- [ ] Confirm no raw `/uploads/audio/...` link is exposed in UI.

## 13. Public QR / Package Unlock

- [ ] Open `web-public`.
- [ ] Open Gói nghe / Quét QR.
- [ ] Choose an active package or scan/open a QR route.
- [ ] Complete the existing simulated payment or free unlock flow.
- [ ] Confirm the UI shows Quyền nghe / Mã nghe and remaining time.

## 14. Public POI Detail Audio Playback

- [ ] Open a public active POI detail page without a mã nghe.
- [ ] Confirm audio is locked with a clear CTA to choose package/scan QR.
- [ ] Unlock with a valid mã nghe.
- [ ] Play audio through `GET /api/v1/public/audio/{audioTrackId}`.
- [ ] Confirm expired/invalid access shows a friendly Vietnamese message.

## 15. Public Map And Tour Flow

- [ ] Open Bản đồ on desktop and mobile viewport.
- [ ] Select a POI and confirm the bottom/detail panel does not overflow.
- [ ] Allow browser location and confirm distance appears if available.
- [ ] Open Tour, select a tour, then open lộ trình từng bước.
- [ ] Confirm stops are ordered and audio stays locked/unlocked according to mã nghe status.

## 16. Translation Manual / Simulated Generate Flow

- [ ] As Vendor, select own POI and create/update translations.
- [ ] Confirm Vendor cannot edit another Vendor's POI translations.
- [ ] As Admin, select any POI and create/update translations.
- [ ] Run simulated auto translation.
- [ ] Confirm UI clearly labels it as Dịch mô phỏng / chưa kết nối dịch vụ dịch thật.

## 17. Expired / Missing Access Pass Audio Error

- [ ] Remove local stored access or use an expired mã nghe.
- [ ] Open POI detail, map selected POI, and tour route audio areas.
- [ ] Confirm each area says the mã nghe is missing or expired.
- [ ] Confirm the CTA returns to package/QR unlock.
- [ ] Confirm no raw audio path appears in the browser UI.

## Security Regression Checks

- [ ] Request `/uploads/audio/...` directly and confirm it is blocked.
- [ ] Request `/uploads/images/...` directly and confirm it is blocked.
- [ ] Request `/uploads/pois/...` directly and confirm it is blocked.
- [ ] Confirm CMS images use authenticated `SecureImage` / blob loading.
- [ ] Confirm public images use approved public media endpoints.
- [ ] Confirm public audio uses `GET /api/v1/public/audio/{audioTrackId}`.
- [ ] Confirm JWT tokens are not placed in image URLs.
- [ ] Confirm no real secret keys are committed.
