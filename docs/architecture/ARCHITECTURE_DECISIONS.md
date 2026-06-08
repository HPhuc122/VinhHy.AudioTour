# Architecture Decisions — VinhHyNarrationAPI

This document records intentional design choices for the backend API. It aligns with `docs/project-overview.md` and `docs/database/database-design.md`.

## ADR-001: Lightweight Clean Architecture (four projects)

**Decision:** Use Domain → Application → Infrastructure → Api without CQRS, MediatR, or microservices.

**Rationale:** Matches project rules: simplicity, maintainability, AI-assisted velocity. Boundaries are clear without ceremony.

**Consequences:** Controllers stay thin; business logic lives in Infrastructure service classes behind Application interfaces.

---

## ADR-002: Feature-based Application layer

**Decision:** Organize DTOs and validators under `Application/Features/{FeatureName}`.

**Rationale:** Easier navigation than technical folders-only; scales with POI, Tour, Sync modules.

---

## ADR-003: Concrete repositories (no generic repository)

**Decision:** One interface + one implementation per aggregate area (`IPoiRepository`, `ITourRepository`, …).

**Rationale:** Avoids “generic repository abstraction hell” from project constraints. Queries stay explicit and readable.

---

## ADR-004: SQL Server as source of truth; SQLite is mobile-only

**Decision:** API uses EF Core + SQL Server only. No SQLite provider in the API host.

**Rationale:** SQLite schema in `docs/database/sqlite/` is for MAUI offline cache, not server storage.

---

## ADR-005: No FK from `LanguageCode` to `Languages`

**Decision:** EF configurations do not create FK relationships on `LanguageCode` columns.

**Rationale:** Reduces sync coupling; mobile may not have full language seed; matches physical SQL schema strategy.

**Validation:** Service layer and FluentValidation (extend as needed).

---

## ADR-006: Soft delete + tombstone sync

**Decision:** Use `DeletedAt` on syncable entities and insert rows into `DeletedRecords` on delete.

**Rationale:** Supports offline-first mobile purge via sync pull without full re-download.

**Implementation:** `SoftDeleteService` + global query filters on main content entities.

---

## ADR-007: Version + UpdatedAt for incremental sync

**Decision:** `IVersionedEntity` on POI, Tour, AudioTrack, POI translations; sync API filters by `since` timestamp.

**Rationale:** Matches database design and mobile `SyncCursors` strategy.

---

## ADR-008: Geofence configuration on POI

**Decision:** No separate `GeofenceConfigs` table in API model; expose `RadiusMeters`, `CooldownSeconds`, `MinDwellSeconds`, `Priority` via `/api/v1/geofence`.

**Rationale:** SQL schema v2 inlined geofence columns on `POIs`; avoids duplicate configuration surfaces.

---

## ADR-009: Standard API envelope

**Decision:** All responses use `ApiResponse<T>` with `success`, `message`, `data`, optional `errors`.

**Rationale:** Consistent contract for MAUI and CMS clients; JSON camelCase via ASP.NET configuration.

---

## ADR-010: JWT authentication with role claims

**Decision:** ASP.NET Core JWT Bearer; roles from `Roles` table emitted as `ClaimTypes.Role`.

**Rationale:** Simple RBAC for CMS (`SuperAdmin`, `ContentAdmin`, etc.) without ASP.NET Identity overhead for MVP.

**Swagger:** HTTP Bearer security scheme on all operations; authorize per controller/action.

---

## ADR-011: AutoMapper in Application layer only

**Decision:** `MappingProfile` in Application; register via `AddAutoMapper` in `AddApplication()`.

**Rationale:** Infrastructure consumes `IMapper` but does not own mapping rules. Prevents duplicate `MapperConfiguration` singletons.

---

## ADR-012: Exception middleware

**Decision:** `ExceptionHandlingMiddleware` maps `AppException`, `ValidationException`, `NotFoundException` to HTTP status + envelope.

**Rationale:** Controllers do not catch exceptions; consistent error shape.

---

## ADR-013: Serilog structured logging

**Decision:** Host uses Serilog from configuration; `UseSerilogRequestLogging` for HTTP traces.

**Rationale:** Project tech stack requirement; supports file + console sinks.

---

## ADR-014: Health endpoints

**Decision:** `/health` (all checks) and `/health/ready` (tagged DB check).

**Rationale:** Deployment and smoke tests; EF `AddDbContextCheck` for readiness.

---

## ADR-015: Domain base types

**Decision:** Introduce `BaseEntity`, `AuditableEntity`, `SyncableEntity` for shared columns.

**Rationale:** Reduces duplication on POI/Tour/AudioTrack; keeps marker interfaces for services like `SoftDeleteService`.

**Note:** Not all entities inherit (e.g. `QrLocation`, `AuditLog`) to match SQL shape.

---

## ADR-016: EF migrations as schema delivery

**Decision:** EF migrations in Infrastructure; optional raw SQL script under `Data/Scripts/` for DBA-led deploys.

**Rationale:** Developer workflow uses `dotnet ef`; production may apply scripted schema from repo docs.

---

## ADR-017: Smoke tests with in-memory database

**Decision:** `appsettings.Testing.json` sets `UseInMemoryDatabase: true`; shared `WebApplicationFactory` fixture.

**Rationale:** Fast CI-friendly tests without SQL Server; validates DI, mapping, auth, health.

**Trade-off:** Not a substitute for SQL Server integration tests.

---

## Rejected alternatives

| Alternative | Reason rejected |
|-------------|-----------------|
| CQRS / MediatR | Explicitly forbidden by project rules |
| Generic `IRepository<T>` | Over-abstraction; harder to optimize queries |
| Microservices | Out of scope for VinhHy.AudioTour MVP |
| ASP.NET Identity | JWT + custom user table sufficient for current scope |
| Separate GeofenceConfigs entity | Not in SQL schema v2 |
