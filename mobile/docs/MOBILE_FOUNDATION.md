# VinhHy.AudioTour — Mobile Foundation

Offline-first MAUI foundation aligned with `docs/database/sqlite/mobile_offline_schema.sql` and the stabilized Narration API.

## Solution layout

```text
mobile/
├── VinhHy.AudioTour.Mobile.sln
├── docs/MOBILE_FOUNDATION.md
└── src/
    ├── VinhHy.AudioTour.Mobile.Core/     # Contracts, DTOs, domain models
    ├── VinhHy.AudioTour.Mobile.Data/     # SQLite, repositories, schema
    └── VinhHy.AudioTour.Mobile/         # MAUI app, services, MVVM, Shell
```

## Architecture

| Layer | Responsibility |
|-------|----------------|
| **Core** | Interfaces, API DTOs, local models, constants — no platform code |
| **Data** | `SQLiteAsyncConnection`, entities, repositories, schema/migrations |
| **Mobile** | MAUI UI, service implementations, HTTP client, DI composition |

Patterns: **MVVM** (CommunityToolkit.Mvvm), **Repository** (concrete per aggregate), **Service layer**, **DI** (built-in `Microsoft.Extensions.DependencyInjection`).

Explicitly **not** used: CQRS, MediatR, generic repository, UnitOfWork.

## SQLite

- **Access:** `LocalDatabase` wraps `SQLiteAsyncConnection` with `SemaphoreSlim` + `FullMutex`
- **Initialization:** `ILocalDatabaseInitializer` on app bootstrap (WAL, FK, bootstrap DDL)
- **Migrations:** `LocalDatabaseMigrator` via `PRAGMA user_version` (currently v2)
- **Data access:** repositories only — ViewModels never touch SQLite directly

### Local-only extension

`SyncRetryQueue` table stores failed sync operations for exponential backoff (not in server schema).

## Synchronization (pull-first)

```text
OfflineSyncCoordinator
    │
    ├─► ISyncService.PullAsync (api/v1/sync/pull)
    ├─► Apply POIs, translations, audio, tours, languages, QR, packages
    ├─► Process DeletedRecords tombstones
    ├─► Update SyncCursors per entity type
    └─► Push pending NarrationLogs (api/v1/sync/push)

On failure → SyncRetryQueue
On connectivity restored → ProcessRetryQueueAsync
```

**HTTP retries:** Polly on `NarrationApiClient` (transient errors).

## Authentication (foundation)

| Component | Purpose |
|-----------|---------|
| `IAuthService` | Login, refresh, logout, session restore |
| `IAuthTokenStore` | `SecureStorage` JSON persistence (`vinhhy.auth.session`) |
| `IAuthSessionProvider` | In-memory access token for HTTP pipeline |
| `AuthenticatedHttpMessageHandler` | Bearer header + 401 → refresh → single retry |
| `HttpClientNames.Auth` | Plain client for `/api/v1/auth/*` (no bearer) |
| `HttpClientNames.Api` | Authenticated API traffic via `IApiClient` |

Bootstrap calls `IAuthService.RestoreSessionAsync()` before sync. Login UI is not implemented yet — call `IAuthService.LoginAsync` from tests or future settings/dev hook.

## Service abstractions (foundation only)

| Interface | Implementation | Purpose |
|-----------|----------------|---------|
| `IAudioPlaybackService` | `AudioPlaybackService` | Plugin.Maui.Audio wrapper — local/remote file play |
| `IGpsTrackingService` | `GpsTrackingService` | MAUI Geolocation listener — **no geofence math** |
| `IBackgroundTourService` | `BackgroundTourService` | Active tour session placeholder |
| `IOfflineSyncCoordinator` | `OfflineSyncCoordinatorService` | Pull-first sync + retry queue |
| `ISyncService` | `SyncOrchestratorService` | API pull/push + SQLite apply |
| `INarrationLogQueueService` | `NarrationLogQueueService` | Local narration log outbox |
| `IConnectivityMonitor` | `ConnectivityMonitorService` | Online/offline events |
| `IDeviceIdentityService` | `DeviceIdentityService` | Stable device UUID |
| `ILocalSettingsService` | `LocalSettingsService` | Key/value preferences |
| `IAppBootstrapService` | `AppBootstrapService` | DB init, device, connectivity, initial sync |

## Shell navigation

`AppShell` registers a **TabBar** with:

- **Home** — foundation status / placeholder
- **Sync** — manual sync + cursor status
- **Settings** — language & API-related preferences

Routes: `home`, `sync`, `settings`.

## Configuration

`Resources/Raw/appsettings.json`:

```json
{
  "Api": {
    "BaseUrl": "https://10.0.2.2:7022",
    "TimeoutSeconds": 30
  }
}
```

Use `10.0.2.2` for Android emulator → host machine API.

## Build

```bash
# Class libraries (always)
dotnet build mobile/src/VinhHy.AudioTour.Mobile.Core
dotnet build mobile/src/VinhHy.AudioTour.Mobile.Data

# Full MAUI (requires workloads)
dotnet build mobile/src/VinhHy.AudioTour.Mobile -f net9.0-android
```

## Out of scope (next phases)

- GeofenceEngine / Haversine / debounce / priority resolver
- Maps (Mapsui / Mapbox)
- QR scanner UI (ZXing)
- Offline package download manager
- TTS integration

## Default bootstrap flow

1. `App.OnStart` → `IAppBootstrapService.BootstrapAsync`
2. Initialize SQLite + seed `SyncCursors`
3. Register device identity
4. Start connectivity monitor + sync coordinator
5. If online → pull-first sync (failures queued for retry)
