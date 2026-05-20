# PROJECT OVERVIEW

# VinhHy.AudioTour

---

# 1. Project Information

## Project Name

VinhHy.AudioTour

---

## Project Type

Hệ thống hướng dẫn du lịch thông minh đa ngôn ngữ.

Ứng dụng hoạt động như một hướng dẫn viên ảo:

* tự động nhận diện vị trí người dùng
* phát thuyết minh theo vị trí GPS
* hỗ trợ quét QR
* hỗ trợ đa ngôn ngữ
* hoạt động offline
* đồng bộ dữ liệu khi online

---

# 2. Main Goals

Mục tiêu của hệ thống:

* hỗ trợ du khách khám phá phố ẩm thực Vĩnh Hy
* giảm phụ thuộc hướng dẫn viên thủ công
* cung cấp trải nghiệm du lịch rảnh tay
* hỗ trợ đa ngôn ngữ cho khách quốc tế
* tối ưu hoạt động offline tại khu vực sóng yếu

---

# 3. Main Modules

## Mobile App

Nền tảng:

* .NET MAUI
* Android
* iOS

Chức năng:

* GPS realtime tracking
* Geofence narration
* Audio/TTS playback
* QR scan activation
* Offline SQLite
* Multi-language
* Offline package download
* Tour mode
* Audio queue management

---

## Backend API

Nền tảng:

* ASP.NET Core Web API
* SQL Server
* Entity Framework Core

Chức năng:

* Authentication
* POI management
* Audio management
* Translation management
* QR management
* Sync API
* Analytics
* Tour management

---

## CMS Admin

Nền tảng:

* React
* Vite
* TypeScript
* TailwindCSS

Chức năng:

* quản lý POI
* upload audio/image
* quản lý bản dịch
* quản lý tour
* analytics dashboard
* quản lý QR code

---

# 4. Official Tech Stack

## Mobile

* .NET MAUI
* CommunityToolkit.MVVM
* SQLite-net-pcl
* Plugin.Maui.Audio
* ZXing.Net.MAUI
* Mapsui hoặc Mapbox
* Polly

---

## Backend

* ASP.NET Core 9
* Entity Framework Core
* SQL Server
* JWT Authentication
* AutoMapper
* FluentValidation
* Serilog

---

## CMS

* React
* Vite
* TypeScript
* TailwindCSS
* React Query
* Axios

---

# 5. Architecture Style

## Mobile

* MVVM
* Service Layer
* Repository Pattern
* Dependency Injection

---

## Backend

* Clean Architecture nhẹ
* Feature-based structure
* Repository Pattern
* Service Layer
* DTO Pattern

---

# 6. Current Folder Structure

```text
/docs
/backend
/mobile
/cms
/infrastructure
/shared
```

---

# 7. Main Features

## GPS Tracking

* foreground tracking
* background tracking
* battery optimization
* realtime location update

---

## Geofence Engine

* Haversine distance
* debounce anti-spam
* cooldown anti-repeat
* POI priority resolver
* queue management

---

## Audio Narration

* Text-to-Speech
* Pre-recorded audio
* Audio queue
* Multi-language narration

---

## Offline Support

* SQLite local database
* offline POI
* cached audio
* incremental sync
* retry sync strategy

---

## QR Activation

* QR scan narration
* direct POI activation
* fallback when GPS inaccurate

---

# 8. Core Entities

```text
User
Role
POI
POITranslation
AudioTrack
Tour
TourPOI
QRLocation
NarrationLog
OfflinePackage
SyncHistory
```

---

# 9. Naming Convention

## C#

PascalCase

Ví dụ:

```text
POIService
AudioQueueManager
GeofenceEngine
```

---

## JSON

camelCase

Ví dụ:

```json
{
  "poiId": 1,
  "audioUrl": "..."
}
```

---

# 10. Coding Rules

## Required

* use async/await
* use dependency injection
* use DTOs
* use repository pattern
* use service layer
* use MVVM for MAUI

---

## Forbidden

* business logic in controller
* static mutable state
* inline SQL
* direct API calls in View
* duplicated business logic
* massive ViewModel

---

# 11. API Response Standard

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

# 12. Geofence Rules

## Debounce

POI chỉ được kích hoạt khi:

* người dùng ở ổn định trong vùng 3-5 giây

---

## Cooldown

Sau khi phát:

* không phát lại trong 2-5 phút

---

## Priority

Nếu nhiều POI chồng vùng:

Ưu tiên:

1. khoảng cách gần hơn
2. priority cao hơn
3. chưa phát gần đây

---

# 13. Offline Sync Strategy

## Mobile Local Storage

Lưu:

* POI
* translation
* audio metadata
* user settings
* downloaded package

---

## Sync Strategy

* incremental sync
* lastUpdated strategy
* retry queue
* background sync
* conflict resolution đơn giản

---

# 14. Development Phases

## Phase 1

* Authentication
* POI CRUD
* SQLite setup
* API base

---

## Phase 2

* GPS tracking
* Map integration
* Geofence engine

---

## Phase 3

* Audio queue
* TTS
* Offline sync

---

## Phase 4

* QR activation
* Analytics
* Optimization

---

# 15. AI Context Rules

Mọi AI phải đọc file này trước khi generate code.

AI phải:

* follow architecture hiện tại
* không tự đổi structure
* không over-engineering
* không thêm microservice
* không thêm CQRS phức tạp
* không thêm DDD nặng

---

# 16. Recommended Workflow

## Claude

Dùng cho:

* architecture
* system design
* geofence logic
* offline sync

---

## Cursor

Dùng cho:

* implementation
* refactor
* generate code
* fix compile errors

---

## ChatGPT

Dùng cho:

* debugging
* optimization
* documentation
* explanation

---

# 17. Important Notes

Đây là đồ án theo hướng:

* scalable
* maintainable
* AI-assisted engineering

Nhưng ưu tiên:

* simplicity
* maintainability
* development speed

Không hướng tới:

* microservice
* enterprise distributed system
* overly complex architecture

---

Đây là file đầu tiên phải cung cấp khi chuyển sang AI khác.
