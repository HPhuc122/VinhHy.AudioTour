# VinhHyNarrationAPI

ASP.NET Core 9 Web API for **VinhHy.AudioTour** — POI narration, tours, offline sync, QR activation, and analytics.

## Architecture

Lightweight Clean Architecture with four projects:

| Project | Responsibility |
|---------|----------------|
| `VinhHy.NarrationAPI.Domain` | Entities, constants, domain interfaces |
| `VinhHy.NarrationAPI.Application` | DTOs, validators, service/repository contracts, AutoMapper |
| `VinhHy.NarrationAPI.Infrastructure` | EF Core, repositories, service implementations, JWT, seeding |
| `VinhHy.NarrationAPI.Api` | Controllers, middleware, Swagger, Serilog |

**Design choices**

- Feature-based folders under `Application/Features` and `Api/Controllers`
- No CQRS, MediatR, or generic repository base classes
- SQL Server is source of truth; `LanguageCode` has no FK to `Languages` (validated in services)
- Soft delete via `DeletedAt` + `DeletedRecords` tombstones for mobile sync
- Incremental sync via `UpdatedAt` + `Version` on syncable entities

## Prerequisites

- .NET 9 SDK
- SQL Server 2019+ (or LocalDB)

## Configuration

Edit `src/VinhHy.NarrationAPI.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=VinhHyAudioTourDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Secret": "your-256-bit-minimum-secret-key-here",
    "Issuer": "VinhHy.NarrationAPI",
    "Audience": "VinhHy.AudioTour",
    "AccessTokenMinutes": 60,
    "RefreshTokenDays": 7
  }
}
```

## Run

```bash
cd backend/VinhHyNarrationAPI
dotnet restore
dotnet build
dotnet run --project src/VinhHy.NarrationAPI.Api
```

Development startup applies migrations and seeds:

- Roles: SuperAdmin, ContentAdmin, TourOperator, AnalyticsViewer, Guest
- Languages: vi, en, zh, ko, ja, fr
- Admin user: `admin` / `ChangeMe123!`

Swagger: `https://localhost:7022/swagger`

## Database migrations

```bash
dotnet ef migrations add InitialCreate \
  --project src/VinhHy.NarrationAPI.Infrastructure \
  --startup-project src/VinhHy.NarrationAPI.Api \
  --output-dir Migrations

dotnet ef database update \
  --project src/VinhHy.NarrationAPI.Infrastructure \
  --startup-project src/VinhHy.NarrationAPI.Api
```

Alternatively apply `docs/database/sqlserver/schema.sql` and treat EF migrations as optional.

## API modules

| Route prefix | Module |
|--------------|--------|
| `/api/v1/auth` | JWT login, refresh, device registration |
| `/api/v1/users` | User & role management |
| `/api/v1/languages` | Language reference |
| `/api/v1/devices` | Mobile device registry |
| `/api/v1/pois` | POI CRUD |
| `/api/v1/poi-translations` | POI translations |
| `/api/v1/tours` | Tours, translations, POI ordering |
| `/api/v1/audio` | Audio tracks |
| `/api/v1/qr` | QR activation |
| `/api/v1/sync` | Incremental pull/push |
| `/api/v1/offline-packages` | Offline package publishing |
| `/api/v1/analytics` | Daily analytics |
| `/api/v1/narration-logs` | Narration logging |
| `/api/v1/geofence` | Per-POI geofence tuning |

Sample requests: [docs/sample-api-requests.md](docs/sample-api-requests.md)

## Documentation

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION_PROGRESS.md](docs/IMPLEMENTATION_PROGRESS.md) | Module status and next steps |
| [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Limitations and mitigations |
| [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) | ADR-style design record |

## Tests

```bash
dotnet test tests/VinhHy.NarrationAPI.SmokeTests
```

Smoke tests cover health endpoints, login, languages, DI, and AutoMapper validation (in-memory DB).

## Response format

```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

Paged lists wrap `PagedResult<T>` inside `data`.
