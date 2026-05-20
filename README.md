# Kiến trúc hệ thống
# “Thuyết minh tự động đa ngôn ngữ cho phố ẩm thực Vĩnh Hy”

---

# 1. Kiến trúc tổng thể

## 1.1 High-Level Architecture

```text
                        ┌────────────────────────┐
                        │   Admin CMS Web App    │
                        │ ASP.NET Core MVC/React │
                        └──────────┬─────────────┘
                                   │ HTTPS/JWT
                                   ▼
                    ┌────────────────────────────┐
                    │    ASP.NET Core Web API    │
                    │----------------------------│
                    │ Auth Service               │
                    │ Tour Service               │
                    │ Content Service            │
                    │ Geofence Service           │
                    │ Analytics Service          │
                    │ Sync Service               │
                    │ Audio Package Service      │
                    └──────────┬─────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐   ┌──────────────────┐   ┌────────────────┐
│ SQL Server /  │   │ Object Storage   │   │ Redis Cache    │
│ PostgreSQL    │   │ Audio/Image CDN  │   │ Optional       │
└───────────────┘   └──────────────────┘   └────────────────┘

                               ▲
                               │ HTTPS/REST
                               ▼

┌───────────────────────────────────────────────────────────┐
│                 Mobile App (.NET MAUI)                   │
│-----------------------------------------------------------│
│ Presentation Layer                                        │
│ Tour UI                                                   │
│ Map UI                                                    │
│ QR Scanner                                                │
│ Audio Player                                              │
│                                                           │
│ Application Layer                                         │
│ Geofence Engine                                           │
│ GPS Background Service                                    │
│ Audio Queue Manager                                       │
│ Sync Manager                                              │
│ Offline Package Manager                                   │
│ Localization Manager                                      │
│                                                           │
│ Data Layer                                                │
│ SQLite                                                    │
│ Secure Storage                                            │
│ File Cache                                                │
└───────────────────────────────────────────────────────────┘
```

---

# 2. Luồng dữ liệu

## 2.1 Content Management Flow

```text
Admin CMS
   │
   ├── Tạo điểm tham quan
   ├── Upload audio đa ngôn ngữ
   ├── Thiết lập geofence
   └── Publish
            │
            ▼
      ASP.NET Core API
            │
            ▼
       Database + CDN
            │
            ▼
      Mobile Sync API
            │
            ▼
       SQLite Offline
```

---

## 2.2 Geofence Trigger Flow

```text
GPS Background Service
        │
        ▼
Current Location Updated
        │
        ▼
Geofence Engine
        │
        ├── Kiểm tra cooldown
        ├── Kiểm tra distance
        ├── Kiểm tra active tour
        │
        ▼
Audio Queue Manager
        │
        ▼
TTS / Offline Audio
        │
        ▼
User nghe thuyết minh
```

---

## 2.3 Offline Sync Flow

```text
Mobile Offline Data
        │
        ▼
Sync Queue
        │
        ▼
Sync API
        │
        ├── Pull content changes
        ├── Push analytics logs
        └── Resolve conflicts
        │
        ▼
SQLite Updated
```

---

# 3. Các module hệ thống

## 3.1 Mobile App Modules (.NET MAUI)

| Module | Chức năng |
|---|---|
| Authentication | Login/Guest mode |
| Tour Manager | Điều phối tour |
| GPS Tracker | Theo dõi vị trí background |
| Geofence Engine | Kích hoạt tự động |
| Audio Queue Manager | Hàng đợi audio |
| Offline Package Manager | Download dữ liệu |
| Sync Manager | Đồng bộ dữ liệu |
| QR Activation | Quét QR |
| Localization Manager | Đa ngôn ngữ |
| Analytics Collector | Thu thập hành vi |

---

## 3.2 Backend Modules

| Module | Chức năng |
|---|---|
| Auth Service | JWT/Auth |
| CMS Service | Quản lý nội dung |
| Tour Service | Tour/POI |
| Audio Service | Audio/TTS |
| Sync Service | Delta sync |
| Analytics Service | Tracking |
| Notification Service | Push notification |
| QR Service | QR activation |
| Geofence Config Service | Quản lý vùng |

---

## 3.3 CMS Modules

| Module | Chức năng |
|---|---|
| Dashboard | Tổng quan |
| Content Editor | Nội dung |
| Audio Upload | Upload audio |
| Geofence Editor | Thiết lập geofence |
| Language Management | Đa ngôn ngữ |
| Analytics Dashboard | Thống kê |
| User Management | Quản trị |

---

# 4. Sequence Diagram

## 4.1 Auto Narration Flow

```text
User enters geofence

Mobile GPS Service
        │
        ▼
Geofence Engine
        │
        ├── Check active?
        ├── Check cooldown?
        └── Check language
        │
        ▼
Audio Queue Manager
        │
        ▼
Offline Audio Exists?
        │
   ┌────┴─────┐
   │          │
 YES         NO
   │          │
   ▼          ▼
Play      TTS Engine
Audio         │
              ▼
         Generate speech
              │
              ▼
          Play audio
```

---

## 4.2 Offline Sync Sequence

```text
Mobile App
    │
    ├── Request sync token
    │
    ▼
Sync API
    │
    ├── Compare version
    ├── Generate delta package
    │
    ▼
Return changed entities
    │
    ▼
SQLite transaction update
    │
    ▼
Push local analytics logs
```

---

# 5. Đề xuất package/library

## 5.1 .NET MAUI

| Chức năng | Library |
|---|---|
| MVVM | CommunityToolkit.Mvvm |
| Local DB | sqlite-net-pcl |
| Background service | Plugin.LocalNotification / Shiny |
| GPS | GeolocatorPlugin |
| Maps | Microsoft.Maui.Controls.Maps |
| Audio | Plugin.Maui.Audio |
| QR Scanner | ZXing.Net.Maui |
| Secure storage | SecureStorage |
| HTTP | Refit |
| Logging | Serilog |
| Dependency Injection | Built-in DI |
| Offline Sync | Akavache (optional cache) |

---

## 5.2 Backend

| Chức năng | Library |
|---|---|
| ORM | Entity Framework Core |
| Authentication | ASP.NET Identity + JWT |
| Validation | FluentValidation |
| Mapping | Mapster |
| Logging | Serilog |
| API Docs | Swagger |
| Background Jobs | Hangfire |
| Caching | Redis |
| Object Storage | MinIO / S3 |
| TTS | Azure Speech / Google TTS |

---

# 6. Authentication Flow

## 6.1 Flow

```text
User Login
    │
    ▼
Auth API
    │
    ├── Validate credentials
    ├── Generate JWT
    └── Generate Refresh Token
    │
    ▼
Mobile Secure Storage
```

---

## 6.2 Roles

| Role | Quyền |
|---|---|
| Super Admin | Toàn quyền |
| Content Admin | Quản lý nội dung |
| Tour Operator | Quản lý tour |
| Analytics Viewer | Xem báo cáo |
| Guest User | Chỉ sử dụng app |

---

# 7. Offline sync strategy

## 7.1 Delta Sync

Không sync toàn bộ dữ liệu.

Chỉ sync:

- Records thay đổi
- Audio thay đổi
- Geofence thay đổi
- Translation thay đổi

---

## 7.2 Versioning

Mỗi entity có:

```text
UpdatedAt
Version
IsDeleted
```

---

## 7.3 Sync Table

```text
SyncMetadata
--------------
EntityName
LastSyncVersion
LastSyncTime
```

---

## 7.4 Conflict Strategy

| Loại dữ liệu | Strategy |
|---|---|
| CMS content | Server wins |
| Analytics | Append only |
| Offline cache | Replace |
| User preferences | Client wins |

---

# 8. Anti-spam geofence strategy

## 8.1 Cooldown Timer

Ví dụ:

```text
POI A triggered
=> Không trigger lại trong 5 phút
```

---

## 8.2 Minimum Distance Movement

Chỉ trigger nếu:

```text
Moved > 30m since last trigger
```

---

## 8.3 State Machine

```text
OUTSIDE → ENTERED → INSIDE → EXITED
```

Không trigger liên tục khi GPS jitter.

---

## 8.4 Speed Filter

Nếu:

```text
User speed > 40km/h
```

=> bỏ qua narration.

---

## 8.5 Accuracy Filter

Chỉ chấp nhận GPS:

```text
Accuracy <= 25m
```

---

# 9. Database overview

## 9.1 Core Tables

### Users

```text
Users
- Id
- Name
- Email
- Role
```

---

### Tours

```text
Tours
- Id
- Name
- Description
- IsActive
```

---

### POIs (Point Of Interest)

```text
POIs
- Id
- TourId
- Latitude
- Longitude
- Radius
- DisplayOrder
```

---

### POITranslations

```text
POITranslations
- Id
- PoiId
- LanguageCode
- Title
- Description
```

---

### AudioAssets

```text
AudioAssets
- Id
- PoiId
- LanguageCode
- FileUrl
- Duration
- Version
```

---

### QR Codes

```text
QRCodes
- Id
- PoiId
- Code
- ExpiredAt
```

---

### AnalyticsEvents

```text
AnalyticsEvents
- Id
- UserId
- EventType
- PoiId
- Timestamp
- Duration
```

---

# 10. API architecture

## 10.1 REST API Structure

```text
/api/auth
/api/tours
/api/pois
/api/audio
/api/sync
/api/geofence
/api/analytics
/api/qrcode
```

---

## 10.2 API Standards

| Tiêu chuẩn | Áp dụng |
|---|---|
| RESTful | Có |
| JWT | Có |
| Versioning | /api/v1 |
| Pagination | Có |
| OpenAPI | Swagger |
| Idempotency | Sync APIs |
| Compression | Gzip/Brotli |

---

## 10.3 Sync API Example

### Pull

```http
GET /api/v1/sync/pull?sinceVersion=120
```

### Push

```http
POST /api/v1/sync/push
```

---

# 11. Deployment architecture

## 11.1 Cloud Architecture

```text
                    Cloudflare CDN
                           │
                           ▼
                    Load Balancer
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 ASP.NET Core API #1                 ASP.NET Core API #2
         │                                   │
         └─────────────────┬─────────────────┘
                           ▼
                     Redis Cache
                           │
                           ▼
                    PostgreSQL DB
                           │
                           ▼
                    Object Storage
```

---

## 11.2 Mobile Distribution

| Platform | Phân phối |
|---|---|
| Android | Google Play |
| iOS | App Store |
| Internal Test | Firebase App Distribution |

---

## 11.3 CI/CD

| Thành phần | Công cụ |
|---|---|
| Source Control | GitHub |
| CI/CD | GitHub Actions |
| Container | Docker |
| Orchestration | Kubernetes (optional) |
| Monitoring | Grafana + Prometheus |

---

# 12. Security recommendations

## 12.1 API Security

- JWT expiration ngắn
- Refresh token rotation
- Rate limiting
- IP throttling
- HTTPS only
- HSTS enabled

---

## 12.2 Mobile Security

- SecureStorage cho token
- SQLite encryption
- Root/Jailbreak detection
- SSL pinning
- Obfuscation

---

## 12.3 CMS Security

- RBAC đầy đủ
- MFA cho admin
- Audit log
- Session timeout
- CSRF protection

---

## 12.4 File Security

- Signed URL cho audio
- CDN token
- Antivirus scanning upload

---

## 12.5 Analytics Privacy

- Không lưu GPS raw liên tục
- Ẩn danh hóa dữ liệu
- Consent tracking
- Data retention policy

---

# 13. Đề xuất kiến trúc thực tế triển khai

## Giai đoạn MVP

- .NET MAUI
- ASP.NET Core Web API
- SQLite offline
- QR activation
- Basic geofence
- Offline audio
- CMS cơ bản

---

## Giai đoạn Scale

- Redis cache
- CDN audio
- AI TTS generation
- Predictive analytics
- Real-time dashboard
- Multi-tour engine
- Push notification

---

# 14. Kiến trúc đề xuất cuối cùng

## Architectural Style

### Backend
- Clean Architecture
- CQRS nhẹ
- Repository Pattern
- Service Layer

### Mobile
- MVVM
- Offline-first
- Event-driven audio engine

### CMS
- Modular Monolith

---

# 15. Công nghệ khuyến nghị cuối cùng

| Layer | Technology |
|---|---|
| Mobile | .NET MAUI |
| Backend | ASP.NET Core 9 |
| Database | PostgreSQL |
| Offline DB | SQLite |
| CMS | ASP.NET Core MVC + React |
| Storage | S3/MinIO |
| Cache | Redis |
| Queue | Hangfire |
| Monitoring | Grafana |
| Auth | JWT + Identity |
| Maps | Google Maps/OpenStreetMap |
| TTS | Azure Speech Service |

