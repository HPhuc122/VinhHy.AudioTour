# Use Case Diagram Index

Bo Use Case Diagram nay ve theo style mau trong `abc.docx`: moi diagram co 1 actor chinh nam ngoai system boundary, use case la oval trang vien den, quan he `<<include>>` va `<<extend>>` dung net dut.

## Cum Admin

| File | Use case chinh |
|---|---|
| [ADMIN_01_dashboard_thong_ke_usecase.puml](ADMIN_01_dashboard_thong_ke_usecase.puml) | UC03, UC01 |
| [ADMIN_02_quan_ly_poi_va_duyet_usecase.puml](ADMIN_02_quan_ly_poi_va_duyet_usecase.puml) | UC04, UC05, UC07 |
| [ADMIN_03_media_audio_thuyet_minh_usecase.puml](ADMIN_03_media_audio_thuyet_minh_usecase.puml) | UC09, UC11, UC12 |
| [ADMIN_04_quan_ly_tour_va_qr_usecase.puml](ADMIN_04_quan_ly_tour_va_qr_usecase.puml) | UC13, UC14 |
| [ADMIN_05_quan_tri_he_thong_usecase.puml](ADMIN_05_quan_tri_he_thong_usecase.puml) | UC15, UC16, UC17 |

## Cum Vendor

| File | Use case chinh |
|---|---|
| [VENDOR_01_tai_khoan_dashboard_usecase.puml](VENDOR_01_tai_khoan_dashboard_usecase.puml) | UC01, UC02, UC03 |
| [VENDOR_02_quan_ly_sap_va_thanh_toan_usecase.puml](VENDOR_02_quan_ly_sap_va_thanh_toan_usecase.puml) | UC04, UC06 |
| [VENDOR_03_quan_ly_noi_dung_dia_diem_usecase.puml](VENDOR_03_quan_ly_noi_dung_dia_diem_usecase.puml) | UC07, UC08, UC10 |

## Cum Visitor

| File | Use case chinh |
|---|---|
| [VISITOR_01_kham_pha_tour_ban_do_usecase.puml](VISITOR_01_kham_pha_tour_ban_do_usecase.puml) | UC18, UC19, UC20 |
| [VISITOR_02_qr_goi_nghe_audio_usecase.puml](VISITOR_02_qr_goi_nghe_audio_usecase.puml) | UC21, UC22, UC23 |

## Ghi chu

- Khong ve 1 diagram tong quat duy nhat.
- Khong ve 23 file nho rieng cho tung UC.
- Moi file la mot so do use case theo actor va nhom chuc nang.
- Cac UC dung chung nhu UC01, UC03, UC04, UC07 duoc xuat hien trong cum actor tuong ung de the hien dung goc nhin actor.
- UC20 dang o trang thai co mot phan: tinh duong di nam o UI/dich vu ban do ben ngoai, khong co backend MapController rieng.
