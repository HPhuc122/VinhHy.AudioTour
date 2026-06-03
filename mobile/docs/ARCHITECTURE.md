# Mobile Architecture

Project: VinhHy.AudioTour.Mobile

## Architecture Style

* MVVM
* Service Layer
* Repository Pattern
* Offline-first
* Dependency Injection

The project intentionally does NOT use:

* CQRS
* MediatR
* Event Sourcing
* Unit Of Work
* Generic Repository

---

## Solution Structure

src/

VinhHy.AudioTour.Mobile.Core

* Contracts
* Models
* Constants
* Exceptions

VinhHy.AudioTour.Mobile.Data

* Database
* Entities
* Repositories
* Mapping

VinhHy.AudioTour.Mobile

* Services
* ViewModels
* Views
* DependencyInjection
* Http

---

## Dependency Direction

Mobile
↓
Data
↓
Core

Core must not reference Data.

Data must not reference Mobile.

---

## Repository Rules

Repositories:

* Access SQLite only
* No business logic
* No HTTP calls

---

## Service Rules

Services:

* Contain application logic
* Coordinate repositories
* Coordinate API clients

Services may depend on:

* Repositories
* Other services

---

## ViewModel Rules

ViewModels:

* Depend on services only
* Must not access repositories directly
* Must not access SQLite directly

---

## Authentication

AuthService

* Login
* Refresh
* Logout

AuthSessionProvider

* Runtime session

SecureAuthTokenStore

* SecureStorage persistence

JWT tokens must never be stored in SQLite.

---

## Synchronization

Pull-first strategy.

Flow:

Pull
→ Apply local changes
→ Update cursors
→ Push narration logs

---

## Geofence Status

Not implemented.

Only infrastructure exists:

* GeofenceState table
* GeofenceState repository
* GPS abstraction

No runtime geofence engine yet.
