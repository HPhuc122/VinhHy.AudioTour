# Known Issues — VinhHyNarrationAPI

Last updated: 2026-05-22

## Security & dependencies

### AutoMapper advisory (NU1903)

- **Package:** AutoMapper 12.0.1
- **Advisory:** [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x)
- **Impact:** Build warning only; no runtime failure
- **Mitigation:** Monitor AutoMapper releases; upgrade when a fixed 12.x or compatible 13.x + extensions pair is available

### Default admin credentials

- **Issue:** Development seed creates `admin` / `ChangeMe123!`
- **Mitigation:** Change password immediately; do not deploy seed to production without overrides

### JWT secret placeholder

- **Issue:** `appsettings.json` ships with `CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY...`
- **Mitigation:** Use User Secrets, environment variables, or Azure Key Vault in non-dev environments

## Database & EF Core

### In-memory vs SQL Server in tests

- **Issue:** Smoke tests use EF InMemory; behavior can differ from SQL Server (constraints, filters)
- **Mitigation:** Add optional SQL Server integration tests in CI when a test database is available

### Global soft-delete filters

- **Issue:** `Poi`, `Tour`, `AudioTrack`, `QrLocation` hide `DeletedAt != null` by default
- **Impact:** Admin “show deleted” must call repositories with `IgnoreQueryFilters()` (sync layer already does)
- **Status:** By design

### `GeofenceConfigs` table

- **Issue:** Design doc mentions a separate geofence table; SQL schema stores tuning on `POIs`
- **Status:** API `/api/v1/geofence` maps to POI fields intentionally

### QrLocation audit fields

- **Issue:** `QRLocations` has `CreatedAt` only (no `UpdatedAt` in SQL schema)
- **Status:** Entity does not implement full `IAuditableEntity`; soft-delete does not bump `UpdatedAt`

## API & operations

### HTTPS redirection in tests

- **Issue:** `UseHttpsRedirection` is enabled; test client uses default handler (usually fine)
- **Status:** No failures observed in smoke tests

### Swagger only in Development

- **Issue:** Swagger UI is not enabled in Production/Staging
- **Mitigation:** Use OpenAPI export at build time or enable Swagger in staging behind auth if needed

### Health check and SQL Server

- **Issue:** `/health/ready` includes EF database check; fails if connection string is invalid
- **Mitigation:** Expected for orchestrators (K8s readiness)

## Mobile sync (integration)

### Not yet validated end-to-end

- Mobile MAUI client sync against live API not exercised in this repo phase
- **Risk:** DTO field naming or cursor semantics may need adjustment after first mobile integration test

### `LanguageCode` without FK

- **Issue:** Invalid language codes can be inserted at DB level
- **Mitigation:** Validate in application services before create/update (partial coverage; extend validators as needed)

## Resolved in stabilization phase

| Issue | Resolution |
|-------|------------|
| Duplicate AutoMapper registration | Removed manual `MapperConfiguration` from Infrastructure; Application `AddAutoMapper` only |
| Seeder `FirstAsync` on empty roles | Intermediate `SaveChangesAsync` after role/language seed |
| `Tour` → `TourDto` unmapped `Pois` | Map from `TourPois` in `MappingProfile` |
| `IAuditableEntity` missing `UpdatedAt` | Added to interface; removed incorrect use on `AuditLog` / `ContentVersion` |
| Test host Serilog “frozen logger” | Removed bootstrap logger; shared `WebApplicationFactory` collection |
| Dual EF providers in tests | `UseInMemoryDatabase` flag in `appsettings.Testing.json` |
