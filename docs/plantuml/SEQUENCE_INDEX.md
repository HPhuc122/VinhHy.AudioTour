# SEQUENCE DIAGRAM INDEX

Bo sequence nay duoc sinh tu danh sach UC chuan trong [`UC_AUDIT_FOR_DIAGRAM.md`](../UC_AUDIT_FOR_DIAGRAM.md) va luong nghiep vu trong [`UC_BUSINESS_FLOWS.md`](../UC_BUSINESS_FLOWS.md). Tat ca diagram chi dung bon thanh phan: Actor, Presentation Layer, Business Logic Layer, Data Access Layer va Database. Participant database luon co nhan dung la `Database`.

## Danh sach UC da ve

| UC | Ten UC | File sequence | Trang thai |
|---|---|---|---|
| UC01 | Dang nhap va duy tri phien | [`UC01_dang_nhap_va_duy_tri_phien_sequence.puml`](sequence/UC01_dang_nhap_va_duy_tri_phien_sequence.puml) | Da trien khai ro rang |
| UC02 | Dang ky tai khoan chu sap | [`UC02_dang_ky_tai_khoan_chu_sap_sequence.puml`](sequence/UC02_dang_ky_tai_khoan_chu_sap_sequence.puml) | Da trien khai ro rang |
| UC03 | Xem dashboard va bieu do thong ke theo vai tro | [`UC03_xem_dashboard_theo_vai_tro_sequence.puml`](sequence/UC03_xem_dashboard_theo_vai_tro_sequence.puml) | Da trien khai ro rang; da cap nhat khach online, luot hom nay, grouped analytics, ban do POI/admin audio preview, thong ke AudioTrack va gioi han Vendor |
| UC04 | Quan ly POI va dang ky sap | [`UC04_quan_ly_poi_va_dang_ky_sap_sequence.puml`](sequence/UC04_quan_ly_poi_va_dang_ky_sap_sequence.puml) | Da trien khai ro rang |
| UC05 | Duyet va quyet dinh vong doi POI | [`UC05_duyet_va_quyet_dinh_vong_doi_poi_sequence.puml`](sequence/UC05_duyet_va_quyet_dinh_vong_doi_poi_sequence.puml) | Da trien khai ro rang |
| UC06 | Thanh toan mo phong de kich hoat sap | [`UC06_thanh_toan_mo_phong_de_kich_hoat_sap_sequence.puml`](sequence/UC06_thanh_toan_mo_phong_de_kich_hoat_sap_sequence.puml) | Da trien khai ro rang |
| UC07 | Quan ly ban dich POI | [`UC07_quan_ly_ban_dich_poi_sequence.puml`](sequence/UC07_quan_ly_ban_dich_poi_sequence.puml) | Da trien khai ro rang |
| UC08 | Gui hinh anh noi dung POI | [`UC08_gui_hinh_anh_noi_dung_poi_sequence.puml`](sequence/UC08_gui_hinh_anh_noi_dung_poi_sequence.puml) | Da trien khai ro rang |
| UC09 | Kiem duyet va quan ly hinh anh | [`UC09_kiem_duyet_va_quan_ly_hinh_anh_sequence.puml`](sequence/UC09_kiem_duyet_va_quan_ly_hinh_anh_sequence.puml) | Da trien khai ro rang |
| UC10 | Soan va gui ban thuyet minh | [`UC10_soan_va_gui_ban_thuyet_minh_sequence.puml`](sequence/UC10_soan_va_gui_ban_thuyet_minh_sequence.puml) | Da trien khai ro rang |
| UC11 | Kiem duyet ban thuyet minh | [`UC11_kiem_duyet_ban_thuyet_minh_sequence.puml`](sequence/UC11_kiem_duyet_ban_thuyet_minh_sequence.puml) | Da cap nhat chinh sua noi dung va kich hoat pipeline dich/TTS |
| UC12 | Dich thuyet minh va gan MP3 | [`UC12_dich_thuyet_minh_va_gan_mp3_sequence.puml`](sequence/UC12_dich_thuyet_minh_va_gan_mp3_sequence.puml) | Da cap nhat pipeline tu dong dich, tao TTS va preview audio |
| UC13 | Quan ly tour, ban dich va thu tu diem dung | [`UC13_quan_ly_tour_ban_dich_va_thu_tu_diem_dung_sequence.puml`](sequence/UC13_quan_ly_tour_ban_dich_va_thu_tu_diem_dung_sequence.puml) | Da trien khai ro rang |
| UC14 | Quan ly ma QR gan POI/Tour | [`UC14_quan_ly_ma_qr_gan_poi_tour_sequence.puml`](sequence/UC14_quan_ly_ma_qr_gan_poi_tour_sequence.puml) | Da trien khai ro rang |
| UC15 | Quan ly ngon ngu | [`UC15_quan_ly_ngon_ngu_sequence.puml`](sequence/UC15_quan_ly_ngon_ngu_sequence.puml) | Da trien khai ro rang |
| UC16 | Quan ly nguoi dung | [`UC16_quan_ly_nguoi_dung_sequence.puml`](sequence/UC16_quan_ly_nguoi_dung_sequence.puml) | Da trien khai ro rang |
| UC17 | Quan ly vai tro | [`UC17_quan_ly_vai_tro_sequence.puml`](sequence/UC17_quan_ly_vai_tro_sequence.puml) | Da trien khai ro rang |
| UC18 | Kham pha va tim kiem POI cong khai | [`UC18_kham_pha_va_tim_kiem_poi_cong_khai_sequence.puml`](sequence/UC18_kham_pha_va_tim_kiem_poi_cong_khai_sequence.puml) | Da trien khai ro rang |
| UC19 | Xem tour va thu tu lo trinh | [`UC19_xem_tour_va_thu_tu_lo_trinh_sequence.puml`](sequence/UC19_xem_tour_va_thu_tu_lo_trinh_sequence.puml) | Da trien khai ro rang |
| UC20 | Xem ban do va chi duong | [`UC20_xem_ban_do_va_chi_duong_sequence.puml`](sequence/UC20_xem_ban_do_va_chi_duong_sequence.puml) | Co mot phan |
| UC21 | Quet QR va mo quyen truy cap | [`UC21_quet_qr_va_mo_quyen_truy_cap_sequence.puml`](sequence/UC21_quet_qr_va_mo_quyen_truy_cap_sequence.puml) | Da trien khai ro rang |
| UC22 | Chon va mua goi thuyet minh mo phong | [`UC22_chon_va_mua_goi_thuyet_minh_mo_phong_sequence.puml`](sequence/UC22_chon_va_mua_goi_thuyet_minh_mo_phong_sequence.puml) | Da trien khai ro rang |
| UC23 | Nghe thuyet minh va audio duoc bao ve | [`UC23_nghe_thuyet_minh_va_audio_duoc_bao_ve_sequence.puml`](sequence/UC23_nghe_thuyet_minh_va_audio_duoc_bao_ve_sequence.puml) | Da trien khai ro rang |

## UC co mot phan / can xac nhan

- UC20 co mot phan theo kien truc bat buoc: du lieu POI/tour di qua backend 3 lop, nhung tinh tuyen duong duoc `MapPage.tsx` goi truc tiep OpenRouteService. Diagram giu dung bon participant va ghi chu thao tac ngoai backend o Presentation Layer; khong tao `MapController`, `MapService` hay repository ao.
- X01 Dong bo du lieu offline qua API: co `SyncController`/`SyncService` va repository that, nhung khong co caller trong `web-admin`/`web-public`.
- X02 Quan ly goi offline qua API: co backend CRUD, khong co man hinh web trong pham vi.
- X03 Dang ky/theo doi thiet bi qua API: co backend, khong co caller trong hai web.
- X04 Ghi/tra cuu narration log qua API: co backend, khong co UI/caller trong hai web.
- X05 Cau hinh geofence qua API: co backend, nhung web hien sua cac truong geofence ngay trong form POI va khong goi `GeofenceController`.

X01-X05 chua duoc danh so UC chuan va chua ve sequence. Can xac nhan APIClient co nam trong bo diagram mong muon hay khong; khong tu dung mobile native/SQLite de lap actor va data layer.

## UC/chuc nang khong ve va ly do

| Chuc nang | Ly do |
|---|---|
| Heatmap | Khong co layer/API/service/entity heatmap. |
| Notification/push notification | Khong co module nghiep vu; toast va `PushToken` khong du tao UC. |
| Duyet vendor | Dang ky tao Vendor active; khong co trang thai/endpoint approve-reject vendor. |
| Business registration | Khong co entity/controller/service/repository/form ho so kinh doanh. |
| Cart/order/e-commerce | Chi co payment session mo phong, khong co cart/order. |
| Tao TTS noi bo rieng le ngoai quy trinh thuyet minh | Da nam trong UC11/UC12: duyet hoac sua text se tao/cap nhat MP3 tu dong, upload MP3 chi con la thao tac thay the. |
| Phan tich xu huong/du bao nang cao | UC03 da co bieu do 30 ngay va ti le nguon truy cap; khong co forecast, ranking xu huong hay service du bao rieng. |
| Quan ly AudioTrack truc tiep | Co backend CRUD nhung khong co caller/page web; audio that da duoc bieu dien trong UC12 va UC23. |
| Xem ho so/dang xuat | Chi doc/xoa session o Presentation Layer, khong co Business/Data Access/Database de ve theo mau bat buoc. |
| Doc audit log | Co service/repository/entity nhung khong co controller/page; khong co chuoi Presentation -> Business day du. |
| Mobile native va SQLite | Code co ton tai nhung nam ngoai pham vi bo diagram web lan nay. |

## Thong ke

- UC chuan giu lai: 23.
- Sequence Diagram da tao: 23.
- UC co mot phan trong danh sach chuan: 1 (UC20).
- Ung vien can xac nhan truoc khi bo sung: 5 (X01-X05).
- Chuc nang bi loai vi khong co bang chung workflow: 7 trong muc audit chinh.
- Activity Diagram: chua tao theo dung yeu cau dung sau buoc Sequence.
