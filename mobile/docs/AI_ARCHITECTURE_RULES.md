# AI Architecture Rules

These rules are mandatory.

## Existing Architecture

Use the existing architecture.

Do not introduce new architecture patterns.

---

## Forbidden Patterns

Do NOT add:

* CQRS
* MediatR
* Event Sourcing
* Unit Of Work
* Generic Repository
* Domain Events
* Shared Kernel
* Vertical Slice Architecture

---

## Folder Rules

Allowed folders:

Core

* Contracts
* Models
* Constants
* Exceptions

Data

* Database
* Entities
* Repositories
* Mapping

Mobile

* Services
* ViewModels
* Views
* Http
* DependencyInjection

Do NOT create:

* Application
* Domain
* Infrastructure
* Shared
* Common
* Abstractions

without explicit approval.

---

## ViewModel Rules

ViewModels may depend on:

* Services

ViewModels may NOT depend on:

* Repositories
* SQLite
* HttpClient

---

## Repository Rules

Repositories:

* SQLite access only

Repositories must not:

* Call HTTP APIs
* Contain business logic

---

## Service Rules

Business logic belongs in services.

Services coordinate:

* Repositories
* API clients
* Sync operations

---

## Database Rules

Use sqlite-net-pcl.

Do not replace with:

* EF Core
* Realm
* LiteDB

without approval.

---

## Authentication Rules

JWT tokens:

* SecureStorage only

Never store:

* AccessToken
* RefreshToken

inside SQLite.

---

## Geofence Rules

Current phase:

Mobile Foundation.

Do NOT implement:

* Geofence engine
* Haversine calculations
* Background location processing

until explicitly requested.
