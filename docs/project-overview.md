# PROJECT OVERVIEW

# VinhHy.AudioTour

---

# 1. Project Information

## Project Name

VinhHy.AudioTour

---

## Project Type

Hệ thống quản lý và giới thiệu du lịch Vĩnh Hy gồm:

* Backend API
* Web Admin CMS
* Public Website

Mục tiêu là xây dựng nền tảng quản lý nội dung du lịch đa ngôn ngữ và cung cấp trải nghiệm tham quan trực tuyến cho du khách.

**Mobile App hiện đang tạm hoãn và không nằm trong phạm vi MVP hiện tại.**

---

# 2. Main Goals

Mục tiêu của hệ thống:

* hỗ trợ quảng bá du lịch Vĩnh Hy
* quản lý tập trung POI, Tour và nội dung đa ngôn ngữ
* cung cấp trải nghiệm tra cứu thông tin du lịch trực tuyến
* hỗ trợ QR Code cho từng điểm tham quan
* cung cấp dashboard thống kê quản trị
* xây dựng nền tảng có thể mở rộng cho Mobile App trong tương lai

---

# 3. Main Modules

## Backend API

Nền tảng:

* ASP.NET Core 9
* Entity Framework Core
* SQL Server

Chức năng:

* Authentication
* Authorization
* User Management
* Role Management
* POI Management
* Translation Management
* Tour Management
* QR Management
* Media Management
* Analytics

---

## Web Admin CMS

Nền tảng:

* React
* Vite
* TypeScript
* TailwindCSS

Chức năng:

* Login / Logout
* User Management
* Role Management
* POI CRUD
* Translation CRUD
* Tour CRUD
* QR CRUD
* Media Library
* Analytics Dashboard

---

## Public Website

Nền tảng:

* React
* Vite
* TypeScript
* TailwindCSS
* Leaflet
* OpenStreetMap

Chức năng:

* Home Page
* Tour Listing
* Tour Detail
* POI Listing
* POI Detail
* Search
* QR Landing Page
* Interactive Map
* Multi-language Content

---

# 4. Official Tech Stack

## Backend

* ASP.NET Core 9
* Entity Framework Core
* SQL Server
* JWT Authentication
* AutoMapper
* FluentValidation
* Serilog

---

## Web Admin

* React
* Vite
* TypeScript
* TailwindCSS
* React Query
* Axios

---

## Public Website

* React
* Vite
* TypeScript
* TailwindCSS
* React Query
* Axios
* Leaflet
* OpenStreetMap

---

# 5. Architecture Style

## Backend

* Lightweight Clean Architecture
* Feature-based Structure
* Repository Pattern
* Service Layer
* DTO Pattern
* Dependency Injection

---

## Frontend

* Feature-based Structure
* React Query
* Axios API Layer
* Reusable Components
* Protected Routes
* Layout-based Navigation

---

# 6. Current Folder Structure

```text
/docs
/backend
/web-admin
/web-public
/infrastructure
/shared
```

---

# 7. Main Features

## Authentication & Authorization

* JWT Authentication
* Refresh Token
* Role-based Authorization

---

## POI Management

* POI CRUD
* Translation CRUD
* Language Management
* Coordinates Management

---

## Tour Management

* Tour CRUD
* Tour Translation
* Tour POI Assignment
* Tour Route Management

---

## QR Management

* QR CRUD
* QR Resolve
* POI QR
* Tour QR

---

## Media Library

* Audio Upload
* Image Upload
* Media Storage
* Media Metadata

---

## Analytics Dashboard

* Visit Statistics
* QR Statistics
* Tour Statistics
* Content Statistics

---

## Public Website

* Tour Pages
* POI Pages
* Search
* Filtering
* Interactive Map
* QR Landing Pages

---

# 8. Core Entities

```text
User
Role

Poi
PoiTranslation

Tour
TourTranslation
TourPoi

Language

QrLocation

MediaFile

AnalyticsDaily

RefreshToken
```

---

# 9. Naming Convention

## C#

PascalCase

Ví dụ:

```text
TourService
PoiRepository
MediaController
QrService
```

---

## JSON

camelCase

Ví dụ:

```json
{
  "tourId": 1,
  "poiId": 10,
  "isActive": true
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
* thin controllers
* feature-based structure

---

## Forbidden

* CQRS
* MediatR
* GenericRepository
* UnitOfWork abstraction
* business logic in controller
* static mutable state
* inline SQL
* duplicated business logic
* over-engineering

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

# 12. Security Rules

## Authentication

* JWT Bearer Token
* Refresh Token

---

## Authorization

* SuperAdmin
* Admin
* ContentManager

---

## Protected Endpoints

Tất cả endpoint quản trị phải yêu cầu JWT hợp lệ.

---

# 13. Development Phases

## Phase 1

* Authentication
* User Management
* Role Management

---

## Phase 2

* POI CRUD
* Translation CRUD
* Language Management
* Map Integration

---

## Phase 3

* Tour CRUD
* QR CRUD
* Media Management

---

## Phase 4

* Analytics Dashboard
* Public Website
* Search & Filtering

---

# 14. Team Assignment

## Member 1

* Authentication
* Users
* Roles
* Authorization

---

## Member 2

* POI
* Translation
* Languages
* Map
* Public POI Pages

---

## Member 3

* Tours
* QR
* Media
* Analytics
* Public Tour Pages

---

# 15. AI Context Rules

Mọi AI phải đọc file này trước khi generate code.

AI phải:

* follow architecture hiện tại
* follow architecture decisions
* không tự đổi structure
* không over-engineering
* không thêm microservice
* không thêm CQRS
* không thêm MediatR
* không thêm GenericRepository
* không thêm UnitOfWork abstraction

---

## Current MVP Scope

Included:

* Backend API
* Web Admin CMS
* Public Website

Excluded:

* Mobile App
* Offline Sync
* Geofence
* GPS Tracking

Unless explicitly requested, AI should not generate Mobile App code.

---

# 16. Recommended Workflow

## Cursor / Codex

Dùng cho:

* implementation
* refactor
* generate code
* fix compile errors

---

## ChatGPT

Dùng cho:

* debugging
* architecture review
* optimization
* documentation
* planning

---

# 17. Important Notes

Đây là đồ án theo hướng:

* maintainable
* scalable
* AI-assisted engineering

Ưu tiên:

* simplicity
* maintainability
* development speed

Không hướng tới:

* microservice
* distributed architecture
* enterprise-scale complexity

---

Đây là file đầu tiên phải cung cấp cho AI trước khi generate code.
