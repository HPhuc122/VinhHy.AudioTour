-- ============================================================
--  VinhHy.AudioTour — SQLite Mobile Schema (REVISED v2)
--  Target: .NET MAUI + SQLite-net-pcl
--
--  CHANGE LOG vs v1:
--  [NEW TABLE]   Languages          — language reference (local read-only)
--  [NEW TABLE]   Devices            — self-registration of this device
--  [NEW TABLE]   DeletedRecords     — tombstones from server sync
--  [CHANGED] POIs.Latitude/Longitude — REAL is fine for SQLite (matches
--             IEEE 754 double = same as SQL Server FLOAT; note server
--             uses DECIMAL(9,6) which maps to TEXT in SQLite-net; keep
--             REAL here and round to 6dp in application layer)
--  [CHANGED] POIs                  — added DeletedAt, CooldownSeconds,
--                                    MinDwellSeconds
--  [CHANGED] Tours                 — added DeletedAt
--  [CHANGED] AudioTracks           — added DeletedAt, UNIQUE enforced
--  [CHANGED] QRLocations           — added DeletedAt, ExpiresAt
--  [CHANGED] OfflinePackages       — UNIQUE now includes PackageVersion
--  [CHANGED] GeofenceState         — CooldownSeconds sourced from POIs
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ============================================================
-- 0. LOCAL SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS LocalSettings (
    Key       TEXT NOT NULL PRIMARY KEY,
    Value     TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 1. LANGUAGES  [NEW TABLE]
--    Synced once from server. Used by UI to populate language pickers.
-- ============================================================
CREATE TABLE IF NOT EXISTS Languages (
    -- [NEW TABLE]
    Code       TEXT    NOT NULL PRIMARY KEY,
    Name       TEXT    NOT NULL,
    NativeName TEXT    NOT NULL,
    IsActive   INTEGER NOT NULL DEFAULT 1,
    SortOrder  INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 2. DEVICES  [NEW TABLE]
--    Single-row table representing this device's registration.
--    DeviceId = client-generated UUID persisted in LocalSettings too.
-- ============================================================
CREATE TABLE IF NOT EXISTS DeviceRegistration (
    -- [NEW TABLE]
    DeviceId   TEXT    NOT NULL PRIMARY KEY,  -- UUID generated on first launch
    Platform   TEXT    NOT NULL,              -- 'android' | 'ios' | 'windows'
    AppVersion TEXT,
    OsVersion  TEXT,
    PushToken  TEXT,
    RegisteredAt TEXT  NOT NULL DEFAULT (datetime('now')),
    LastSyncedAt TEXT
);

-- ============================================================
-- 3. POIs  (synced from server)
--    [CHANGED] Added DeletedAt, CooldownSeconds, MinDwellSeconds
-- ============================================================
CREATE TABLE IF NOT EXISTS POIs (
    Id             INTEGER NOT NULL PRIMARY KEY,
    Code           TEXT    NOT NULL UNIQUE,
    Latitude       REAL    NOT NULL,
    Longitude      REAL    NOT NULL,
    RadiusMeters   REAL    NOT NULL DEFAULT 30,
    Priority       INTEGER NOT NULL DEFAULT 1,
    IsActive       INTEGER NOT NULL DEFAULT 1,
    ImageUrl       TEXT,
    Category       TEXT,
    -- [NEW COLS] Geofence config from server
    CooldownSeconds  INTEGER NOT NULL DEFAULT 300,
    MinDwellSeconds  INTEGER NOT NULL DEFAULT 5,
    -- [NEW COL] Soft-delete — if set, remove from geofence monitoring
    DeletedAt      TEXT,
    Version        INTEGER NOT NULL DEFAULT 1,
    UpdatedAt      TEXT    NOT NULL,
    SyncedAt       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS IX_POIs_LatLon
    ON POIs (Latitude, Longitude)
    WHERE IsActive = 1 AND DeletedAt IS NULL;

CREATE INDEX IF NOT EXISTS IX_POIs_UpdatedAt ON POIs (UpdatedAt);

-- ============================================================
-- 4. POI TRANSLATIONS (synced)
-- ============================================================
CREATE TABLE IF NOT EXISTS POITranslations (
    Id               INTEGER NOT NULL PRIMARY KEY,
    POIId            INTEGER NOT NULL,
    LanguageCode     TEXT    NOT NULL,
    Name             TEXT    NOT NULL,
    Description      TEXT    NOT NULL,
    ShortDescription TEXT,
    Version          INTEGER NOT NULL DEFAULT 1,
    UpdatedAt        TEXT    NOT NULL,
    FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE,
    UNIQUE (POIId, LanguageCode)
);

CREATE INDEX IF NOT EXISTS IX_POITranslations_Lang ON POITranslations (LanguageCode);

-- ============================================================
-- 5. AUDIO TRACKS  (synced metadata — file cached separately)
--    [CHANGED] Added DeletedAt
--    [CHANGED] Added UNIQUE (POIId, LanguageCode) to match server
-- ============================================================
CREATE TABLE IF NOT EXISTS AudioTracks (
    Id              INTEGER NOT NULL PRIMARY KEY,
    POIId           INTEGER NOT NULL,
    LanguageCode    TEXT    NOT NULL,
    AudioType       TEXT    NOT NULL DEFAULT 'tts',
    FileUrl         TEXT,
    TTSText         TEXT,
    DurationSeconds INTEGER,
    FileSizeBytes   INTEGER,
    MimeType        TEXT    DEFAULT 'audio/mp4',
    IsActive        INTEGER NOT NULL DEFAULT 1,
    IsDownloaded    INTEGER NOT NULL DEFAULT 0,
    LocalFilePath   TEXT,
    -- [NEW COL] Soft-delete — evict from cache if set
    DeletedAt       TEXT,
    Version         INTEGER NOT NULL DEFAULT 1,
    UpdatedAt       TEXT    NOT NULL,
    FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE,
    -- [NEW CONSTRAINT] Matches server unique constraint
    UNIQUE (POIId, LanguageCode)
);

CREATE INDEX IF NOT EXISTS IX_AudioTracks_POI_Lang
    ON AudioTracks (POIId, LanguageCode)
    WHERE IsActive = 1 AND DeletedAt IS NULL;

-- ============================================================
-- 6. TOURS (synced)
--    [CHANGED] Added DeletedAt
-- ============================================================
CREATE TABLE IF NOT EXISTS Tours (
    Id               INTEGER NOT NULL PRIMARY KEY,
    Code             TEXT    NOT NULL UNIQUE,
    DefaultLanguage  TEXT    NOT NULL DEFAULT 'vi',
    IsActive         INTEGER NOT NULL DEFAULT 1,
    EstimatedMinutes INTEGER,
    -- [NEW COL]
    DeletedAt        TEXT,
    Version          INTEGER NOT NULL DEFAULT 1,
    UpdatedAt        TEXT    NOT NULL
);

-- ============================================================
-- 7. TOUR TRANSLATIONS (synced)
-- ============================================================
CREATE TABLE IF NOT EXISTS TourTranslations (
    Id           INTEGER NOT NULL PRIMARY KEY,
    TourId       INTEGER NOT NULL,
    LanguageCode TEXT    NOT NULL,
    Name         TEXT    NOT NULL,
    Description  TEXT,
    FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE,
    UNIQUE (TourId, LanguageCode)
);

-- ============================================================
-- 8. TOUR POIS (synced)
-- ============================================================
CREATE TABLE IF NOT EXISTS TourPOIs (
    Id         INTEGER NOT NULL PRIMARY KEY,
    TourId     INTEGER NOT NULL,
    POIId      INTEGER NOT NULL,
    OrderIndex INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE,
    FOREIGN KEY (POIId)  REFERENCES POIs(Id),
    UNIQUE (TourId, POIId)
);

-- ============================================================
-- 9. QR LOCATIONS (synced)
--    [CHANGED] Added DeletedAt, ExpiresAt (was missing from v1 mobile schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS QRLocations (
    Id        INTEGER NOT NULL PRIMARY KEY,
    POIId     INTEGER NOT NULL,
    QRCode    TEXT    NOT NULL UNIQUE,
    Label     TEXT,
    IsActive  INTEGER NOT NULL DEFAULT 1,
    -- [NEW COL] Soft-delete
    DeletedAt TEXT,
    -- [NEW COL] Expiry enforcement offline (was on server only in v1)
    ExpiresAt TEXT,
    FOREIGN KEY (POIId) REFERENCES POIs(Id)
);

CREATE INDEX IF NOT EXISTS IX_QRLocations_Code
    ON QRLocations (QRCode)
    WHERE IsActive = 1 AND DeletedAt IS NULL;

-- ============================================================
-- 10. NARRATION LOGS (local, queued for sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS NarrationLogs (
    Id                    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    ServerId              INTEGER,
    POIId                 INTEGER NOT NULL,
    TriggerType           TEXT    NOT NULL,
    LanguageCode          TEXT    NOT NULL,
    PlayedAt              TEXT    NOT NULL DEFAULT (datetime('now')),
    DurationPlayedSeconds INTEGER,
    DeviceId              TEXT,
    Synced                INTEGER NOT NULL DEFAULT 0,
    SyncedAt              TEXT,
    FOREIGN KEY (POIId) REFERENCES POIs(Id)
);

CREATE INDEX IF NOT EXISTS IX_NarrationLogs_Pending
    ON NarrationLogs (Synced, PlayedAt)
    WHERE Synced = 0;

CREATE INDEX IF NOT EXISTS IX_NarrationLogs_POI
    ON NarrationLogs (POIId, PlayedAt DESC);

-- ============================================================
-- 11. OFFLINE PACKAGES (download management)
--     [CHANGED] UNIQUE now includes PackageVersion
--               so multiple versions can coexist on device
--               (allows upgrade from v1→v2 without deleting v1 first)
-- ============================================================
CREATE TABLE IF NOT EXISTS OfflinePackages (
    Id              INTEGER NOT NULL PRIMARY KEY,
    TourId          INTEGER NOT NULL,
    LanguageCode    TEXT    NOT NULL,
    PackageVersion  TEXT    NOT NULL,
    DownloadUrl     TEXT    NOT NULL,
    FileSizeBytes   INTEGER NOT NULL DEFAULT 0,
    Checksum        TEXT,
    IsDownloaded    INTEGER NOT NULL DEFAULT 0,
    IsActive        INTEGER NOT NULL DEFAULT 1,
    DownloadedAt    TEXT,
    PublishedAt     TEXT    NOT NULL,
    -- [CHANGED] Was UNIQUE(TourId, LanguageCode) — now includes version
    UNIQUE (TourId, LanguageCode, PackageVersion)
);

-- ============================================================
-- 12. DELETED RECORDS (Sync Tombstone)  [NEW TABLE]
--     Populated by sync service when server returns tombstones.
--     App reads this to clean up local POIs/Tours/AudioTracks.
-- ============================================================
CREATE TABLE IF NOT EXISTS DeletedRecords (
    -- [NEW TABLE]
    Id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    EntityType TEXT    NOT NULL,   -- 'POI' | 'AudioTrack' | 'Tour' | 'QRLocation'
    EntityId   INTEGER NOT NULL,
    DeletedAt  TEXT    NOT NULL,   -- server-side deletion timestamp
    ProcessedAt TEXT               -- when mobile actually removed the row
);

CREATE INDEX IF NOT EXISTS IX_DeletedRecords_Pending
    ON DeletedRecords (EntityType, EntityId)
    WHERE ProcessedAt IS NULL;

-- ============================================================
-- 13. GEOFENCE STATE (transient — resets on app restart)
--     [CHANGED] CooldownUntil now computed from POIs.CooldownSeconds
--               rather than a hardcoded app constant.
-- ============================================================
CREATE TABLE IF NOT EXISTS GeofenceState (
    POIId           INTEGER NOT NULL PRIMARY KEY,
    LastTriggeredAt TEXT,
    CooldownUntil   TEXT,   -- computed: LastTriggeredAt + POIs.CooldownSeconds
    EnteredAt       TEXT,
    IsInsideRadius  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (POIId) REFERENCES POIs(Id)
);

-- ============================================================
-- 14. SYNC CURSORS (tracks last sync per entity type)
-- ============================================================
CREATE TABLE IF NOT EXISTS SyncCursors (
    EntityType   TEXT NOT NULL PRIMARY KEY,
    LastSyncedAt TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z'
);

INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES
    ('POI'),
    ('AudioTrack'),
    ('Tour'),
    ('QRLocation'),
    ('OfflinePackage'),
    ('Language'),
    ('DeletedRecord');

PRAGMA user_version = 2;  -- schema migration version (bumped from 1 → 2)