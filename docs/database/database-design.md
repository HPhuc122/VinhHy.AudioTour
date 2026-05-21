# Thiết Kế Cơ Sở Dữ Liệu — VinhHy.AudioTour

## Tổng Quan

Tài liệu này mô tả thiết kế cơ sở dữ liệu của hệ thống VinhHy.AudioTour.

Hệ thống được xây dựng theo mô hình offline-first nhằm hỗ trợ ứng dụng mobile hoạt động ổn định ngay cả khi không có kết nối internet. Dữ liệu được lưu trữ cục bộ bằng SQLite trên thiết bị di động và đồng bộ với backend server khi có mạng.

Thiết kế cơ sở dữ liệu hướng tới các mục tiêu:

* Hỗ trợ GPS Audio Tour
* Quản lý Tour và Point Of Interest (POI)
* Hỗ trợ đa ngôn ngữ
* Tối ưu đồng bộ dữ liệu
* Hỗ trợ tải offline package
* Theo dõi lịch sử narration
* Tối ưu hiệu năng trên mobile

---

# Database Schema Overview

Hệ thống sử dụng relational database schema để quản lý dữ liệu Tour, POI, Audio và synchronization.

Các nhóm bảng chính gồm:

* Tour management
* POI management
* Audio management
* Translation system
* Offline synchronization
* Narration logging
* QR navigation

---

# Danh Sách Bảng Chính

| Table            | Chức năng                   |
| ---------------- | --------------------------- |
| Tours            | Quản lý thông tin Tour      |
| TourTranslations | Nội dung Tour đa ngôn ngữ   |
| POIs             | Quản lý Point Of Interest   |
| POITranslations  | Nội dung POI đa ngôn ngữ    |
| AudioTracks      | Quản lý audio narration     |
| TourPOIs         | Liên kết Tour và POI        |
| QRLocations      | Quản lý QR trigger          |
| NarrationLogs    | Lưu lịch sử narration       |
| OfflinePackages  | Quản lý offline package     |
| SyncCursors      | Theo dõi synchronization    |
| GeofenceState    | Trạng thái geofence runtime |
| LocalSettings    | Cấu hình local application  |

---

# Thiết Kế Các Bảng

## Tours

Bảng lưu thông tin Tour.

### Các cột chính

| Column           | Type    | Mô tả                     |
| ---------------- | ------- | ------------------------- |
| Id               | INTEGER | Khóa chính                |
| Code             | TEXT    | Mã Tour duy nhất          |
| DefaultLanguage  | TEXT    | Ngôn ngữ mặc định         |
| IsActive         | INTEGER | Trạng thái hoạt động      |
| EstimatedMinutes | INTEGER | Thời lượng ước tính       |
| Version          | INTEGER | Phiên bản synchronization |
| UpdatedAt        | TEXT    | Thời gian cập nhật        |

---

## TourTranslations

Bảng lưu nội dung đa ngôn ngữ cho Tour.

### Các cột chính

| Column       | Type    | Mô tả          |
| ------------ | ------- | -------------- |
| Id           | INTEGER | Khóa chính     |
| TourId       | INTEGER | Tour liên kết  |
| LanguageCode | TEXT    | Mã ngôn ngữ    |
| Name         | TEXT    | Tên Tour       |
| Description  | TEXT    | Nội dung mô tả |

---

## POIs

Bảng quản lý Point Of Interest.

### Các cột chính

| Column       | Type    | Mô tả                     |
| ------------ | ------- | ------------------------- |
| Id           | INTEGER | Khóa chính                |
| Code         | TEXT    | Mã POI                    |
| Latitude     | REAL    | Vĩ độ GPS                 |
| Longitude    | REAL    | Kinh độ GPS               |
| RadiusMeters | REAL    | Bán kính kích hoạt        |
| Priority     | INTEGER | Độ ưu tiên                |
| Category     | TEXT    | Loại địa điểm             |
| ImageUrl     | TEXT    | Hình ảnh                  |
| IsActive     | INTEGER | Trạng thái hoạt động      |
| Version      | INTEGER | Phiên bản synchronization |
| UpdatedAt    | TEXT    | Thời gian cập nhật        |

---

## POITranslations

Bảng lưu nội dung đa ngôn ngữ cho POI.

### Các cột chính

| Column           | Type    | Mô tả          |
| ---------------- | ------- | -------------- |
| Id               | INTEGER | Khóa chính     |
| POIId            | INTEGER | POI liên kết   |
| LanguageCode     | TEXT    | Mã ngôn ngữ    |
| Name             | TEXT    | Tên địa điểm   |
| Description      | TEXT    | Nội dung mô tả |
| ShortDescription | TEXT    | Mô tả ngắn     |

---

## AudioTracks

Bảng quản lý audio narration.

### Các cột chính

| Column          | Type    | Mô tả                   |
| --------------- | ------- | ----------------------- |
| Id              | INTEGER | Khóa chính              |
| POIId           | INTEGER | POI liên kết            |
| LanguageCode    | TEXT    | Ngôn ngữ audio          |
| AudioType       | TEXT    | Loại audio              |
| FileUrl         | TEXT    | Đường dẫn file          |
| TTSText         | TEXT    | Nội dung Text To Speech |
| DurationSeconds | INTEGER | Thời lượng              |
| FileSizeBytes   | INTEGER | Kích thước file         |
| MimeType        | TEXT    | Định dạng file          |
| LocalFilePath   | TEXT    | Đường dẫn local cache   |
| IsDownloaded    | INTEGER | Trạng thái tải xuống    |

---

## TourPOIs

Bảng liên kết giữa Tour và POI.

### Các cột chính

| Column     | Type    | Mô tả            |
| ---------- | ------- | ---------------- |
| Id         | INTEGER | Khóa chính       |
| TourId     | INTEGER | Tour liên kết    |
| POIId      | INTEGER | POI liên kết     |
| OrderIndex | INTEGER | Thứ tự tham quan |

---

## QRLocations

Bảng quản lý QR trigger.

### Các cột chính

| Column   | Type    | Mô tả                |
| -------- | ------- | -------------------- |
| Id       | INTEGER | Khóa chính           |
| POIId    | INTEGER | POI liên kết         |
| QRCode   | TEXT    | Giá trị QR           |
| Label    | TEXT    | Tên hiển thị         |
| IsActive | INTEGER | Trạng thái hoạt động |

---

## NarrationLogs

Bảng lưu lịch sử narration.

### Các cột chính

| Column                | Type    | Mô tả                      |
| --------------------- | ------- | -------------------------- |
| Id                    | INTEGER | Khóa chính local           |
| ServerId              | INTEGER | ID từ server               |
| POIId                 | INTEGER | POI liên kết               |
| TriggerType           | TEXT    | Kiểu kích hoạt             |
| LanguageCode          | TEXT    | Ngôn ngữ                   |
| PlayedAt              | TEXT    | Thời gian phát             |
| DurationPlayedSeconds | INTEGER | Thời lượng đã nghe         |
| Synced                | INTEGER | Trạng thái synchronization |

---

## OfflinePackages

Bảng quản lý offline package.

### Các cột chính

| Column         | Type    | Mô tả                     |
| -------------- | ------- | ------------------------- |
| Id             | INTEGER | Khóa chính                |
| TourId         | INTEGER | Tour liên kết             |
| LanguageCode   | TEXT    | Ngôn ngữ package          |
| PackageVersion | TEXT    | Phiên bản package         |
| DownloadUrl    | TEXT    | Link tải                  |
| FileSizeBytes  | INTEGER | Kích thước package        |
| Checksum       | TEXT    | Kiểm tra toàn vẹn dữ liệu |
| IsDownloaded   | INTEGER | Trạng thái tải            |

---

## SyncCursors

Bảng theo dõi synchronization.

### Các cột chính

| Column       | Type | Mô tả                   |
| ------------ | ---- | ----------------------- |
| EntityType   | TEXT | Tên entity              |
| LastSyncedAt | TEXT | Thời gian sync gần nhất |

---

## GeofenceState

Bảng lưu trạng thái geofence runtime.

### Các cột chính

| Column          | Type    | Mô tả                         |
| --------------- | ------- | ----------------------------- |
| POIId           | INTEGER | POI liên kết                  |
| LastTriggeredAt | TEXT    | Trigger gần nhất              |
| CooldownUntil   | TEXT    | Thời gian cooldown            |
| EnteredAt       | TEXT    | Thời gian đi vào vùng         |
| IsInsideRadius  | INTEGER | Trạng thái bên trong geofence |

---

## LocalSettings

Bảng lưu cấu hình local application.

### Các cột chính

| Column    | Type | Mô tả              |
| --------- | ---- | ------------------ |
| Key       | TEXT | Tên cấu hình       |
| Value     | TEXT | Giá trị cấu hình   |
| UpdatedAt | TEXT | Thời gian cập nhật |

---

# Kiến Trúc Hệ Thống Dữ Liệu

Hệ thống sử dụng 2 tầng dữ liệu:

## 1. Server Database

Server database đóng vai trò quản lý dữ liệu trung tâm.

Chức năng:

* Quản lý nội dung Tour
* Quản lý Point Of Interest
* Lưu metadata audio
* Quản lý translation đa ngôn ngữ
* Quản lý QR location
* Xuất offline package
* Đồng bộ dữ liệu cho mobile app

## 2. Mobile SQLite Database

SQLite database trên mobile được sử dụng để:

* Lưu dữ liệu offline
* Cache audio file
* Ghi nhận narration log
* Tăng tốc truy cập dữ liệu
* Hỗ trợ hoạt động không cần internet

---

# Mô Hình Nghiệp Vụ

## Tours

Tours đại diện cho các hành trình tham quan.

Mỗi tour bao gồm:

* Danh sách POI
* Thứ tự tham quan
* Nội dung mô tả
* Audio narration
* Dữ liệu đa ngôn ngữ

Một tour có thể chứa nhiều POI.

---

## POIs (Point Of Interest)

POI là các địa điểm tham quan thực tế.

Mỗi POI bao gồm:

* Vị trí GPS
* Bán kính kích hoạt
* Nội dung mô tả
* Audio narration
* Hình ảnh minh họa
* QR trigger

POI là thành phần trung tâm của hệ thống.

---

## AudioTracks

AudioTracks quản lý audio narration cho từng POI.

Hệ thống hỗ trợ:

* Audio file upload
* Text To Speech (TTS)
* Offline audio cache
* Multi-language narration

Audio có thể được tải sẵn về thiết bị để sử dụng offline.

---

## Translation System

Hệ thống sử dụng translation table riêng để hỗ trợ đa ngôn ngữ.

Thiết kế này giúp:

* Dễ mở rộng ngôn ngữ
* Giảm trùng lặp dữ liệu
* Tăng khả năng bảo trì
* Tối ưu synchronization

Các nội dung được hỗ trợ localization:

* Tên Tour
* Mô tả Tour
* Tên POI
* Nội dung narration
* Audio narration

---

## QR Navigation

Hệ thống hỗ trợ QR code để kích hoạt narration.

QR được sử dụng trong các trường hợp:

* Indoor navigation
* Museum guide
* GPS không chính xác
* Kích hoạt nội dung thủ công

Khi người dùng quét QR code, hệ thống sẽ:

1. Xác định POI tương ứng
2. Lấy nội dung narration
3. Phát audio theo ngôn ngữ đã chọn

---

# Offline-First Architecture

Thiết kế offline-first là thành phần quan trọng của hệ thống.

## Mục Tiêu

Ứng dụng vẫn hoạt động khi:

* Mất kết nối internet
* Kết nối yếu
* Di chuyển ngoài vùng phủ sóng

## Dữ Liệu Được Cache Offline

Các dữ liệu được lưu offline gồm:

* Tour
* POI
* Translation
* Audio file
* Hình ảnh
* Narration history

## Lợi Ích

* Trải nghiệm ổn định hơn
* Giảm phụ thuộc internet
* Tăng tốc độ truy cập dữ liệu
* Giảm chi phí mạng

---

# Synchronization Strategy

Hệ thống sử dụng cơ chế incremental synchronization.

## Nguyên Lý Hoạt Động

Chỉ những dữ liệu thay đổi mới được đồng bộ.

Điều này giúp:

* Giảm băng thông
* Tăng tốc sync
* Giảm tải server
* Tối ưu pin trên mobile

## Sync Flow

```text
Server Database
      ↓
Sync API
      ↓
SQLite Local Database
      ↓
Mobile Application
```

## Offline Queue

Các thao tác phát sinh offline sẽ được lưu tạm local.

Ví dụ:

* Narration log
* Playback history
* User interaction

Khi có internet, dữ liệu sẽ được gửi lên server.

---

# GPS & Geofencing

Hệ thống sử dụng GPS để tự động kích hoạt narration.

## Cơ Chế Hoạt Động

1. Ứng dụng lấy vị trí người dùng
2. So sánh với tọa độ POI
3. Kiểm tra bán kính kích hoạt
4. Tự động phát narration

## Geofence Optimization

Để tối ưu hiệu năng:

* Chỉ kiểm tra POI gần vị trí hiện tại
* Giảm số lần tính khoảng cách
* Sử dụng geofence cooldown
* Tránh trigger lặp liên tục

---

# Audio Management

Hệ thống quản lý audio theo mô hình metadata + file storage.

## Audio Metadata

Lưu thông tin:

* Audio URL
* Language
* Duration
* File size
* Mime type
* Audio type

## Audio Cache

Audio file được lưu cục bộ trên thiết bị.

Lợi ích:

* Phát nhanh hơn
* Hoạt động offline
* Giảm tải mạng

---

# Bảo Mật & Toàn Vẹn Dữ Liệu

Hệ thống đảm bảo tính toàn vẹn dữ liệu thông qua:

* Foreign key
* Unique constraint
* Version tracking
* Synchronization timestamp
* Checksum validation

Ngoài ra hệ thống còn hỗ trợ:

* Phát hiện conflict khi sync
* Kiểm tra dữ liệu trùng lặp
* Đảm bảo consistency giữa mobile và server

---

# Khả Năng Mở Rộng

Thiết kế hiện tại cho phép mở rộng dễ dàng trong tương lai.

Có thể bổ sung:

* User account
* Favorite POI
* AI narration
* Recommendation system
* Analytics dashboard
* Smart routing
* AR navigation
* Voice assistant

---

# Kết Luận

Thiết kế cơ sở dữ liệu của VinhHy.AudioTour được xây dựng theo hướng hiện đại, tối ưu cho mobile application và offline experience.

Các điểm mạnh chính:

* Offline-first architecture
* GPS-based narration
* Multi-language support
* Incremental synchronization
* Audio caching
* Flexible tour management
* Mobile performance optimization

Thiết kế phù hợp cho:

* Smart tourism application
* Museum guide system
* Historical site navigation
* Outdoor educational platform
* Smart city audio tour
# Thiết Kế Cơ Sở Dữ Liệu — VinhHy.AudioTour

## Tổng Quan

Tài liệu này mô tả thiết kế cơ sở dữ liệu của hệ thống VinhHy.AudioTour.

Hệ thống được xây dựng theo mô hình offline-first nhằm hỗ trợ ứng dụng mobile hoạt động ổn định ngay cả khi không có kết nối internet. Dữ liệu được lưu trữ cục bộ bằng SQLite trên thiết bị di động và đồng bộ với backend server khi có mạng.

Thiết kế cơ sở dữ liệu hướng tới các mục tiêu:

* Hỗ trợ GPS Audio Tour
* Quản lý Tour và Point Of Interest (POI)
* Hỗ trợ đa ngôn ngữ
* Tối ưu đồng bộ dữ liệu
* Hỗ trợ tải offline package
* Theo dõi lịch sử narration
* Tối ưu hiệu năng trên mobile

---

# Database Schema Overview

Hệ thống sử dụng relational database schema để quản lý dữ liệu Tour, POI, Audio và synchronization.

Các nhóm bảng chính gồm:

* Tour management
* POI management
* Audio management
* Translation system
* Offline synchronization
* Narration logging
* QR navigation

---

# Danh Sách Bảng Chính

| Table            | Chức năng                   |
| ---------------- | --------------------------- |
| Tours            | Quản lý thông tin Tour      |
| TourTranslations | Nội dung Tour đa ngôn ngữ   |
| POIs             | Quản lý Point Of Interest   |
| POITranslations  | Nội dung POI đa ngôn ngữ    |
| AudioTracks      | Quản lý audio narration     |
| TourPOIs         | Liên kết Tour và POI        |
| QRLocations      | Quản lý QR trigger          |
| NarrationLogs    | Lưu lịch sử narration       |
| OfflinePackages  | Quản lý offline package     |
| SyncCursors      | Theo dõi synchronization    |
| GeofenceState    | Trạng thái geofence runtime |
| LocalSettings    | Cấu hình local application  |

---

# Thiết Kế Các Bảng

## Tours

Bảng lưu thông tin Tour.

### Các cột chính

| Column           | Type    | Mô tả                     |
| ---------------- | ------- | ------------------------- |
| Id               | INTEGER | Khóa chính                |
| Code             | TEXT    | Mã Tour duy nhất          |
| DefaultLanguage  | TEXT    | Ngôn ngữ mặc định         |
| IsActive         | INTEGER | Trạng thái hoạt động      |
| EstimatedMinutes | INTEGER | Thời lượng ước tính       |
| Version          | INTEGER | Phiên bản synchronization |
| UpdatedAt        | TEXT    | Thời gian cập nhật        |

---

## TourTranslations

Bảng lưu nội dung đa ngôn ngữ cho Tour.

### Các cột chính

| Column       | Type    | Mô tả          |
| ------------ | ------- | -------------- |
| Id           | INTEGER | Khóa chính     |
| TourId       | INTEGER | Tour liên kết  |
| LanguageCode | TEXT    | Mã ngôn ngữ    |
| Name         | TEXT    | Tên Tour       |
| Description  | TEXT    | Nội dung mô tả |

---

## POIs

Bảng quản lý Point Of Interest.

### Các cột chính

| Column       | Type    | Mô tả                     |
| ------------ | ------- | ------------------------- |
| Id           | INTEGER | Khóa chính                |
| Code         | TEXT    | Mã POI                    |
| Latitude     | REAL    | Vĩ độ GPS                 |
| Longitude    | REAL    | Kinh độ GPS               |
| RadiusMeters | REAL    | Bán kính kích hoạt        |
| Priority     | INTEGER | Độ ưu tiên                |
| Category     | TEXT    | Loại địa điểm             |
| ImageUrl     | TEXT    | Hình ảnh                  |
| IsActive     | INTEGER | Trạng thái hoạt động      |
| Version      | INTEGER | Phiên bản synchronization |
| UpdatedAt    | TEXT    | Thời gian cập nhật        |

---

## POITranslations

Bảng lưu nội dung đa ngôn ngữ cho POI.

### Các cột chính

| Column           | Type    | Mô tả          |
| ---------------- | ------- | -------------- |
| Id               | INTEGER | Khóa chính     |
| POIId            | INTEGER | POI liên kết   |
| LanguageCode     | TEXT    | Mã ngôn ngữ    |
| Name             | TEXT    | Tên địa điểm   |
| Description      | TEXT    | Nội dung mô tả |
| ShortDescription | TEXT    | Mô tả ngắn     |

---

## AudioTracks

Bảng quản lý audio narration.

### Các cột chính

| Column          | Type    | Mô tả                   |
| --------------- | ------- | ----------------------- |
| Id              | INTEGER | Khóa chính              |
| POIId           | INTEGER | POI liên kết            |
| LanguageCode    | TEXT    | Ngôn ngữ audio          |
| AudioType       | TEXT    | Loại audio              |
| FileUrl         | TEXT    | Đường dẫn file          |
| TTSText         | TEXT    | Nội dung Text To Speech |
| DurationSeconds | INTEGER | Thời lượng              |
| FileSizeBytes   | INTEGER | Kích thước file         |
| MimeType        | TEXT    | Định dạng file          |
| LocalFilePath   | TEXT    | Đường dẫn local cache   |
| IsDownloaded    | INTEGER | Trạng thái tải xuống    |

---

## TourPOIs

Bảng liên kết giữa Tour và POI.

### Các cột chính

| Column     | Type    | Mô tả            |
| ---------- | ------- | ---------------- |
| Id         | INTEGER | Khóa chính       |
| TourId     | INTEGER | Tour liên kết    |
| POIId      | INTEGER | POI liên kết     |
| OrderIndex | INTEGER | Thứ tự tham quan |

---

## QRLocations

Bảng quản lý QR trigger.

### Các cột chính

| Column   | Type    | Mô tả                |
| -------- | ------- | -------------------- |
| Id       | INTEGER | Khóa chính           |
| POIId    | INTEGER | POI liên kết         |
| QRCode   | TEXT    | Giá trị QR           |
| Label    | TEXT    | Tên hiển thị         |
| IsActive | INTEGER | Trạng thái hoạt động |

---

## NarrationLogs

Bảng lưu lịch sử narration.

### Các cột chính

| Column                | Type    | Mô tả                      |
| --------------------- | ------- | -------------------------- |
| Id                    | INTEGER | Khóa chính local           |
| ServerId              | INTEGER | ID từ server               |
| POIId                 | INTEGER | POI liên kết               |
| TriggerType           | TEXT    | Kiểu kích hoạt             |
| LanguageCode          | TEXT    | Ngôn ngữ                   |
| PlayedAt              | TEXT    | Thời gian phát             |
| DurationPlayedSeconds | INTEGER | Thời lượng đã nghe         |
| Synced                | INTEGER | Trạng thái synchronization |

---

## OfflinePackages

Bảng quản lý offline package.

### Các cột chính

| Column         | Type    | Mô tả                     |
| -------------- | ------- | ------------------------- |
| Id             | INTEGER | Khóa chính                |
| TourId         | INTEGER | Tour liên kết             |
| LanguageCode   | TEXT    | Ngôn ngữ package          |
| PackageVersion | TEXT    | Phiên bản package         |
| DownloadUrl    | TEXT    | Link tải                  |
| FileSizeBytes  | INTEGER | Kích thước package        |
| Checksum       | TEXT    | Kiểm tra toàn vẹn dữ liệu |
| IsDownloaded   | INTEGER | Trạng thái tải            |

---

## SyncCursors

Bảng theo dõi synchronization.

### Các cột chính

| Column       | Type | Mô tả                   |
| ------------ | ---- | ----------------------- |
| EntityType   | TEXT | Tên entity              |
| LastSyncedAt | TEXT | Thời gian sync gần nhất |

---

## GeofenceState

Bảng lưu trạng thái geofence runtime.

### Các cột chính

| Column          | Type    | Mô tả                         |
| --------------- | ------- | ----------------------------- |
| POIId           | INTEGER | POI liên kết                  |
| LastTriggeredAt | TEXT    | Trigger gần nhất              |
| CooldownUntil   | TEXT    | Thời gian cooldown            |
| EnteredAt       | TEXT    | Thời gian đi vào vùng         |
| IsInsideRadius  | INTEGER | Trạng thái bên trong geofence |

---

## LocalSettings

Bảng lưu cấu hình local application.

### Các cột chính

| Column    | Type | Mô tả              |
| --------- | ---- | ------------------ |
| Key       | TEXT | Tên cấu hình       |
| Value     | TEXT | Giá trị cấu hình   |
| UpdatedAt | TEXT | Thời gian cập nhật |

---

# Kiến Trúc Hệ Thống Dữ Liệu

Hệ thống sử dụng 2 tầng dữ liệu:

## 1. Server Database

Server database đóng vai trò quản lý dữ liệu trung tâm.

Chức năng:

* Quản lý nội dung Tour
* Quản lý Point Of Interest
* Lưu metadata audio
* Quản lý translation đa ngôn ngữ
* Quản lý QR location
* Xuất offline package
* Đồng bộ dữ liệu cho mobile app

## 2. Mobile SQLite Database

SQLite database trên mobile được sử dụng để:

* Lưu dữ liệu offline
* Cache audio file
* Ghi nhận narration log
* Tăng tốc truy cập dữ liệu
* Hỗ trợ hoạt động không cần internet

---

# Mô Hình Nghiệp Vụ

## Tours

Tours đại diện cho các hành trình tham quan.

Mỗi tour bao gồm:

* Danh sách POI
* Thứ tự tham quan
* Nội dung mô tả
* Audio narration
* Dữ liệu đa ngôn ngữ

Một tour có thể chứa nhiều POI.

---

## POIs (Point Of Interest)

POI là các địa điểm tham quan thực tế.

Mỗi POI bao gồm:

* Vị trí GPS
* Bán kính kích hoạt
* Nội dung mô tả
* Audio narration
* Hình ảnh minh họa
* QR trigger

POI là thành phần trung tâm của hệ thống.

---

## AudioTracks

AudioTracks quản lý audio narration cho từng POI.

Hệ thống hỗ trợ:

* Audio file upload
* Text To Speech (TTS)
* Offline audio cache
* Multi-language narration

Audio có thể được tải sẵn về thiết bị để sử dụng offline.

---

## Translation System

Hệ thống sử dụng translation table riêng để hỗ trợ đa ngôn ngữ.

Thiết kế này giúp:

* Dễ mở rộng ngôn ngữ
* Giảm trùng lặp dữ liệu
* Tăng khả năng bảo trì
* Tối ưu synchronization

Các nội dung được hỗ trợ localization:

* Tên Tour
* Mô tả Tour
* Tên POI
* Nội dung narration
* Audio narration

---

## QR Navigation

Hệ thống hỗ trợ QR code để kích hoạt narration.

QR được sử dụng trong các trường hợp:

* Indoor navigation
* Museum guide
* GPS không chính xác
* Kích hoạt nội dung thủ công

Khi người dùng quét QR code, hệ thống sẽ:

1. Xác định POI tương ứng
2. Lấy nội dung narration
3. Phát audio theo ngôn ngữ đã chọn

---

# Offline-First Architecture

Thiết kế offline-first là thành phần quan trọng của hệ thống.

## Mục Tiêu

Ứng dụng vẫn hoạt động khi:

* Mất kết nối internet
* Kết nối yếu
* Di chuyển ngoài vùng phủ sóng

## Dữ Liệu Được Cache Offline

Các dữ liệu được lưu offline gồm:

* Tour
* POI
* Translation
* Audio file
* Hình ảnh
* Narration history

## Lợi Ích

* Trải nghiệm ổn định hơn
* Giảm phụ thuộc internet
* Tăng tốc độ truy cập dữ liệu
* Giảm chi phí mạng

---

# Synchronization Strategy

Hệ thống sử dụng cơ chế incremental synchronization.

## Nguyên Lý Hoạt Động

Chỉ những dữ liệu thay đổi mới được đồng bộ.

Điều này giúp:

* Giảm băng thông
* Tăng tốc sync
* Giảm tải server
* Tối ưu pin trên mobile

## Sync Flow

```text
Server Database
      ↓
Sync API
      ↓
SQLite Local Database
      ↓
Mobile Application
```

## Offline Queue

Các thao tác phát sinh offline sẽ được lưu tạm local.

Ví dụ:

* Narration log
* Playback history
* User interaction

Khi có internet, dữ liệu sẽ được gửi lên server.

---

# GPS & Geofencing

Hệ thống sử dụng GPS để tự động kích hoạt narration.

## Cơ Chế Hoạt Động

1. Ứng dụng lấy vị trí người dùng
2. So sánh với tọa độ POI
3. Kiểm tra bán kính kích hoạt
4. Tự động phát narration

## Geofence Optimization

Để tối ưu hiệu năng:

* Chỉ kiểm tra POI gần vị trí hiện tại
* Giảm số lần tính khoảng cách
* Sử dụng geofence cooldown
* Tránh trigger lặp liên tục

---

# Audio Management

Hệ thống quản lý audio theo mô hình metadata + file storage.

## Audio Metadata

Lưu thông tin:

* Audio URL
* Language
* Duration
* File size
* Mime type
* Audio type

## Audio Cache

Audio file được lưu cục bộ trên thiết bị.

Lợi ích:

* Phát nhanh hơn
* Hoạt động offline
* Giảm tải mạng

---

# Bảo Mật & Toàn Vẹn Dữ Liệu

Hệ thống đảm bảo tính toàn vẹn dữ liệu thông qua:

* Foreign key
* Unique constraint
* Version tracking
* Synchronization timestamp
* Checksum validation

Ngoài ra hệ thống còn hỗ trợ:

* Phát hiện conflict khi sync
* Kiểm tra dữ liệu trùng lặp
* Đảm bảo consistency giữa mobile và server

---

# Khả Năng Mở Rộng

Thiết kế hiện tại cho phép mở rộng dễ dàng trong tương lai.

Có thể bổ sung:

* User account
* Favorite POI
* AI narration
* Recommendation system
* Analytics dashboard
* Smart routing
* AR navigation
* Voice assistant

---

# Kết Luận

Thiết kế cơ sở dữ liệu của VinhHy.AudioTour được xây dựng theo hướng hiện đại, tối ưu cho mobile application và offline experience.

Các điểm mạnh chính:

* Offline-first architecture
* GPS-based narration
* Multi-language support
* Incremental synchronization
* Audio caching
* Flexible tour management
* Mobile performance optimization

Thiết kế phù hợp cho:

* Smart tourism application
* Museum guide system
* Historical site navigation
* Outdoor educational platform
* Smart city audio tour
