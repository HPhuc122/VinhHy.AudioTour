# AI Context

Project: VinhHy.AudioTour

## Read First

Before generating any code, read:

1. docs/project-overview.md
2. docs/architecture/ARCHITECTURE_DECISIONS.md
3. docs/database/database-design.md
4. docs/api/API_CONTRACTS.md
5. docs/IMPLEMENTATION_PROGRESS.md

Additional:

Backend:

* docs/architecture/backend-architecture.md

CMS:

* docs/architecture/cms-architecture.md

Public Website:

* docs/architecture/public-web-architecture.md

---

## Current Focus

WEB ONLY

Active modules:

* Backend API
* CMS Admin
* Public Website

Ignore Mobile (.NET MAUI) unless explicitly requested.

---

## Backend Stack

* ASP.NET Core 9
* Entity Framework Core
* SQL Server
* JWT Authentication
* AutoMapper
* FluentValidation
* Serilog

Architecture:

Controller
→ Service
→ Repository
→ DbContext

---

## CMS Stack

* React
* Vite
* TypeScript
* TailwindCSS
* React Query
* Axios

Architecture:

Page
→ Hook
→ API
→ Axios

---

## Public Website Stack

* React
* Vite
* TypeScript
* TailwindCSS
* React Query
* Axios
* Leaflet
* OpenStreetMap

Architecture:

Page
→ Hook
→ API

---

## Patterns

Backend

* Repository Pattern
* Service Layer
* DTO Pattern
* Dependency Injection

Frontend

* Feature-based structure
* React Query for server state
* Reusable UI components

---

## Forbidden

Do NOT introduce:

* CQRS
* MediatR
* GenericRepository
* UnitOfWork
* Microservices
* Event Sourcing
* DDD Aggregates
* Over-engineered abstractions
* Static mutable state

Do NOT:

* change existing folder structure
* rename existing entities
* rename existing APIs
* move files without request
* introduce breaking changes

---

## Coding Rules

Always:

* use async/await
* use DTOs
* use dependency injection
* use typed API responses
* follow existing conventions

Before generating code:

1. Analyze existing implementation
2. List impacted files
3. Explain approach
4. Generate code

Never generate code first.

Always prefer extending existing code over creating new architecture.
