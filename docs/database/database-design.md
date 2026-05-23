# Thiết Kế Cơ Sở Dữ Liệu — VinhHy.AudioTour

## Tổng Quan

Tài liệu này mô tả thiết kế cơ sở dữ liệu của hệ thống VinhHy.AudioTour.

Hệ thống được xây dựng theo mô hình offline-first nhằm hỗ trợ ứng dụng mobile hoạt động ổn định ngay cả khi không có kết nối internet. Dữ liệu được lưu trữ cục bộ bằng SQLite trên thiết bị di động và đồng bộ với backend server khi có mạng.

Thiết kế database tuân theo:

* SQL Server cho backend server
* SQLite cho mobile offline storage
* Incremental synchronization
* Soft-delete synchronization
* Multi-language support
* GPS geofencing optimization

---

# Database Architecture

Hệ thống sử dụng 2 tầng dữ liệu:

## 1. Server Database (SQL Server)

Sử dụng cho:

* Quản lý dữ liệu trung tâm
* Authentication & authorization
* CMS quản trị nội dung
* Analytics
* Synchronization API
* Audit logging
* Offline package publishing

Công nghệ:

* SQL Server 2019+
* Entity Framework Core
* ASP.NET Core 9

---

## 2. Mobile Database (SQLite)

Sử dụng cho:

* Offline data storage
* Audio cache metadata
* Runtime geofence state
* Narration logging
* Local synchronization state
* Mobile performance optimization

Công nghệ:

* SQLite
* sqlite-net-pcl
* .NET MAUI

---

# Languages Reference Strategy

Bảng `Languages` là reference table chứa danh sách ngôn ngữ được hỗ trợ.

Các cột `LanguageCode` trong hệ thống hiện KHÔNG khai báo foreign key trực tiếp tới `Languages(Code)`.

Thiết kế này nhằm:

* Giảm coupling giữa synchronization layer và lookup table
* Tránh lỗi sync khi mobile chưa seed đủ dữ liệu
* Đơn giản hóa migration trên SQLite
* Tăng tính linh hoạt khi bổ sung ngôn ngữ mới

Validation của `LanguageCode` sẽ được xử lý tại:

* Backend validation layer
* Service layer
* Synchronization API
* CMS validation

Lưu ý:

* Trên ERD vẫn thể hiện quan hệ logic giữa `LanguageCode` và `Languages.Code`
* Tuy nhiên database vật lý không enforce foreign key constraint

---

# Danh Sách Bảng Chính

| Table              | Chức năng                              |
| ------------------ | -------------------------------------- |
| Roles              | Phân quyền hệ thống                    |
| Users              | Quản lý tài khoản                      |
| Devices            | Thiết bị mobile đã đăng ký             |
| Languages          | Danh sách ngôn ngữ                     |
| Tours              | Quản lý tour                           |
| TourTranslations   | Nội dung tour đa ngôn ngữ              |
| POIs               | Point Of Interest                      |
| POITranslations    | Nội dung POI đa ngôn ngữ               |
| AudioTracks        | Audio narration                        |
| TourPOIs           | Liên kết Tour và POI                   |
| QRLocations        | QR trigger                             |
| GeofenceConfigs    | Cấu hình geofence theo POI             |
| OfflinePackages    | Offline package                        |
| NarrationLogs      | Nhật ký narration                      |
| SyncHistory        | Lịch sử synchronization                |
| DeletedRecords     | Tombstone synchronization              |
| AuditLogs          | Audit log hệ thống                     |
| ContentVersions    | Version snapshot                       |
| AnalyticsDaily     | Thống kê narration                     |
| SyncCursors        | Theo dõi incremental sync              |
| GeofenceState      | Runtime geofence state                 |
| LocalSettings      | Local app configuration                |
| DeviceRegistration | Device registration trên mobile SQLite |

---

# SQL Server Database Design

## Roles

Bảng phân quyền hệ thống.

### Columns

| Column      | Type          | Description |
| ----------- | ------------- | ----------- |
| Id          | INT           | Primary key |
| Name        | NVARCHAR(50)  | Tên role    |
| Description | NVARCHAR(200) | Mô tả       |

### Constraints

* UNIQUE(Name)

---

## Users

Bảng quản lý tài khoản người dùng.

### Columns

| Column             | Type          | Description          |
| ------------------ | ------------- | -------------------- |
| Id                 | INT           | Primary key          |
| Username           | NVARCHAR(100) | Username             |
| Email              | NVARCHAR(254) | Email                |
| PasswordHash       | NVARCHAR(512) | Password hash        |
| RoleId             | INT           | Role liên kết        |
| PreferredLanguage  | NVARCHAR(10)  | Ngôn ngữ mặc định    |
| IsActive           | BIT           | Trạng thái hoạt động |
| RefreshToken       | NVARCHAR(512) | Refresh token        |
| RefreshTokenExpiry | DATETIME2     | Hết hạn token        |
| CreatedAt          | DATETIME2     | Ngày tạo             |
| UpdatedAt          | DATETIME2     | Ngày cập nhật        |

### Relationships

* Users.RoleId → Roles.Id

### Constraints

* UNIQUE(Username)
* UNIQUE(Email)

---

## Devices

Thiết bị mobile đã đăng ký với backend.

### Columns

| Column     | Type          | Description             |
| ---------- | ------------- | ----------------------- |
| Id         | INT           | Primary key             |
| DeviceId   | NVARCHAR(100) | UUID thiết bị           |
| UserId     | INT           | User liên kết           |
| Platform   | NVARCHAR(50)  | android / ios           |
| AppVersion | NVARCHAR(50)  | Phiên bản app           |
| OsVersion  | NVARCHAR(50)  | Phiên bản OS            |
| PushToken  | NVARCHAR(512) | Push notification token |
| LastSeenAt | DATETIME2     | Hoạt động gần nhất      |
| CreatedAt  | DATETIME2     | Ngày tạo                |

### Relationships

* Devices.UserId → Users.Id

### Constraints

* UNIQUE(DeviceId)

---

## Languages

Reference table quản lý ngôn ngữ.

### Columns

| Column     | Type          | Description     |
| ---------- | ------------- | --------------- |
| Code       | NVARCHAR(10)  | Mã ngôn ngữ     |
| Name       | NVARCHAR(100) | Tên             |
| NativeName | NVARCHAR(100) | Tên bản địa     |
| IsActive   | BIT           | Trạng thái      |
| SortOrder  | INT           | Thứ tự hiển thị |

### Constraints

* PRIMARY KEY(Code)
* UNIQUE(Name)

---

## Tours

Quản lý thông tin Tour.

### Columns

| Column           | Type          | Description           |
| ---------------- | ------------- | --------------------- |
| Id               | INT           | Primary key           |
| Code             | NVARCHAR(100) | Mã tour               |
| DefaultLanguage  | NVARCHAR(10)  | Ngôn ngữ mặc định     |
| EstimatedMinutes | INT           | Thời lượng ước tính   |
| IsActive         | BIT           | Trạng thái            |
| DeletedAt        | DATETIME2     | Soft-delete timestamp |
| Version          | BIGINT        | Sync version          |
| UpdatedAt        | DATETIME2     | Last updated          |

### Constraints

* UNIQUE(Code)

---

## TourTranslations

Nội dung đa ngôn ngữ của Tour.

### Columns

| Column       | Type          | Description   |
| ------------ | ------------- | ------------- |
| Id           | INT           | Primary key   |
| TourId       | INT           | Tour liên kết |
| LanguageCode | NVARCHAR(10)  | Mã ngôn ngữ   |
| Name         | NVARCHAR(200) | Tên tour      |
| Description  | NVARCHAR(MAX) | Mô tả         |

### Relationships

* TourTranslations.TourId → Tours.Id

### Constraints

* UNIQUE(TourId, LanguageCode)

---

## POIs

Point Of Interest dùng cho GPS narration.

### Columns

| Column          | Type          | Description                    |
| --------------- | ------------- | ------------------------------ |
| Id              | INT           | Primary key                    |
| Code            | NVARCHAR(100) | Mã POI                         |
| Latitude        | DECIMAL(9,6)  | Vĩ độ                          |
| Longitude       | DECIMAL(9,6)  | Kinh độ                        |
| RadiusMeters    | FLOAT         | Bán kính geofence              |
| Priority        | INT           | Độ ưu tiên                     |
| Category        | NVARCHAR(100) | Phân loại                      |
| ImageUrl        | NVARCHAR(500) | Ảnh                            |
| CooldownSeconds | INT           | Cooldown narration             |
| MinDwellSeconds | INT           | Thời gian tối thiểu trong vùng |
| IsActive        | BIT           | Trạng thái                     |
| DeletedAt       | DATETIME2     | Soft-delete                    |
| Version         | BIGINT        | Sync version                   |
| UpdatedAt       | DATETIME2     | Last updated                   |

### Constraints

* UNIQUE(Code)

---

## POITranslations

Nội dung đa ngôn ngữ của POI.

### Columns

| Column           | Type          | Description  |
| ---------------- | ------------- | ------------ |
| Id               | INT           | Primary key  |
| POIId            | INT           | POI liên kết |
| LanguageCode     | NVARCHAR(10)  | Mã ngôn ngữ  |
| Name             | NVARCHAR(200) | Tên địa điểm |
| Description      | NVARCHAR(MAX) | Mô tả        |
| ShortDescription | NVARCHAR(500) | Mô tả ngắn   |

### Relationships

* POITranslations.POIId → POIs.Id

### Constraints

* UNIQUE(POIId, LanguageCode)

---

## AudioTracks

Metadata của audio narration.

### Columns

| Column          | Type           | Description       |
| --------------- | -------------- | ----------------- |
| Id              | INT            | Primary key       |
| POIId           | INT            | POI liên kết      |
| LanguageCode    | NVARCHAR(10)   | Ngôn ngữ          |
| AudioType       | NVARCHAR(50)   | prerecorded / tts |
| FileUrl         | NVARCHAR(1000) | URL file          |
| TTSText         | NVARCHAR(MAX)  | Nội dung TTS      |
| DurationSeconds | INT            | Thời lượng        |
| FileSizeBytes   | BIGINT         | Kích thước        |
| MimeType        | NVARCHAR(100)  | Mime type         |
| DeletedAt       | DATETIME2      | Soft-delete       |
| Version         | BIGINT         | Sync version      |
| UpdatedAt       | DATETIME2      | Last updated      |

### Relationships

* AudioTracks.POIId → POIs.Id

### Constraints

* UNIQUE(POIId, LanguageCode)

---

## TourPOIs

Liên kết giữa Tour và POI.

### Columns

| Column     | Type | Description   |
| ---------- | ---- | ------------- |
| Id         | INT  | Primary key   |
| TourId     | INT  | Tour liên kết |
| POIId      | INT  | POI liên kết  |
| OrderIndex | INT  | Thứ tự        |

### Relationships

* TourPOIs.TourId → Tours.Id
* TourPOIs.POIId → POIs.Id

### Constraints

* UNIQUE(TourId, POIId)

---

## QRLocations

QR trigger narration.

### Columns

| Column    | Type          | Description  |
| --------- | ------------- | ------------ |
| Id        | INT           | Primary key  |
| POIId     | INT           | POI liên kết |
| QRCode    | NVARCHAR(200) | Nội dung QR  |
| Label     | NVARCHAR(200) | Tên hiển thị |
| IsActive  | BIT           | Trạng thái   |
| ExpiresAt | DATETIME2     | Ngày hết hạn |
| DeletedAt | DATETIME2     | Soft-delete  |

### Relationships

* QRLocations.POIId → POIs.Id

### Constraints

* UNIQUE(QRCode)

---

## GeofenceConfigs

Cấu hình geofence nâng cao theo POI.

### Purpose

Tách geofence runtime configuration khỏi dữ liệu POI nhằm:

* Dễ tuning geofence
* Tránh thay đổi core POI metadata
* Hỗ trợ future optimization

---

## NarrationLogs

Lưu lịch sử narration từ mobile.

### Columns

| Column                | Type          | Description       |
| --------------------- | ------------- | ----------------- |
| Id                    | BIGINT        | Primary key       |
| DeviceId              | NVARCHAR(100) | Thiết bị          |
| POIId                 | INT           | POI               |
| TriggerType           | NVARCHAR(50)  | gps / qr / manual |
| LanguageCode          | NVARCHAR(10)  | Ngôn ngữ          |
| PlayedAt              | DATETIME2     | Thời gian phát    |
| DurationPlayedSeconds | INT           | Thời gian nghe    |

### Relationships

* NarrationLogs.POIId → POIs.Id
* NarrationLogs.DeviceId → Devices.DeviceId

---

## OfflinePackages

Offline content package.

### Columns

| Column         | Type           | Description  |
| -------------- | -------------- | ------------ |
| Id             | INT            | Primary key  |
| TourId         | INT            | Tour         |
| LanguageCode   | NVARCHAR(10)   | Ngôn ngữ     |
| PackageVersion | NVARCHAR(50)   | Phiên bản    |
| DownloadUrl    | NVARCHAR(1000) | URL tải      |
| FileSizeBytes  | BIGINT         | Kích thước   |
| Checksum       | NVARCHAR(256)  | Checksum     |
| PublishedAt    | DATETIME2      | Ngày publish |

### Relationships

* OfflinePackages.TourId → Tours.Id

### Constraints

* UNIQUE(TourId, LanguageCode, PackageVersion)

---

## SyncHistory

Lưu lịch sử synchronization.

### Relationships

* SyncHistory.UserId → Users.Id
* SyncHistory.DeviceId → Devices.DeviceId

---

## DeletedRecords

Tombstone table phục vụ incremental synchronization.

### Purpose

Cho phép mobile biết record nào đã bị xóa trên server.

### Relationships

* DeletedRecords.DeletedBy → Users.Id

---

## AuditLogs

Lưu lịch sử thao tác hệ thống.

### Important Notes

* UserId cho phép NULL
* RecordId KHÔNG phải foreign key
* RecordId chỉ lưu ID động của record bị tác động

Ví dụ:

* RecordId = '15' của bảng POIs
* RecordId = '7' của bảng Tours
* RecordId = 'AUDIO_22'

Thiết kế này giúp AuditLogs hoạt động generic cho nhiều bảng khác nhau.

### Relationships

* AuditLogs.UserId → Users.Id

---

## ContentVersions

Snapshot versioning của nội dung.

### Purpose

* Lưu lịch sử thay đổi nội dung
* Rollback content
* Audit dữ liệu
* Synchronization debugging

### Relationships

* ContentVersions.CreatedBy → Users.Id

---

## AnalyticsDaily

Thống kê narration theo ngày.

### Relationships

* AnalyticsDaily.POIId → POIs.Id

---

# Mobile SQLite Design

SQLite schema chỉ lưu dữ liệu cần thiết cho mobile runtime.

## Mobile-Specific Tables

### LocalSettings

Lưu cấu hình local của ứng dụng.

---

### DeviceRegistration

Lưu thông tin thiết bị hiện tại trên mobile.

Khác với bảng `Devices` trên server:

* `Devices` = toàn bộ thiết bị đã đăng ký
* `DeviceRegistration` = trạng thái local của thiết bị hiện tại

---

### GeofenceState

Runtime state của geofence engine.

Dùng để:

* debounce
* cooldown
* anti-repeat trigger
* dwell time tracking

Dữ liệu này KHÔNG sync lên server.

---

### SyncCursors

Theo dõi incremental synchronization.

Ví dụ:

| EntityType  | LastSyncedAt         |
| ----------- | -------------------- |
| POIs        | 2026-05-22T10:00:00Z |
| AudioTracks | 2026-05-22T10:01:00Z |

---

# Synchronization Strategy

Hệ thống sử dụng incremental synchronization.

## Sync Components

* UpdatedAt timestamp
* Version tracking
* DeletedRecords tombstone
* Sync cursors
* Background retry queue

## Synchronization Flow

1. Mobile gửi sync cursor
2. Server trả dữ liệu thay đổi
3. Server trả deleted records
4. Mobile apply changes
5. Mobile update local cursor

---

# Soft Delete Strategy

Các entity quan trọng không bị hard delete.

Sử dụng:

* DeletedAt
* DeletedRecords

Quy trình:

1. Server set DeletedAt
2. Insert tombstone vào DeletedRecords
3. Mobile sync tombstone
4. Mobile remove local data

---

# Geofencing Architecture

Hệ thống geofence hỗ trợ:

* Haversine distance
* Debounce
* Cooldown
* POI priority resolver
* Queue management

## Priority Rules

Nếu nhiều POI chồng vùng:

1. Khoảng cách gần hơn
2. Priority cao hơn
3. Chưa phát gần đây

---

# Audio Management

Audio sử dụng mô hình:

* Metadata database
* File storage
* Local cache

## Audio Types

* Pre-recorded audio
* Text-to-Speech

## Offline Cache

Audio được cache local để:

* phát nhanh hơn
* hoạt động offline
* giảm network usage

---

# Data Integrity

Hệ thống đảm bảo integrity thông qua:

* Foreign key
* Unique constraint
* Version tracking
* Audit logging
* Checksum validation
* Synchronization timestamp

Lưu ý:

* Một số logical relationship không enforce FK vật lý
* Điều này nhằm tối ưu synchronization và mobile portability

---

# Kết Luận

Thiết kế database của VinhHy.AudioTour tập trung vào:

* Offline-first architecture
* Multi-language support
* GPS audio narration
* Incremental synchronization
* Mobile performance optimization
* Maintainable architecture
* Scalable synchronization

Thiết kế phù hợp cho:

* Smart tourism
* Museum guide
* Historical site navigation
* Outdoor education
* Smart city audio tour
