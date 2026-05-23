# EF Core Migrations

## Prerequisites

- .NET 9 SDK
- EF Core tools: `dotnet tool install --global dotnet-ef`

## Connection string

Configure in the API project `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=VinhHyAudioTourDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Secret": "your-development-secret-at-least-32-characters-long",
    "Issuer": "VinhHy.NarrationAPI",
    "Audience": "VinhHy.NarrationAPI"
  }
}
```

## Create / apply migrations

From the repository root:

```powershell
dotnet ef migrations add InitialCreate `
  --project backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/VinhHy.NarrationAPI.Infrastructure.csproj `
  --startup-project backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/VinhHy.NarrationAPI.Api.csproj `
  --output-dir Migrations

dotnet ef database update `
  --project backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Infrastructure/VinhHy.NarrationAPI.Infrastructure.csproj `
  --startup-project backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/VinhHy.NarrationAPI.Api.csproj
```

Alternatively, run `Data/Scripts/InitialSchema.sql` against SQL Server if EF tools are unavailable, then mark the database as migrated manually.

## Seed data

After migration, call `MigrateAndSeedAsync()` from startup or run the API once with seeding enabled. Default admin:

- Username: `admin`
- Password: `ChangeMe123!`

Change the password immediately in production.
