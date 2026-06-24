# AUDIT USE CASE PHUC VU VE DIAGRAM

Tai lieu nay duoc lap tu code hien tai trong `web-admin`, `web-public` va `backend/VinhHyNarrationAPI`. Thu muc `mobile` va schema SQLite khong duoc dung lam can cu de mo rong actor/pham vi cho bo diagram web nay. Cac ten class ben duoi chi duoc ghi khi co file code tuong ung.

## 1. Danh sach UC that su co trong du an

| UC de xuat | Ten UC chuan | Actor | Nhom chuc nang | Man hinh/route | Controller | Service | Repository | Entity/Bang du lieu | Bang chung file path | Trang thai |
|---|---|---|---|---|---|---|---|---|---|---|
| UC01 | Dang nhap va duy tri phien | Nhan vien CMS (Admin, Vendor va cac vai tro duoc cap quyen) | Auth va phan quyen | `/login`, khoi phuc phien trong `AuthProvider` | `AuthController` | `AuthService`, `JwtTokenService` | `UserRepository`, `UnitOfWork`, `ApplicationDbContext` | `User`, `Role` | `web-admin/src/features/auth/pages/LoginPage.tsx`; `web-admin/src/features/auth/context/AuthContext.tsx`; `web-admin/src/features/auth/api/authApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AuthController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/AuthService.cs` | Da trien khai ro rang |
| UC02 | Dang ky tai khoan chu sap | Chu sap/Vendor chua co tai khoan | Auth va phan quyen | `/dang-ky-chu-sap` | `AuthController` | `AuthService` | `UserRepository`, `RoleRepository`, `UnitOfWork` | `User`, `Role` | `web-admin/src/features/auth/pages/VendorRegisterPage.tsx`; `web-admin/src/features/auth/api/authApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AuthController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/AuthService.cs` | Da trien khai ro rang |
| UC03 | Xem dashboard va bieu do thong ke theo vai tro | Admin, Vendor, AnalyticsViewer | CMS/Admin/Vendor | `/` | `AnalyticsController`, `PoisController`, `MediaController`, `NarrationsController`, `PoiTranslationsController` | `AnalyticsService`, `PoiService`, `MediaService`, `NarrationDraftService`, `PoiTranslationService` | `UnitOfWork`, `PoiRepository`, `MediaRepository`, `NarrationLogRepository`, `PoiTranslationRepository`, `ApplicationDbContext` | `Poi`, `Tour`, `QrLocation`, `MediaFile`, `NarrationDraft`, `NarrationLog`, `PoiTranslation` | `web-admin/src/pages/DashboardPage.tsx`; `web-admin/src/features/analytics/api/analyticsApi.ts`; `web-admin/src/features/analytics/hooks/useDashboardStatsQuery.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AnalyticsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/AnalyticsService.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Authorization/RoleGroups.cs` | Da trien khai ro rang |
| UC04 | Quan ly POI va dang ky sap | Admin, ContentAdmin, Vendor | CMS/Admin/Vendor | `/pois`, `/register-poi`, `PoiFormModal`, `PoiTable` | `PoisController` | `PoiService`, `FileUploadService`, `SoftDeleteService` | `PoiRepository`, `UserRepository`, `DeletedRecordRepository`, `ApplicationDbContext` | `Poi`, `User`, `DeletedRecord` | `web-admin/src/features/pois/pages/PoiPage.tsx`; `web-admin/src/features/pois/components/PoiFormModal.tsx`; `web-admin/src/features/pois/components/PoiTable.tsx`; `web-admin/src/features/pois/api/poisApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PoiService.cs` | Da trien khai ro rang |
| UC05 | Duyet va quyet dinh vong doi POI | Admin, ContentAdmin | CMS/Admin | `/pois`, `PoiTable` | `PoisController` | `PoiService` | `PoiRepository`, `ApplicationDbContext` | `Poi` | `web-admin/src/features/pois/components/PoiTable.tsx`; `web-admin/src/features/pois/api/poisApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PoisController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PoiService.cs` | Da trien khai ro rang |
| UC06 | Thanh toan mo phong de kich hoat sap | Vendor | CMS/Vendor | Dashboard vendor va `/register-poi` | `PoisController` | `PoiService` | `PoiRepository`, `ApplicationDbContext` | `Poi`, `PoiPaymentSession` | `web-admin/src/pages/DashboardPage.tsx`; `web-admin/src/features/pois/components/PoiTable.tsx`; `web-admin/src/features/pois/api/poisApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Domain/Entities/PoiPaymentSession.cs` | Da trien khai ro rang |
| UC07 | Quan ly ban dich POI | Admin, ContentAdmin, Vendor | CMS/Admin/Vendor | `PoiTranslationModal`, tab Ban dich trong `/media` | `PoiTranslationsController` | `PoiTranslationService`, `TranslationProviderStatusService`, `SimulatedTranslationProvider` hoac `GoogleTranslateProvider` theo cau hinh | `PoiTranslationRepository`, `PoiRepository`, `LanguageRepository`, `UnitOfWork` | `PoiTranslation`, `Poi`, `Language` | `web-admin/src/features/pois/components/PoiTranslationModal.tsx`; `web-admin/src/features/pois/api/poiTranslationsApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PoiTranslationsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PoiTranslationService.cs` | Da trien khai ro rang |
| UC08 | Gui hinh anh noi dung POI | Vendor | CMS/Vendor | `/media`, tab Hinh anh | `MediaController` | `MediaService` | `MediaRepository`, `PoiRepository`, `UnitOfWork` | `MediaFile`, `Poi`, `User` | `web-admin/src/features/media/pages/MediaLibraryPage.tsx`; `web-admin/src/features/media/api/mediaApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/MediaController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/MediaService.cs` | Da trien khai ro rang |
| UC09 | Kiem duyet va quan ly hinh anh | Admin, ContentAdmin | CMS/Admin | `/media`, tab Hinh anh | `MediaController`, `CmsMediaController` | `MediaService` | `MediaRepository`, `PoiRepository`, `UnitOfWork`, `ApplicationDbContext` | `MediaFile`, `Poi`, `User` | `web-admin/src/features/media/pages/MediaLibraryPage.tsx`; `web-admin/src/features/media/api/mediaApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/MediaController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/CmsMediaController.cs` | Da trien khai ro rang |
| UC10 | Soan va gui ban thuyet minh | Vendor | CMS/Vendor | `/media`, tab Ban thuyet minh | `NarrationsController` | `NarrationDraftService` | `ApplicationDbContext` | `NarrationDraft`, `Poi`, `User`, `Language` | `web-admin/src/features/media/pages/MediaLibraryPage.tsx`; `web-admin/src/features/narrations/api/narrationsApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/NarrationsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/NarrationDraftService.cs` | Da trien khai ro rang |
| UC11 | Kiem duyet ban thuyet minh | Admin, ContentAdmin | CMS/Admin | `/media`, tab Ban thuyet minh | `NarrationsController` | `NarrationDraftService` | `ApplicationDbContext` | `NarrationDraft`, `User` | `web-admin/src/features/media/pages/MediaLibraryPage.tsx`; `web-admin/src/features/narrations/api/narrationsApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/NarrationsController.cs` | Da trien khai ro rang |
| UC12 | Dich thuyet minh va gan MP3 | Admin, SuperAdmin | CMS/Admin | `/media`, tab Ban thuyet minh va Am thanh | `NarrationsController`, `CmsAudioPreviewController` | `NarrationDraftService` | `ApplicationDbContext`, `AudioTrackRepository` (doc/preview qua `UnitOfWork`) | `NarrationDraft`, `AudioTrack`, `Language`, `Poi` | `web-admin/src/features/media/pages/MediaLibraryPage.tsx`; `web-admin/src/features/narrations/api/narrationsApi.ts`; `web-admin/src/features/audio/api/cmsAudioPreviewApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/NarrationDraftService.cs` | Da trien khai ro rang |
| UC13 | Quan ly tour, ban dich va thu tu diem dung | Admin, ContentAdmin | CMS/Admin | `/tours`, `/tours/new`, `/tours/:tourId/edit` | `ToursController` | `TourService`, `SoftDeleteService` | `TourRepository`, `TourTranslationRepository`, `TourPoiRepository`, `PoiRepository`, `DeletedRecordRepository`, `UnitOfWork` | `Tour`, `TourTranslation`, `TourPoi`, `Poi`, `DeletedRecord` | `web-admin/src/features/tours/pages/TourListPage.tsx`; `web-admin/src/features/tours/pages/TourEditPage.tsx`; `web-admin/src/features/tours/api/tourApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/TourService.cs` | Da trien khai ro rang |
| UC14 | Quan ly ma QR gan POI/Tour | Admin, ContentAdmin | CMS/Admin | `/qr`, `/qr/create`, `/qr/:id/edit` | `QrController` | `QrService`, `SoftDeleteService` | `QrRepository`, `PoiRepository`, `TourRepository`, `DeletedRecordRepository`, `UnitOfWork` | `QrLocation`, `Poi`, `Tour`, `DeletedRecord` | `web-admin/src/features/qr/pages/QrListPage.tsx`; `web-admin/src/features/qr/components/QrForm.tsx`; `web-admin/src/features/qr/api/qrApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/QrService.cs` | Da trien khai ro rang |
| UC15 | Quan ly ngon ngu | Admin, SuperAdmin | CMS/Admin | `/languages` | `LanguagesController` | `LanguageService` | `LanguageRepository`, `UnitOfWork` | `Language` | `web-admin/src/features/languages/pages/LanguagePage.tsx`; `web-admin/src/features/languages/api/languagesApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/LanguageService.cs` | Da trien khai ro rang |
| UC16 | Quan ly nguoi dung | Admin, SuperAdmin | CMS/Admin | `/users` | `UsersController` | `UserService` | `UserRepository`, `RoleRepository`, `UnitOfWork` | `User`, `Role` | `web-admin/src/features/users/pages/UsersPage.tsx`; `web-admin/src/features/users/api/usersApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/UserService.cs` | Da trien khai ro rang |
| UC17 | Quan ly vai tro | Admin, SuperAdmin | CMS/Admin | `/roles` | `RolesController` | `RoleService` | `RoleRepository`, `UnitOfWork` | `Role`, `User` | `web-admin/src/features/roles/pages/RolesPage.tsx`; `web-admin/src/features/roles/api/rolesApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/RoleService.cs` | Da trien khai ro rang |
| UC18 | Kham pha va tim kiem POI cong khai | Khach tham quan | Web Public | `/`, `/dia-diem`, `/dia-diem/:id`, `/tim-kiem` | `PublicPoisController`, `PublicMediaController` | `PublicPoiService` | `PoiRepository`, `PoiTranslationRepository`, `MediaRepository`, `UnitOfWork`, `ApplicationDbContext` | `Poi`, `PoiTranslation`, `MediaFile` | `web-public/src/features/pois/PoisPage.tsx`; `web-public/src/features/pois/PoiDetailPage.tsx`; `web-public/src/features/search/SearchPage.tsx`; `web-public/src/api/poisApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicPoisController.cs` | Da trien khai ro rang |
| UC19 | Xem tour va thu tu lo trinh | Khach tham quan | Web Public | `/tours`, `/tours/:id`, `/tours/:id/route` | `PublicToursController` | `TourService`, `PublicPoiService` | `TourRepository`, `TourTranslationRepository`, `TourPoiRepository`, `PoiRepository`, `MediaRepository`, `UnitOfWork` | `Tour`, `TourTranslation`, `TourPoi`, `Poi`, `MediaFile` | `web-public/src/features/tours/ToursPage.tsx`; `web-public/src/features/tours/TourDetailPage.tsx`; `web-public/src/features/tours/TourRoutePage.tsx`; `web-public/src/api/toursApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicToursController.cs` | Da trien khai ro rang |
| UC20 | Xem ban do va chi duong | Khach tham quan | Web Public | `/ban-do` | `PublicPoisController`, `PublicToursController` | `PublicPoiService`, `TourService` | `PoiRepository`, `TourRepository`, `TourPoiRepository`, `UnitOfWork` | `Poi`, `Tour`, `TourPoi` | `web-public/src/features/map/MapPage.tsx`; `web-public/src/api/poisApi.ts`; `web-public/src/api/toursApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicPoisController.cs` | Co mot phan |
| UC21 | Quet QR va mo quyen truy cap | Khach tham quan | Web Public | `/qr/:code` | `PublicAccessController`, `QrController` | `PublicAccessService`, `QrService` | `QrRepository`, `GuestAccessPassRepository`, `AccessPaymentSessionRepository`, `PoiRepository`, `UnitOfWork` | `QrLocation`, `GuestAccessPass`, `AccessPaymentSession`, `Poi`, `Tour` | `web-public/src/features/qr/QrLandingPage.tsx`; `web-public/src/api/qrApi.ts`; `web-public/src/api/publicAccessApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PublicAccessService.cs` | Da trien khai ro rang |
| UC22 | Chon va mua goi thuyet minh mo phong | Khach tham quan | Web Public | `/goi-thuyet-minh` | `PublicPackagesController`, `PublicAccessController` | `QrService`, `PublicAccessService` | `QrRepository`, `GuestAccessPassRepository`, `AccessPaymentSessionRepository`, `UnitOfWork` | `QrLocation`, `GuestAccessPass`, `AccessPaymentSession` | `web-public/src/features/packages/PackagesPage.tsx`; `web-public/src/api/publicPackagesApi.ts`; `web-public/src/api/publicAccessApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicPackagesController.cs` | Da trien khai ro rang |
| UC23 | Nghe thuyet minh va audio duoc bao ve | Khach tham quan co access pass | Web Public | `/dia-diem/:id`, `/tours/:id/route`, `/ban-do` | `PublicAudioTourController`, `PublicAudioController` | `PublicAudioTourService`, `PublicAccessService` | `GuestAccessPassRepository`, `AudioTrackRepository`, `PoiRepository`, `TourRepository`, `TourPoiRepository`, `UnitOfWork` | `GuestAccessPass`, `AudioTrack`, `Poi`, `Tour`, `TourPoi`, `NarrationDraft` | `web-public/src/features/audio/ProtectedAudioPlayer.tsx`; `web-public/src/api/publicAudioTourApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicAudioController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PublicAudioTourService.cs` | Da trien khai ro rang |
| X01 | Dong bo du lieu offline qua API | APIClient da xac thuc | API/offline/log | Khong co route web-admin/web-public | `SyncController` | `SyncService` | `PoiRepository`, `PoiTranslationRepository`, `AudioTrackRepository`, `TourRepository`, `QrRepository`, `OfflinePackageRepository`, `DeletedRecordRepository`, `NarrationLogRepository`, `SyncRepository`, `UnitOfWork` | `SyncHistory`, `DeletedRecord`, `NarrationLog` va cac bang noi dung | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/SyncController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/SyncService.cs` | Can xac nhan |
| X02 | Quan ly goi offline qua API | APIClient/Nhan vien noi dung | API/offline/log | Khong co route web-admin/web-public | `OfflinePackagesController` | `OfflinePackageService` | `OfflinePackageRepository`, `TourRepository`, `UnitOfWork` | `OfflinePackage`, `Tour` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/OfflinePackagesController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/OfflinePackageService.cs` | Can xac nhan |
| X03 | Dang ky va theo doi thiet bi qua API | APIClient/Nhan vien van hanh | API/offline/log | Khong co route web-admin/web-public | `AuthController`, `DevicesController` | `AuthService`, `DeviceService` | `DeviceRepository`, `UnitOfWork` | `Device`, `User` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/DevicesController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/DeviceService.cs` | Can xac nhan |
| X04 | Ghi va tra cuu log phat thuyet minh qua API | APIClient, TourOperator | API/offline/log | Khong co route web-admin/web-public | `NarrationLogsController` | `NarrationLogService` | `NarrationLogRepository`, `PoiRepository`, `UnitOfWork` | `NarrationLog`, `Poi`, `Device`, `User` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/NarrationLogsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/NarrationLogService.cs` | Can xac nhan |
| X05 | Cau hinh geofence qua API | APIClient/Nhan vien noi dung | API/offline/log | Khong co route web-admin/web-public; cac truong cung co trong form POI | `GeofenceController` | `GeofenceConfigService` | `PoiRepository`, `UnitOfWork` | `Poi` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/GeofenceController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/GeofenceConfigService.cs` | Can xac nhan |
| X06 | Quan ly AudioTrack truc tiep qua API | APIClient | API backend | Khong co route/caller trong hai web | `AudioController` | `AudioService`, `SoftDeleteService` | `AudioTrackRepository`, `PoiRepository`, `DeletedRecordRepository`, `UnitOfWork` | `AudioTrack`, `Poi`, `DeletedRecord` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AudioController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/AudioService.cs` | Khong nen ve |
| X07 | Xem ho so va dang xuat | Nguoi dung CMS | `/profile`, menu dang xuat | Khong co | Khong co | Khong co; chi dung session trong trinh duyet | Khong ghi database | `web-admin/src/pages/ProfilePage.tsx`; `web-admin/src/features/auth/context/AuthContext.tsx` | Khong nen ve |
| X08 | Doc audit log | Admin | Khong co route/page | Khong co controller | `AuditService`, `AuditLogWriter` | `AuditLogRepository`, `UnitOfWork` | `AuditLog` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/AuditService.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Repositories/AuditLogRepository.cs` | Khong nen ve |

Ghi chu cho UC20: danh sach POI/tour co chuoi backend day du. Phan chi duong lai duoc `MapPage.tsx` goi truc tiep den OpenRouteService theo cau hinh frontend, khong di qua controller/service/repository cua backend. Vi vay diagram chi bieu dien phan du lieu noi bo va ghi chu phan tinh tuyen o Presentation Layer; khong duoc bia them `MapController` hay `MapService`.

## 2. Cac UC bi du, khong nen ve

| Ten UC bi du | Ly do khong nen ve | Da kiem tra o dau | Ghi chu |
|---|---|---|---|
| Ban do nhiet / Heatmap | Khong co heatmap layer, API tinh mat do, controller, service hay entity heatmap. | `web-admin/src/pages/DashboardPage.tsx`; `web-public/src/features/map/MapPage.tsx`; toan bo thu muc Controllers/Services/Entities backend | Ban do marker va duong di khong phai heatmap. |
| Notification / push notification | Khong co `NotificationController`, `NotificationService`, notification entity hay page nghiep vu. | `web-admin/src`; `web-public/src`; `backend/VinhHyNarrationAPI/src` | Toast UI va truong `Device.PushToken` khong tao thanh workflow thong bao. |
| Duyet vendor rieng | Dang ky vendor tao ngay `User` active voi role Vendor; khong co trang thai ho so hay endpoint approve/reject vendor. | `VendorRegisterPage.tsx`; `AuthController.cs`; `AuthService.cs`; `User.cs` | Quan ly user khong dong nghia quy trinh duyet vendor. |
| Business registration / giay phep kinh doanh | Khong co entity, DTO, controller, service, repository hay form tuong ung. | Routes va features web-admin; Controllers/Services/Entities backend | `ownerName` va `storeName` co trong request frontend nhung backend khong luu thanh ho so kinh doanh. |
| Gio hang, don hang, e-commerce checkout | Khong co cart/order/product module. Chi co hai loai payment session mo phong phuc vu kich hoat POI va cap access pass. | `PoiPaymentSession.cs`; `AccessPaymentSession.cs`; `PoisController.cs`; `PublicAccessController.cs` | Khong chuyen payment session thanh thuong mai dien tu. |
| Phan tich xu huong/du bao nang cao | Dashboard da co bieu do xu huong 30 ngay va ti le nguon truy cap, nhung khong co forecast, ranking xu huong hay service du bao. | `DashboardPage.tsx`; `analyticsApi.ts`; `AnalyticsController.cs`; `AnalyticsService.cs` | Chi ve trong UC03 dashboard thong ke; khong tach thanh UC du bao nang cao. |
| Tao TTS noi bo | Endpoint `generate-audio` co ton tai nhung service chu dong tra loi khong ho tro va UI khong goi endpoint nay. | `NarrationDraftService.cs` ham `GenerateAudioAsync`; `narrationsApi.ts`; `MediaLibraryPage.tsx` | UC dung la tai MP3 tu cong cu ben ngoai, khong ve he thong tu sinh audio. |

Mobile native va SQLite khong nam trong bang tren vi code cua chung co ton tai, nhung bi loai khoi bo diagram nay do pham vi lan chay dau chi la web-admin, web-public va backend. Chung khong duoc dung lam participant hay database trong cac file sequence.

## 3. Cac UC con thieu

Bang nay doi chieu voi cach gom UC cu trong `docs/DIAGRAM_CONTEXT_FOR_CHATGPT.md`; moi dong deu co code that.

| UC thieu | Ly do nen bo sung | Bang chung trong code | Actor | Goi y nhom |
|---|---|---|---|---|
| Duy tri phien bang refresh token | Frontend tu dong refresh khi access token het han va backend luu/doi refresh token. | `web-admin/src/features/auth/context/AuthContext.tsx`; `web-admin/src/api/httpClient.ts`; `AuthController.cs`; `AuthService.cs`; `User.RefreshToken` | Nguoi dung CMS | Auth va phan quyen; gop UC01 |
| Duyet vong doi POI | Trang POI co cac transition `PendingReview -> Approved -> PendingPayment/Rejected -> Active`; day khong chi la CRUD POI. | `PoiTable.tsx`; `PoisController.cs`; `PoiService.cs` | Admin/ContentAdmin | CMS/Admin; UC05 |
| Vendor thanh toan kich hoat POI | Co bang `PoiPaymentSession`, session 15 phut va kiem tra dung owner. | `DashboardPage.tsx`; `PoisController.cs`; `PoiService.cs`; `PoiPaymentSession.cs` | Vendor | CMS/Vendor; UC06 |
| Gui anh cho duyet | Vendor upload chi duoc anh, phai dung POI cua minh va anh vao trang thai Pending. | `MediaLibraryPage.tsx`; `MediaController.cs`; `MediaService.cs` | Vendor | CMS/Vendor; UC08 |
| Kiem duyet anh | Admin co approve/reject, ly do tu choi, delete/restore; khac actor va ket qua voi upload. | `MediaLibraryPage.tsx`; `MediaController.cs`; `MediaService.cs` | Admin/ContentAdmin | CMS/Admin; UC09 |
| Soan va gui ban thuyet minh | Vendor co form tao draft rieng va draft vao trang thai Pending. | `MediaLibraryPage.tsx`; `NarrationsController.cs`; `NarrationDraftService.cs` | Vendor | CMS/Vendor; UC10 |
| Kiem duyet ban thuyet minh | Admin duyet/tu choi voi ly do; chi draft duoc duyet moi gan MP3. | `MediaLibraryPage.tsx`; `NarrationsController.cs`; `NarrationDraftService.cs` | Admin/ContentAdmin | CMS/Admin; UC11 |
| Dich thuyet minh va tai MP3 | Admin co luong sinh cac narration da dich va upload MP3 hop le vao `AudioTrack`; he thong khong tu tao TTS. | `MediaLibraryPage.tsx`; `NarrationDraftService.cs`; `AudioTrack.cs` | Admin/SuperAdmin | CMS/Admin; UC12 |
| Mua goi thuyet minh mo phong | Trang Packages khong chi xem; no tao pass, mo payment session mo phong, luu token va xac thuc lai token. | `PackagesPage.tsx`; `publicAccessApi.ts`; `PublicAccessService.cs` | Khach tham quan | Web Public; UC22 |
| Nghe audio duoc bao ve | Metadata va file audio deu kiem tra token, scope POI/tour va thoi han. | `ProtectedAudioPlayer.tsx`; `PublicAudioTourController.cs`; `PublicAudioController.cs`; `PublicAccessService.cs` | Khach co pass | Web Public; UC23 |
| Soft delete va khoi phuc | POI/media co UI khoi phuc; tour/QR ghi tombstone khi xoa. Day la luong phu can phan anh trong UC quan ly tuong ung. | `PoiTable.tsx`; `mediaApi.ts`; `SoftDeleteService.cs`; `ApplicationDbContext.cs` | Admin | Gop UC04, UC09, UC13, UC14 |

## 4. UC nen gop hoac tach

| UC hien tai | De xuat gop/tach | Ly do | Ket qua UC chuan |
|---|---|---|---|
| Dang nhap; Refresh token | Gop | Refresh xay ra tu dong trong cung muc tieu duy tri phien CMS. | UC01 - Dang nhap va duy tri phien |
| Tao/Sua/Xoa/Tim POI | Gop | Cung `PoiPage`, `PoisController`, `PoiService`; xoa la soft delete va restore tren cung bang. | UC04 - Quan ly POI va dang ky sap |
| Quan ly POI; Duyet POI; Thanh toan POI | Tach | Ba muc tieu va hai actor khac nhau; trang thai lifecycle/payment co rang buoc rieng. | UC04, UC05, UC06 |
| Quan ly thu vien media anh/audio | Tach | Anh vendor gui va anh admin duyet co actor, quyen, trang thai va ket qua khac nhau; audio that duoc tao qua narration chứ khong qua media upload cua vendor. | UC08, UC09, UC12 |
| Quan ly ban thuyet minh/duyet/tao audio | Tach | Draft cua vendor, quyet dinh cua admin va hoan thien audio la ba checkpoint nghiep vu. | UC10, UC11, UC12 |
| Tao/Sua/Xoa Tour; Ban dich tour; Gan va sap xep POI | Gop | Tat ca nam trong man hinh sua tour va duoc `TourService` xu ly trong mot aggregate tour. | UC13 - Quan ly tour, ban dich va thu tu diem dung |
| Quet QR; Thanh toan mo phong; Tao access pass | Gop | `QrLandingPage` va `PublicAccessService` van hanh nhu mot luong lien tuc de mo quyen. | UC21 - Quet QR va mo quyen truy cap |
| Quet QR/mo quyen; Nghe audio | Tach | Access pass la ket qua cua UC21, con nghe audio co the bat dau tu POI, tour hoac map va co kiem tra scope rieng. | UC21 va UC23 |
| Xem goi thuyet minh | Doi ten va mo rong dung code | Trang thuc hien ca start access, payment mo phong, luu va validate pass. | UC22 - Chon va mua goi thuyet minh mo phong |
| Xem POI; Tim kiem POI; Xem chi tiet POI | Gop | Cung public endpoint/filter va cung muc tieu kham pha POI. | UC18 - Kham pha va tim kiem POI cong khai |
| Xem tour; Xem chi tiet; Xem thu tu diem dung | Gop | Cung du lieu public tour; audio bao ve da tach UC23. | UC19 - Xem tour va thu tu lo trinh |
| Offline package; Sync; Device; Narration log | Chua gop vao UC web | Co backend that nhung khong co caller trong web-admin/web-public. Gop tuy tien se lam mo actor va pham vi. | X01-X05 - Can xac nhan truoc khi ve |

## 5. Danh sach UC chuan cuoi cung

### Auth va phan quyen

#### UC01 - Dang nhap va duy tri phien

Actor: Nhan vien CMS (Admin, Vendor va vai tro duoc cap quyen)  
Nhom: Auth va phan quyen  
Muc tieu: Xac thuc, nhan token, khoi phuc va tu dong lam moi phien dang nhap.  
Man hinh chinh: `web-admin/src/features/auth/pages/LoginPage.tsx`, `AuthProvider`.  
Controller: `AuthController`.  
Service: `AuthService`, `JwtTokenService`.  
Repository: `UserRepository`, `UnitOfWork`, `ApplicationDbContext`.  
Entity/Bang du lieu: `User`, `Role`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co chuoi UI -> API -> service -> repository -> database va refresh token la luong phu that.

#### UC02 - Dang ky tai khoan chu sap

Actor: Chu sap/Vendor chua co tai khoan  
Nhom: Auth va phan quyen  
Muc tieu: Tao tai khoan active mang role Vendor.  
Man hinh chinh: `/dang-ky-chu-sap`, `VendorRegisterPage`.  
Controller: `AuthController`.  
Service: `AuthService`.  
Repository: `UserRepository`, `RoleRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `User`, `Role`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co form, endpoint register va rang buoc trung username/email, role Vendor.

### CMS/Admin/Vendor

#### UC03 - Xem dashboard va bieu do thong ke theo vai tro

Actor: Admin, Vendor, AnalyticsViewer  
Nhom: CMS/Admin/Vendor  
Muc tieu: Xem tong quan, bieu do 30 ngay, ti le nguon truy cap va co cau van hanh/noi dung dung voi vai tro hien tai.  
Man hinh chinh: `/`, `DashboardPage`.  
Controller: `AnalyticsController`, `PoisController`, `MediaController`, `NarrationsController`, `PoiTranslationsController`.  
Service: `AnalyticsService`, `PoiService`, `MediaService`, `NarrationDraftService`, `PoiTranslationService`.  
Repository: `UnitOfWork`, `PoiRepository`, `MediaRepository`, `NarrationLogRepository`, `PoiTranslationRepository`, `ApplicationDbContext`.  
Entity/Bang du lieu: `Poi`, `Tour`, `QrLocation`, `MediaFile`, `NarrationDraft`, `NarrationLog`, `PoiTranslation`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Dashboard co nhanh hien thi va tap API khac nhau theo role; Admin xem thong ke toan he thong, Vendor duoc xem bieu do nhung service tu gioi han theo POI/sap thuoc tai khoan Vendor.

#### UC04 - Quan ly POI va dang ky sap

Actor: Admin, ContentAdmin, Vendor  
Nhom: CMS/Admin/Vendor  
Muc tieu: Tra cuu, tao, cap nhat POI/sap; admin co the soft delete/khoi phuc.  
Man hinh chinh: `/pois`, `/register-poi`, `PoiFormModal`, `PoiTable`.  
Controller: `PoisController`.  
Service: `PoiService`, `FileUploadService`, `SoftDeleteService`.  
Repository: `PoiRepository`, `UserRepository`, `DeletedRecordRepository`, `ApplicationDbContext`.  
Entity/Bang du lieu: `Poi`, `User`, `DeletedRecord`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: CRUD va soft delete dung cung man hinh/lop; vendor duoc gioi han owner va khi sua noi dung nhay cam thi quay ve cho duyet.

#### UC05 - Duyet va quyet dinh vong doi POI

Actor: Admin, ContentAdmin  
Nhom: CMS/Admin  
Muc tieu: Duyet, tu choi, yeu cau thanh toan, danh dau da thanh toan hoac mien phi de kich hoat POI.  
Man hinh chinh: `/pois`, `PoiTable`.  
Controller: `PoisController`.  
Service: `PoiService`.  
Repository: `PoiRepository`, `ApplicationDbContext`.  
Entity/Bang du lieu: `Poi`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co state machine va endpoint rieng, khong the coi la mot nut sua POI thong thuong.

#### UC06 - Thanh toan mo phong de kich hoat sap

Actor: Vendor  
Nhom: CMS/Vendor  
Muc tieu: Tao payment session mo phong va kich hoat POI cua chinh vendor sau khi thanh toan thanh cong.  
Man hinh chinh: Dashboard vendor, `/register-poi`.  
Controller: `PoisController`.  
Service: `PoiService`.  
Repository: `PoiRepository`, `ApplicationDbContext`.  
Entity/Bang du lieu: `Poi`, `PoiPaymentSession`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: La luong payment rieng voi actor, session va bang khac guest payment.

#### UC07 - Quan ly ban dich POI

Actor: Admin, ContentAdmin, Vendor  
Nhom: CMS/Admin/Vendor  
Muc tieu: Doc, tao, sua, xoa va sinh ban dich cho POI duoc phep quan ly.  
Man hinh chinh: `PoiTranslationModal`, tab Ban dich trong `/media`.  
Controller: `PoiTranslationsController`.  
Service: `PoiTranslationService`, `TranslationProviderStatusService`, provider dich theo cau hinh.  
Repository: `PoiTranslationRepository`, `PoiRepository`, `LanguageRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `PoiTranslation`, `Poi`, `Language`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co UI va chuoi nghiep vu day du, gom ca kiem tra ownership va ngon ngu active.

#### UC08 - Gui hinh anh noi dung POI

Actor: Vendor  
Nhom: CMS/Vendor  
Muc tieu: Tai anh cho POI cua minh va dua anh vao trang thai cho duyet.  
Man hinh chinh: `/media`, tab Hinh anh.  
Controller: `MediaController`.  
Service: `MediaService`.  
Repository: `MediaRepository`, `PoiRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `MediaFile`, `Poi`, `User`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Vendor bi gioi han image-only, owner POI va ket qua Pending.

#### UC09 - Kiem duyet va quan ly hinh anh

Actor: Admin, ContentAdmin  
Nhom: CMS/Admin  
Muc tieu: Duyet/tu choi anh, xem anh bao ve, xoa va khoi phuc media.  
Man hinh chinh: `/media`, tab Hinh anh.  
Controller: `MediaController`, `CmsMediaController`.  
Service: `MediaService`.  
Repository: `MediaRepository`, `PoiRepository`, `UnitOfWork`, `ApplicationDbContext`.  
Entity/Bang du lieu: `MediaFile`, `Poi`, `User`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Actor va transition approve/reject khac UC08.

#### UC10 - Soan va gui ban thuyet minh

Actor: Vendor  
Nhom: CMS/Vendor  
Muc tieu: Tao narration draft cho POI cua vendor de cho admin duyet.  
Man hinh chinh: `/media`, tab Ban thuyet minh.  
Controller: `NarrationsController`.  
Service: `NarrationDraftService`.  
Repository: `ApplicationDbContext`.  
Entity/Bang du lieu: `NarrationDraft`, `Poi`, `User`, `Language`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co form va rang buoc owner/unique POI-language, ket qua Pending.

#### UC11 - Kiem duyet ban thuyet minh

Actor: Admin, ContentAdmin  
Nhom: CMS/Admin  
Muc tieu: Duyet hoac tu choi narration draft va luu nguoi/thoi diem review.  
Man hinh chinh: `/media`, tab Ban thuyet minh.  
Controller: `NarrationsController`.  
Service: `NarrationDraftService`.  
Repository: `ApplicationDbContext`.  
Entity/Bang du lieu: `NarrationDraft`, `User`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: La checkpoint bat buoc truoc khi gan MP3.

#### UC12 - Dich thuyet minh va gan MP3

Actor: Admin, SuperAdmin  
Nhom: CMS/Admin  
Muc tieu: Tao cac narration da dich tu draft da duyet va tai MP3 hop le vao AudioTrack.  
Man hinh chinh: `/media`, tab Ban thuyet minh va Am thanh.  
Controller: `NarrationsController`, `CmsAudioPreviewController`.  
Service: `NarrationDraftService`.  
Repository: `ApplicationDbContext`, `AudioTrackRepository` cho preview.  
Entity/Bang du lieu: `NarrationDraft`, `AudioTrack`, `Language`, `Poi`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: UI thuc hien dich va upload; `GenerateAudioAsync` khong tao TTS nen khong ve TTS noi bo.

#### UC13 - Quan ly tour, ban dich va thu tu diem dung

Actor: Admin, ContentAdmin  
Nhom: CMS/Admin  
Muc tieu: CRUD tour, quan ly ban dich, gan/bo POI va sap xep thu tu.  
Man hinh chinh: `/tours`, `/tours/new`, `/tours/:tourId/edit`.  
Controller: `ToursController`.  
Service: `TourService`, `SoftDeleteService`.  
Repository: `TourRepository`, `TourTranslationRepository`, `TourPoiRepository`, `PoiRepository`, `DeletedRecordRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `Tour`, `TourTranslation`, `TourPoi`, `Poi`, `DeletedRecord`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Cac thao tac la mot aggregate quan ly tour tren cung man hinh.

#### UC14 - Quan ly ma QR gan POI/Tour

Actor: Admin, ContentAdmin  
Nhom: CMS/Admin  
Muc tieu: CRUD ma QR, chon target POI/Tour va cau hinh payment/access duration.  
Man hinh chinh: `/qr`, `/qr/create`, `/qr/:id/edit`.  
Controller: `QrController`.  
Service: `QrService`, `SoftDeleteService`.  
Repository: `QrRepository`, `PoiRepository`, `TourRepository`, `DeletedRecordRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `QrLocation`, `Poi`, `Tour`, `DeletedRecord`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: UI va backend cung kiem tra target, gia va thoi luong truy cap.

#### UC15 - Quan ly ngon ngu

Actor: Admin, SuperAdmin  
Nhom: CMS/Admin  
Muc tieu: Xem, tao, sua, xoa/bat tat ngon ngu duoc ho tro.  
Man hinh chinh: `/languages`.  
Controller: `LanguagesController`.  
Service: `LanguageService`.  
Repository: `LanguageRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `Language`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co CRUD day du va danh sach ma ngon ngu duoc phep.

#### UC16 - Quan ly nguoi dung

Actor: Admin, SuperAdmin  
Nhom: CMS/Admin  
Muc tieu: Xem, tao, cap nhat role/trang thai/mat khau va xoa user.  
Man hinh chinh: `/users`.  
Controller: `UsersController`.  
Service: `UserService`.  
Repository: `UserRepository`, `RoleRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `User`, `Role`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co page, modal va CRUD admin-only day du.

#### UC17 - Quan ly vai tro

Actor: Admin, SuperAdmin  
Nhom: CMS/Admin  
Muc tieu: Xem, tao, sua va xoa role.  
Man hinh chinh: `/roles`.  
Controller: `RolesController`.  
Service: `RoleService`.  
Repository: `RoleRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `Role`, `User`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Co UI va CRUD backend; phan gan role cho user nam trong UC16.

### Web Public/Khach tham quan

#### UC18 - Kham pha va tim kiem POI cong khai

Actor: Khach tham quan  
Nhom: Web Public  
Muc tieu: Xem danh sach, loc/tim kiem va xem chi tiet POI dang duoc phep cong khai.  
Man hinh chinh: `/`, `/dia-diem`, `/dia-diem/:id`, `/tim-kiem`.  
Controller: `PublicPoisController`, `PublicMediaController`.  
Service: `PublicPoiService`.  
Repository: `PoiRepository`, `PoiTranslationRepository`, `MediaRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `Poi`, `PoiTranslation`, `MediaFile`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Public service loc lifecycle/expiry va chon ban dich/anh approved.

#### UC19 - Xem tour va thu tu lo trinh

Actor: Khach tham quan  
Nhom: Web Public  
Muc tieu: Xem tour active, chi tiet va thu tu cac diem dung.  
Man hinh chinh: `/tours`, `/tours/:id`, `/tours/:id/route`.  
Controller: `PublicToursController`.  
Service: `TourService`, `PublicPoiService`.  
Repository: `TourRepository`, `TourTranslationRepository`, `TourPoiRepository`, `PoiRepository`, `MediaRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `Tour`, `TourTranslation`, `TourPoi`, `Poi`, `MediaFile`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Tour public va route order co day du; phat audio tach sang UC23.

#### UC20 - Xem ban do va chi duong

Actor: Khach tham quan  
Nhom: Web Public  
Muc tieu: Xem marker POI/tour, vi tri hien tai va yeu cau tuyen duong.  
Man hinh chinh: `/ban-do`.  
Controller: `PublicPoisController`, `PublicToursController`.  
Service: `PublicPoiService`, `TourService`.  
Repository: `PoiRepository`, `TourRepository`, `TourPoiRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `Poi`, `Tour`, `TourPoi`.  
Trang thai: Co mot phan.  
Ly do chon UC nay: Man hinh co that; phan noi bo co 3 lop day du, con chi duong goi OpenRouteService truc tiep tu frontend va phu thuoc cau hinh/runtime ngoai backend.

#### UC21 - Quet QR va mo quyen truy cap

Actor: Khach tham quan  
Nhom: Web Public  
Muc tieu: Dung QR active de tao guest pass; neu can thi thanh toan mo phong va nhan access token.  
Man hinh chinh: `/qr/:code`, `QrLandingPage`, `PaymentRequiredPanel`.  
Controller: `PublicAccessController`, `QrController`.  
Service: `PublicAccessService`, `QrService`.  
Repository: `QrRepository`, `GuestAccessPassRepository`, `AccessPaymentSessionRepository`, `PoiRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `QrLocation`, `GuestAccessPass`, `AccessPaymentSession`, `Poi`, `Tour`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: QR, payment session va pass la mot transaction flow lien tuc tren QrLanding.

#### UC22 - Chon va mua goi thuyet minh mo phong

Actor: Khach tham quan  
Nhom: Web Public  
Muc tieu: Xem cac QR package cap service-level access, mo payment mo phong va luu pass.  
Man hinh chinh: `/goi-thuyet-minh`, `PackagesPage`.  
Controller: `PublicPackagesController`, `PublicAccessController`.  
Service: `QrService`, `PublicAccessService`.  
Repository: `QrRepository`, `GuestAccessPassRepository`, `AccessPaymentSessionRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `QrLocation`, `GuestAccessPass`, `AccessPaymentSession`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Trang packages thuc hien mua mo phong, khong chi hien thi gia.

#### UC23 - Nghe thuyet minh va audio duoc bao ve

Actor: Khach tham quan co guest access pass  
Nhom: Web Public  
Muc tieu: Doc narration/audio theo POI/tour va stream MP3 khi token con han va dung scope.  
Man hinh chinh: `/dia-diem/:id`, `/tours/:id/route`, `/ban-do`, `ProtectedAudioPlayer`.  
Controller: `PublicAudioTourController`, `PublicAudioController`.  
Service: `PublicAudioTourService`, `PublicAccessService`.  
Repository: `GuestAccessPassRepository`, `AudioTrackRepository`, `PoiRepository`, `TourRepository`, `TourPoiRepository`, `UnitOfWork`.  
Entity/Bang du lieu: `GuestAccessPass`, `AudioTrack`, `Poi`, `Tour`, `TourPoi`, `NarrationDraft`.  
Trang thai: Da trien khai ro rang.  
Ly do chon UC nay: Ca metadata va file stream deu kiem tra token/scope/expiry; day la nghiep vu bao ve noi dung doc lap voi viec mua pass.

### API/offline/log can xac nhan

X01-X05 co code backend thuc, nhung chua duoc dua vao danh sach UC chuan cuoi cung cua lan chay dau vi khong tim thay caller/page trong hai web duoc chi dinh. Neu chu du an xac nhan APIClient la actor nam trong bo diagram, cac UC nay nen duoc danh so va ve sequence o lan bo sung. Khong su dung `MobileApp`, SQLite hay ten database cu the de lap cho khoang trong hien tai.
