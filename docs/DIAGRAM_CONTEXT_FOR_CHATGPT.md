# DIAGRAM_CONTEXT_FOR_CHATGPT

Tai lieu nay dung de lam can cu ve Activity Diagram va Sequence Diagram cho du an VinhHy Audio Tour. Noi dung duoc tong hop tu code hien tai, khong them use case neu khong thay man hinh, controller hoac service tuong ung.

Pham vi da doc:
- `web-admin`: routes, pages, features, API clients, hooks va components lien quan.
- `web-public`: routes, pages, public API clients va components lien quan.
- `backend/VinhHyNarrationAPI`: Controllers, Services, Repositories, DbContext, Entities/Models.
- Co thay thu muc `mobile`, nhung tai lieu nay uu tien web-admin, web-public va backend theo yeu cau. Neu ve rieng mobile thi can tao tai lieu rieng.

## Bang chuc nang that su co trong du an

| UC | Ten chuc nang | Actor su dung | Man hinh lien quan | Controller lien quan | Service lien quan | Repository lien quan | Entity / bang du lieu lien quan | Bang chung file path | Trang thai |
|---|---|---|---|---|---|---|---|---|---|
| UC01 | Dang nhap CMS/Admin | Admin / Vendor | `web-admin/src/features/auth/pages/LoginPage.tsx`, `web-admin/src/features/auth/components/LoginForm.tsx` | `AuthController` | `AuthService`, `JwtTokenService` | `UserRepository`, `RoleRepository`, `UnitOfWork` | `User`, `Role` | `web-admin/src/features/auth/api/authApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AuthController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/AuthService.cs` | Da trien khai |
| UC02 | Dang ky tai khoan Vendor | Vendor | `web-admin/src/features/auth/pages/VendorRegisterPage.tsx`, route `/dang-ky-chu-sap` | `AuthController` | `AuthService` | `UserRepository`, `RoleRepository`, `UnitOfWork` | `User`, `Role` | `web-admin/src/routes/AppRoutes.tsx`; `web-admin/src/features/auth/api/authApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AuthController.cs` | Da trien khai |
| UC03 | Xem dashboard quan tri / vendor | Admin / Vendor | `web-admin/src/pages/DashboardPage.tsx` | `AnalyticsController`, `PoisController`, `MediaController`, `NarrationsController`, `PoiTranslationsController` | `AnalyticsService`, `PoiService`, `MediaService`, `NarrationDraftService`, `PoiTranslationService` | `AnalyticsRepository`, `PoiRepository`, `MediaRepository`, `PoiTranslationRepository`, `UnitOfWork` | `AnalyticsDaily`, `Poi`, `MediaFile`, `NarrationDraft`, `PoiTranslation` | `web-admin/src/pages/DashboardPage.tsx`; `web-admin/src/features/analytics/api/analyticsApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AnalyticsController.cs` | Da trien khai |
| UC04 | Quan ly POI / dang ky sap | Admin / Vendor | `web-admin/src/features/pois/pages/PoiPage.tsx`, `PoiFormModal.tsx`, `PoiTable.tsx`, routes `/pois`, `/register-poi` | `PoisController` | `PoiService`, `FileUploadService`, `SoftDeleteService` | `PoiRepository`, `UserRepository`, `DeletedRecordRepository`, `UnitOfWork` | `Poi`, `User`, `DeletedRecord`, `PoiPaymentSession` | `web-admin/src/features/pois/api/poisApi.ts`; `web-admin/src/features/pois/components/PoiFormModal.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PoisController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PoiService.cs` | Da trien khai |
| UC05 | Duyet / tu choi / yeu cau thanh toan POI | Admin | `web-admin/src/features/pois/components/PoiTable.tsx`, `web-admin/src/pages/DashboardPage.tsx` | `PoisController` | `PoiService` | `PoiRepository`, `UnitOfWork` | `Poi`, `PoiPaymentSession` | `web-admin/src/features/pois/api/poisApi.ts`; `web-admin/src/features/pois/components/PoiTable.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PoisController.cs` | Da trien khai |
| UC06 | Vendor thanh toan POI bang MoMo mo phong | Vendor | `web-admin/src/pages/DashboardPage.tsx`, `PoiTable.tsx` | `PoisController` | `PoiService` | `PoiRepository`, `UnitOfWork` | `Poi`, `PoiPaymentSession` | `web-admin/src/features/pois/api/poisApi.ts`; `web-admin/src/pages/DashboardPage.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PoisController.cs` | Da trien khai |
| UC07 | Quan ly ban dich POI va sinh ban dich | Admin / Vendor | `web-admin/src/features/pois/components/PoiTranslationModal.tsx` | `PoiTranslationsController` | `PoiTranslationService`, `TranslationProviderStatusService`, `SimulatedTranslationProvider` hoac `RealApiTranslationProvider` | `PoiTranslationRepository`, `PoiRepository`, `LanguageRepository`, `UnitOfWork` | `PoiTranslation`, `Poi`, `Language` | `web-admin/src/features/pois/api/poiTranslationsApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PoiTranslationsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PoiTranslationService.cs` | Da trien khai |
| UC08 | Quan ly thu vien media anh/audio | Admin / Vendor | `web-admin/src/features/media/pages/MediaLibraryPage.tsx` | `MediaController`, `CmsMediaController` | `MediaService`, `FileUploadService`, `SoftDeleteService` | `MediaRepository`, `PoiRepository`, `DeletedRecordRepository`, `UnitOfWork` | `MediaFile`, `Poi`, `DeletedRecord` | `web-admin/src/features/media/api/mediaApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/MediaController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/CmsMediaController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/MediaService.cs` | Da trien khai |
| UC09 | Quan ly ban thuyet minh / duyet / tao audio | Admin / Vendor | `web-admin/src/features/media/pages/MediaLibraryPage.tsx`, `web-admin/src/features/narrations/*` | `NarrationsController`, `CmsAudioPreviewController` | `NarrationDraftService`, `AudioService`, `FileUploadService` | `MediaRepository`, `AudioTrackRepository`, `PoiRepository`, `UnitOfWork` | `NarrationDraft`, `AudioTrack`, `Poi`, `MediaFile` | `web-admin/src/features/narrations/api/narrationsApi.ts`; `web-admin/src/features/audio/components/CmsAudioPreviewPlayer.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/NarrationsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/NarrationDraftService.cs` | Da trien khai |
| UC10 | Quan ly tour, ban dich tour va thu tu POI trong tour | Admin | `web-admin/src/features/tours/pages/TourListPage.tsx`, `TourCreatePage.tsx`, `TourEditPage.tsx`, `TourForm.tsx`, `TourTranslationsSection.tsx`, `TourRouteOrderSection.tsx` | `ToursController` | `TourService`, `SoftDeleteService` | `TourRepository`, `TourTranslationRepository`, `TourPoiRepository`, `PoiRepository`, `DeletedRecordRepository`, `UnitOfWork` | `Tour`, `TourTranslation`, `TourPoi`, `Poi`, `DeletedRecord` | `web-admin/src/features/tours/api/tourApi.ts`; `web-admin/src/features/tours/components/TourRouteOrderSection.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/ToursController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/TourService.cs` | Da trien khai |
| UC11 | Quan ly ma QR gan POI/Tour | Admin | `web-admin/src/features/qr/pages/QrListPage.tsx`, `QrCreatePage.tsx`, `QrEditPage.tsx` | `QrController` | `QrService`, `SoftDeleteService` | `QrRepository`, `PoiRepository`, `TourRepository`, `DeletedRecordRepository`, `UnitOfWork` | `QrLocation`, `Poi`, `Tour`, `DeletedRecord` | `web-admin/src/features/qr/api/qrApi.ts`; `web-admin/src/features/qr/pages/QrListPage.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/QrController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/QrService.cs` | Da trien khai |
| UC12 | Quan ly ngon ngu | Admin | `web-admin/src/features/languages/pages/LanguagePage.tsx` | `LanguagesController` | `LanguageService` | `LanguageRepository`, `UnitOfWork` | `Language` | `web-admin/src/features/languages/api/languagesApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/LanguagesController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/LanguageService.cs` | Da trien khai |
| UC13 | Quan ly nguoi dung | Admin | `web-admin/src/features/users/pages/UsersPage.tsx`, `UserFormModal.tsx` | `UsersController` | `UserService` | `UserRepository`, `RoleRepository`, `UnitOfWork` | `User`, `Role` | `web-admin/src/features/users/api/usersApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/UsersController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/UserService.cs` | Da trien khai |
| UC14 | Quan ly vai tro | Admin | `web-admin/src/features/roles/pages/RolesPage.tsx`, `RoleFormModal.tsx` | `RolesController` | `RoleService` | `RoleRepository`, `UnitOfWork` | `Role` | `web-admin/src/features/roles/api/rolesApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/RolesController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/RoleService.cs` | Da trien khai |
| UC15 | Guest xem danh sach, tim kiem, chi tiet POI | Guest | `web-public/src/features/pois/PoisPage.tsx`, `PoiDetailPage.tsx`, `SearchPage.tsx`, `HomePage.tsx` | `PublicPoisController`, `PublicMediaController` | `PublicPoiService` | `PoiRepository`, `MediaRepository`, `UnitOfWork` | `Poi`, `PoiTranslation`, `MediaFile`, `AudioTrack` | `web-public/src/api/poisApi.ts`; `web-public/src/features/search/SearchPage.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicPoisController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/PublicPoiService.cs` | Da trien khai |
| UC16 | Guest xem tour va lo trinh tour | Guest | `web-public/src/features/tours/ToursPage.tsx`, `TourDetailPage.tsx`, `TourRoutePage.tsx` | `PublicToursController`, `PublicAudioTourController` | `TourService`, `PublicAudioTourService`, `PublicAccessService` | `TourRepository`, `TourTranslationRepository`, `TourPoiRepository`, `PoiRepository`, `GuestAccessPassRepository`, `UnitOfWork` | `Tour`, `TourTranslation`, `TourPoi`, `Poi`, `GuestAccessPass` | `web-public/src/api/toursApi.ts`; `web-public/src/api/publicAudioTourApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicToursController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicAudioTourController.cs` | Da trien khai |
| UC17 | Guest xem ban do POI / tour | Guest | `web-public/src/features/map/MapPage.tsx` | `PublicPoisController`, `PublicToursController`, `PublicAudioTourController` | `PublicPoiService`, `TourService`, `PublicAudioTourService` | `PoiRepository`, `TourRepository`, `TourPoiRepository`, `UnitOfWork` | `Poi`, `Tour`, `TourPoi`, `AudioTrack` | `web-public/src/features/map/MapPage.tsx`; `web-public/src/api/poisApi.ts`; `web-public/src/api/toursApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicPoisController.cs` | Da trien khai |
| UC18 | Guest quet QR, mo quyen truy cap, thanh toan mo phong va nghe audio bao ve | Guest | `web-public/src/features/qr/QrLandingPage.tsx`, `ProtectedAudioPlayer.tsx`, `AccessRequiredPanel.tsx`, `PaymentRequiredPanel.tsx`, `AccessExpiredPanel.tsx` | `QrController`, `PublicAccessController`, `PublicAudioTourController`, `PublicAudioController` | `QrService`, `PublicAccessService`, `PublicAudioTourService` | `QrRepository`, `GuestAccessPassRepository`, `AccessPaymentSessionRepository`, `AudioTrackRepository`, `PoiRepository`, `TourRepository`, `UnitOfWork` | `QrLocation`, `GuestAccessPass`, `AccessPaymentSession`, `AudioTrack`, `Poi`, `Tour` | `web-public/src/api/qrApi.ts`; `web-public/src/api/publicAccessApi.ts`; `web-public/src/api/publicAudioTourApi.ts`; `web-public/src/features/qr/QrLandingPage.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicAccessController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicAudioController.cs` | Da trien khai |
| UC19 | Guest xem goi thuyet minh cong khai | Guest | `web-public/src/features/packages/PackagesPage.tsx` | `PublicPackagesController`, `PublicAccessController` | `QrService`, `PublicAccessService` | `QrRepository`, `AccessPaymentSessionRepository`, `GuestAccessPassRepository`, `UnitOfWork` | `QrLocation`, `AccessPaymentSession`, `GuestAccessPass` | `web-public/src/api/publicPackagesApi.ts`; `web-public/src/features/packages/PackagesPage.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/PublicPackagesController.cs` | Da trien khai |
| UC20 | Dong bo du lieu / goi offline qua API | Guest | Chua thay man hinh web-admin/web-public; co controller API va code mobile rieng | `SyncController`, `OfflinePackagesController` | `SyncService`, `OfflinePackageService` | `SyncRepository`, `OfflinePackageRepository`, `DeletedRecordRepository`, `LanguageRepository`, `PoiRepository`, `TourRepository`, `AudioTrackRepository`, `UnitOfWork` | `SyncHistory`, `OfflinePackage`, `DeletedRecord`, `Language`, `Poi`, `Tour`, `AudioTrack` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/SyncController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/OfflinePackagesController.cs`; `mobile/src/VinhHy.AudioTour.Mobile/Services/SyncOrchestratorService.cs` | Co mot phan |
| UC21 | Ghi log phat thuyet minh | Guest / Admin | Chua thay man hinh web-admin/web-public rieng; co API va dashboard co tong audio plays | `NarrationLogsController`, `AnalyticsController` | `NarrationLogService`, `AnalyticsService` | `NarrationLogRepository`, `AnalyticsRepository`, `UnitOfWork` | `NarrationLog`, `AnalyticsDaily` | `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/NarrationLogsController.cs`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/Services/NarrationLogService.cs`; `web-admin/src/features/analytics/api/analyticsApi.ts` | Co mot phan |

## Chuc nang khong nen ve neu khong co them bang chung code

| Chuc nang khong nen ve | Ly do khong nen ve | Bang chung da kiem tra | Ghi chu |
|---|---|---|---|
| Phan tich xu huong POI nang cao | Co dashboard tong quan va analytics API, nhung chua thay man hinh bieu do xu huong POI rieng, forecast, ranking xu huong hoac bo loc xu huong. | `web-admin/src/pages/DashboardPage.tsx`; `web-admin/src/features/analytics/api/analyticsApi.ts`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AnalyticsController.cs` | Neu ve, chi nen ve UC03 dashboard tong quan, khong ve trend analysis nang cao. |
| Thong ke dang ky kinh doanh | Khong thay entity, controller, service hay page nao quan ly giay phep/ho so dang ky kinh doanh. | Da doc routes `web-admin/src/routes/AppRoutes.tsx`, controllers backend va entities domain. | Khong nen ve. |
| Ban do nhiet | Co ban do POI bang Leaflet, nhung khong thay heatmap layer, heatmap API, service tinh mat do. | `web-admin/src/pages/DashboardPage.tsx`; `web-public/src/features/map/MapPage.tsx` | Chi ve ban do POI/lo trinh, khong ve heatmap. |
| Duyet vendor | Co dang ky vendor, nhung chua thay man hinh/controller/service duyet vendor rieng. | `web-admin/src/features/auth/pages/VendorRegisterPage.tsx`; `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Controllers/AuthController.cs`; `web-admin/src/features/users/pages/UsersPage.tsx` | Co the admin quan ly user, nhung khong nen bieu dien quy trinh approve vendor neu khong xac nhan them. |
| Notification / thong bao he thong | Khong thay NotificationController, NotificationService, Notification entity hoac UI notification domain. | Da doc danh sach controllers/services/entities; chi co toast UI noi bo frontend. | Toast frontend khong phai module notification. |
| Mobile native trong bo diagram web | Trong repo co code mobile, nhung yeu cau hien tai tap trung web-admin/web-public/backend. | `mobile/src/VinhHy.AudioTour.Mobile/*`; `web-public/src/routes/AppRouter.tsx` | Can xac nhan neu muon ve rieng mobile. Khong dung `MobileApp` cho sequence cua web-public. |
| SQLite mobile trong bo diagram web | Co schema SQLite mobile trong repo, nhung khong nen dua vao diagram web-admin/web-public. | `docs/database/sqlite/mobile_offline_schema.sql`; `mobile/src/VinhHy.AudioTour.Mobile.Data/Database/LocalDatabase.cs` | Chi ve khi pham vi diagram la mobile/offline sync. |
| Quan ly thong bao day / push notification | Khong thay push notification controller/service/model. | Da doc controllers, services, entities backend. | Khong nen ve. |
| Ban hang / gio hang / don hang | Chi thay access/payment session mo phong cho QR/POI, khong thay cart/order module. | `PublicAccessController.cs`, `PoisController.cs`, entities `AccessPaymentSession`, `PoiPaymentSession`. | Khong bien thanh e-commerce flow. |

## Quy uoc participant cho Sequence Diagram

Tat ca sequence diagram chi duoc dung 3 actor cua he thong: `Admin`, `Vendor`, `Guest`. Khong tao actor khac nhu `User`, `Khach`, `Nhan vien CMS`, `ContentAdmin`, `SuperAdmin`, `APIClient` hay `MobileApp` trong bo sequence web.

Participant phai la thanh phan that co the truy vet trong source code:
- Web-admin: page/component/API client that, controller, service, repository, `UnitOfWork` khi co ghi, va entity domain.
- Web-public: page/component/API client that, `Public...Controller` hoac `QrController`, service/repository that, va entity domain.
- Khong dung participant gom lop nhu `Presentation Layer`, `Business Logic Layer`, `Data Access Layer`.
- Khong dung participant `Database`; sequence dung o entity domain nhu `User`, `Role`, `Poi`, `MediaFile`, `NarrationDraft`, `AudioTrack`, `Tour`, `TourTranslation`, `TourPoi`, `QrLocation`, `GuestAccessPass`, `AccessPaymentSession`, `Language`, `NarrationLog`.
- Mui ten phai ghi method/API handler chinh xac, vi du `AuthController.Login()`, `AuthService.LoginAsync()`, `UserRepository.GetByUsernameAsync()`, `PoisController.Create()`, `PoiService.CreateAsync()`, `PoiRepository.AddAsync()`.
## Luong nghiep vu de xuat

### UC01 - Dang nhap CMS/Admin
Luong chinh:
1. Nguoi dung mo man hinh dang nhap CMS.
2. Nguoi dung nhap email/ten dang nhap va mat khau.
3. He thong gui thong tin dang nhap len API.
4. API kiem tra tai khoan, vai tro va tao token neu hop le.
5. Giao dien luu phien dang nhap va chuyen nguoi dung vao dashboard.

Luong loi neu co:
- Thieu email hoac mat khau.
- Sai thong tin dang nhap.
- Tai khoan khong co vai tro phu hop.
- Token het han thi frontend goi refresh token.

### UC02 - Dang ky tai khoan Vendor
Luong chinh:
1. Vendor mo man hinh dang ky chu sap.
2. Vendor nhap thong tin tai khoan.
3. He thong gui thong tin dang ky len API.
4. API kiem tra du lieu va tao user co vai tro vendor.
5. Giao dien thong bao dang ky thanh cong hoac yeu cau dang nhap.

Luong loi neu co:
- Thieu du lieu bat buoc.
- Email/username da ton tai.
- Du lieu khong hop le.

### UC03 - Xem dashboard quan tri / vendor
Luong chinh:
1. Nguoi dung dang nhap va mo dashboard.
2. Giao dien xac dinh vai tro Admin, Vendor hoac AnalyticsViewer.
3. He thong tai cac so lieu dashboard phu hop voi vai tro.
4. Neu la Admin, giao dien tai them danh sach POI de hien thi ban do.
5. Giao dien hien thi the thong ke, ban do POI va cac hanh dong nhanh.

Luong loi neu co:
- Khong co quyen xem analytics.
- API thong ke tra loi loi.
- Khong tai duoc POI tren ban do.

### UC04 - Quan ly POI / dang ky sap
Luong chinh:
1. Admin hoac Vendor mo man hinh POI.
2. Nguoi dung nhap thong tin POI/sap, toa do, hinh anh va cau hinh lien quan.
3. He thong kiem tra du lieu va gui len API.
4. API luu moi hoac cap nhat POI, xu ly file upload neu co.
5. Giao dien tai lai danh sach va hien thi POI vua thay doi.

Luong loi neu co:
- Thieu ten, toa do hoac du lieu bat buoc.
- File khong hop le.
- Khong co quyen tao/sua.
- Khong tim thay POI khi sua.

### UC05 - Duyet / tu choi / yeu cau thanh toan POI
Luong chinh:
1. Admin mo danh sach POI cho duyet.
2. Admin chon hanh dong duyet, tu choi, yeu cau thanh toan, danh dau da thanh toan hoac mien thanh toan.
3. He thong gui hanh dong len API theo POI duoc chon.
4. API cap nhat trang thai vong doi va trang thai thanh toan cua POI.
5. Giao dien cap nhat lai danh sach va so lieu dashboard.

Luong loi neu co:
- Khong tim thay POI.
- Trang thai hien tai khong phu hop voi hanh dong.
- Khong co quyen content management.

### UC06 - Vendor thanh toan POI bang MoMo mo phong
Luong chinh:
1. Vendor mo dashboard hoac danh sach POI cua minh.
2. Vendor chon POI dang cho thanh toan.
3. He thong tao phien thanh toan cho POI.
4. He thong goi API mo phong thanh toan MoMo thanh cong.
5. API cap nhat POI sang trang thai da thanh toan/hoat dong va giao dien hien thi ket qua.

Luong loi neu co:
- POI khong o trang thai cho thanh toan.
- Khong co quyen thanh toan POI do.
- Phien thanh toan khong hop le hoac het han.

### UC07 - Quan ly ban dich POI va sinh ban dich
Luong chinh:
1. Admin hoac Vendor mo modal ban dich cua POI.
2. He thong tai danh sach ban dich va danh sach ngon ngu.
3. Nguoi dung tao, sua, xoa hoac yeu cau sinh ban dich tu dong.
4. API luu ban dich hoac goi provider dich mo phong/thuc.
5. Giao dien cap nhat danh sach ban dich cua POI.

Luong loi neu co:
- POI khong ton tai.
- Ma ngon ngu khong hop le.
- Provider dich chua cau hinh.
- Du lieu ban dich thieu tieu de/noi dung.

### UC08 - Quan ly thu vien media anh/audio
Luong chinh:
1. Admin hoac Vendor mo thu vien media.
2. Nguoi dung loc, tim kiem hoac tai len file anh/audio.
3. He thong gui file va thong tin POI lien quan len API.
4. API luu file, tao ban ghi media va gan trang thai duyet.
5. Admin co the duyet, tu choi, xoa mem hoac khoi phuc media.

Luong loi neu co:
- File khong hop le hoac qua lon.
- POI lien quan khong ton tai.
- Khong co quyen duyet/xoa/khoi phuc.
- Khong tim thay media.

### UC09 - Quan ly ban thuyet minh / duyet / tao audio
Luong chinh:
1. Vendor tao ban thuyet minh cho POI hoac Admin mo danh sach ban thuyet minh.
2. Nguoi dung nhap tieu de, ngon ngu, noi dung va giong doc.
3. API luu ban nhap thuyet minh.
4. Admin duyet, tu choi, tao audio mo phong hoac upload file audio.
5. Giao dien hien thi trang thai ban thuyet minh va audio co the nghe thu.

Luong loi neu co:
- Thieu POI, tieu de, ngon ngu hoac noi dung.
- Khong co quyen duyet/tao audio/upload audio.
- File audio khong hop le.
- Khong tim thay ban thuyet minh.

### UC10 - Quan ly tour, ban dich tour va thu tu POI trong tour
Luong chinh:
1. Admin mo danh sach tour.
2. Admin tao/sua tour, them ban dich tour.
3. Admin gan POI vao tour va sap xep thu tu tham quan.
4. API luu tour, ban dich va danh sach POI theo thu tu.
5. Giao dien hien thi tour da cap nhat.

Luong loi neu co:
- Thieu ngon ngu mac dinh hoac du lieu tour.
- Tour hoac POI khong ton tai.
- Thu tu POI khong hop le.
- Khong co quyen content management.

### UC11 - Quan ly ma QR gan POI/Tour
Luong chinh:
1. Admin mo man hinh QR.
2. Admin tao ma QR va chon gan voi POI hoac Tour.
3. Admin cau hinh trang thai hoat dong, yeu cau thanh toan, gia va thoi luong truy cap.
4. API luu ma QR.
5. Giao dien hien thi danh sach QR va cho phep sua/xoa.

Luong loi neu co:
- Khong chon POI hoac Tour hop le.
- Gia tien/thoi luong truy cap khong hop le.
- Ma QR khong ton tai khi sua/xoa.
- Khong co quyen content management.

### UC12 - Quan ly ngon ngu
Luong chinh:
1. Admin mo man hinh ngon ngu.
2. Admin them, sua, xoa ngon ngu va trang thai kich hoat.
3. He thong gui du lieu len API.
4. API luu vao bang ngon ngu.
5. Giao dien tai lai danh sach ngon ngu.

Luong loi neu co:
- Ma ngon ngu da ton tai.
- Thieu ten ngon ngu.
- Khong co quyen admin.

### UC13 - Quan ly nguoi dung
Luong chinh:
1. Admin mo man hinh nguoi dung.
2. Admin xem danh sach, tao user, sua thong tin hoac xoa user.
3. He thong gui yeu cau len API users.
4. API kiem tra vai tro va cap nhat user.
5. Giao dien hien thi danh sach moi.

Luong loi neu co:
- User khong ton tai.
- Role khong hop le.
- Email/username bi trung.
- Khong co quyen admin.

### UC14 - Quan ly vai tro
Luong chinh:
1. Admin mo man hinh vai tro.
2. Admin them, sua hoac xoa vai tro.
3. He thong gui thong tin vai tro len API.
4. API luu thay doi vao database.
5. Giao dien cap nhat danh sach vai tro.

Luong loi neu co:
- Role khong ton tai.
- Ten role bi trung hoac khong hop le.
- Khong co quyen admin.

### UC15 - Khach xem danh sach, tim kiem, chi tiet POI
Luong chinh:
1. Khach mo trang danh sach POI, trang chu hoac trang tim kiem.
2. Khach chon ngon ngu, nhap tu khoa hoac chon danh muc.
3. Web-public goi API public POI.
4. API lay cac POI duoc phep hien thi cong khai.
5. Giao dien hien thi danh sach hoac chi tiet POI.

Luong loi neu co:
- Khong tim thay POI.
- API tra loi loi.
- Du lieu POI chua du dieu kien cong khai.

### UC16 - Khach xem tour va lo trinh tour
Luong chinh:
1. Khach mo danh sach tour.
2. Khach chon mot tour de xem chi tiet.
3. He thong lay tour, ban dich va cac POI trong tour.
4. Neu xem lo trinh/audio tour bao ve, he thong kiem tra token truy cap khi can.
5. Giao dien hien thi thong tin tour va danh sach diem dung.

Luong loi neu co:
- Tour khong ton tai.
- Tour chua active.
- Chua co quyen truy cap audio tour bao ve.

### UC17 - Khach xem ban do POI / tour
Luong chinh:
1. Khach mo trang ban do.
2. He thong tai danh sach POI va/hoac tour.
3. Giao dien hien thi marker POI tren ban do.
4. Khach chon POI hoac tour de xem thong tin lien quan.
5. Neu co audio tour va token truy cap, giao dien tai noi dung audio tour.

Luong loi neu co:
- Khong tai duoc danh sach POI/tour.
- POI thieu toa do hop le.
- Chua co token truy cap khi noi dung can bao ve.

### UC18 - Khach quet QR, mo quyen truy cap, thanh toan mo phong va nghe audio bao ve
Luong chinh:
1. Khach mo link QR `/qr/:code`.
2. Web-public goi API resolve QR de biet QR gan POI hay Tour.
3. He thong kiem tra token truy cap hien co.
4. Neu can thanh toan, khach bat dau phien truy cap va thuc hien thanh toan mo phong.
5. API tao access token khach va web-public dung token de tai audio tour/audio file.
6. Giao dien hien thi noi dung va trinh phat audio.

Luong loi neu co:
- QR khong ton tai hoac khong active.
- Token truy cap het han.
- Thanh toan that bai.
- Audio khong ton tai hoac khong co quyen nghe.

### UC19 - Khach xem goi thuyet minh cong khai
Luong chinh:
1. Khach mo trang goi thuyet minh.
2. Web-public tai danh sach goi/QR cong khai.
3. Giao dien hien thi gia, thoi luong truy cap va link QR cong khai.
4. Khach co the bat dau truy cap/thanh toan tu luong public access neu co.
5. Giao dien hien thi trang thai truy cap.

Luong loi neu co:
- Khong co goi cong khai.
- Phien truy cap/thanh toan khong hop le.
- API public packages tra loi loi.

### UC20 - Dong bo du lieu / goi offline qua API
Luong chinh:
1. Client goi API sync pull de lay du lieu thay doi.
2. API lay ngon ngu, POI, tour, QR, audio, offline package va ban ghi da xoa theo cursor.
3. Client luu du lieu offline phia minh.
4. Client goi sync push de day narration log hoac thay doi duoc ho tro.
5. API ghi nhan lich su dong bo.

Luong loi neu co:
- Token khong hop le.
- Cursor khong hop le.
- Du lieu push khong hop le.
- Chua thay man hinh web cho luong nay, can xac nhan neu ve trong bo diagram web.

### UC21 - Ghi log phat thuyet minh
Luong chinh:
1. Client phat audio hoac hoan thanh mot lan nghe thuyet minh.
2. Client gui log thuyet minh len API.
3. API kiem tra du lieu log.
4. API luu log vao database.
5. Dashboard/analytics co the tong hop thanh chi so luot phat.

Luong loi neu co:
- Thieu POI/audio/user/device.
- Du lieu log khong hop le.
- Khong co quyen xem danh sach log.
- Chua thay man hinh web rieng de quan ly log, can xac nhan neu muon ve UI.

## Ket luan cho ChatGPT

Nen ve cac UC sau:
- Nhom CMS/Admin: UC01, UC03, UC04, UC05, UC07, UC08, UC09, UC10, UC11, UC12, UC13, UC14.
- Nhom Vendor: UC01, UC02, UC04, UC06, UC07, UC08, UC09.
- Nhom Web Public/Khach: UC15, UC16, UC17, UC18, UC19.
- Nhom API/offline neu can mo rong: UC20, UC21, nhung nen ghi ro la API/mobile-oriented va chua thay man hinh web rieng.

Khong nen ve cac UC sau neu khong co yeu cau bo sung:
- Phan tich xu huong POI nang cao.
- Thong ke dang ky kinh doanh.
- Ban do nhiet.
- Duyet vendor nhu mot workflow rieng.
- Notification/push notification.
- Gio hang/don hang/e-commerce.
- Mobile native hoac SQLite mobile trong bo diagram cua web-public/web-admin.

Nen gom nhom chuong muc:
- Auth va phan quyen: UC01, UC02.
- Quan tri noi dung CMS: UC03 den UC14.
- Cong khai cho khach tham quan: UC15 den UC19.
- Dong bo va log nen de phu luc/API: UC20, UC21.

Ten participant chuan cho tung nhom:
- Actor chi duoc la `Admin`, `Vendor`, `Guest`.
- Web-admin: ten page/component/API client that, `Controller`, `Service`, `Repository`, `UnitOfWork` khi co save, va entity domain.
- Web-public: ten page/component/API client that, `Public...Controller` hoac `QrController`, service/repository that su ton tai, va entity domain.
- Khong dung participant `Database`; sequence dung o entity nhu `Poi`, `Tour`, `QrLocation`, `GuestAccessPass`, `AudioTrack`.
- Mui ten phai ghi method/API handler chinh xac, vi du `PoisController.Create()`, `PoiService.CreateAsync()`, `PoiRepository.AddAsync()`.

Nhung diem can tranh de khong bia sai du an:
- Khong dung `MobileApp` khi ve sequence cho web-public; web-public la React web.
- Khong them service khong ton tai nhu `NotificationService`, `HeatmapService`, `VendorApprovalService`, `BusinessRegistrationService`.
- Khong bien thanh toan mo phong thanh tich hop MoMo that neu khong co bang chung.
- Khong ve duyet vendor rieng; code hien co la dang ky vendor va quan ly user, khong thay workflow approve vendor.
- Khong ve heatmap; code hien co la ban do marker POI/lo trinh.
- Khong ve trend analytics nang cao; dashboard hien co la tong hop chi so va ban do POI.
- Khong ve SQLite/mobile trong bo diagram web, tru khi de tai yeu cau rieng ve mobile/offline sync.
