-- ============================================================
--  VinhHy.AudioTour — SQLite Mobile Schema
--  Target: .NET MAUI + SQLite-net-pcl
--  Note: SQLite uses dynamic typing; constraints are advisory
--        INTEGER PRIMARY KEY = alias for rowid (auto-increment)
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ============================================================
-- 1. USER SETTINGS (local only)
-- ============================================================
CREATE TABLE IF NOT EXISTS LocalSettings (
    Key         TEXT NOT NULL PRIMARY KEY,
    Value       TEXT NOT NULL,
    UpdatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 2. POIs (synced from server)
-- ============================================================
CREATE TABLE IF NOT EXISTS POIs (
    Id            INTEGER NOT NULL PRIMARY KEY,
    Code          TEXT    NOT NULL UNIQUE,
    Latitude      REAL    NOT NULL,
    Longitude     REAL    NOT NULL,
    RadiusMeters  REAL    NOT NULL DEFAULT 30,
    Priority      INTEGER NOT NULL DEFAULT 1,
    IsActive      INTEGER NOT NULL DEFAULT 1,  -- 0/1 boolean
    ImageUrl      TEXT,
    Category      TEXT,
    Version       INTEGER NOT NULL DEFAULT 1,
    UpdatedAt     TEXT    NOT NULL,
    SyncedAt      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- GPS bounding box fast-filter (Haversine needs CPU, pre-filter with index)
CREATE INDEX IF NOT EXISTS IX_POIs_LatLon
    ON POIs (Latitude, Longitude)
    WHERE IsActive = 1;

CREATE INDEX IF NOT EXISTS IX_POIs_UpdatedAt ON POIs (UpdatedAt);

-- ============================================================
-- 3. POI TRANSLATIONS (synced)
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
-- 4. AUDIO TRACKS (synced metadata only — file cached separately)
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
    IsDownloaded    INTEGER NOT NULL DEFAULT 0,   -- local cache flag
    LocalFilePath   TEXT,                          -- path in app storage
    Version         INTEGER NOT NULL DEFAULT 1,
    UpdatedAt       TEXT    NOT NULL,
    FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS IX_AudioTracks_POI_Lang
    ON AudioTracks (POIId, LanguageCode)
    WHERE IsActive = 1;

-- ============================================================
-- 5. TOURS (synced)
-- ============================================================
CREATE TABLE IF NOT EXISTS Tours (
    Id               INTEGER NOT NULL PRIMARY KEY,
    Code             TEXT    NOT NULL UNIQUE,
    DefaultLanguage  TEXT    NOT NULL DEFAULT 'vi',
    IsActive         INTEGER NOT NULL DEFAULT 1,
    EstimatedMinutes INTEGER,
    Version          INTEGER NOT NULL DEFAULT 1,
    UpdatedAt        TEXT    NOT NULL
);

-- ============================================================
-- 6. TOUR TRANSLATIONS (synced)
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
-- 7. TOUR POIS (synced)
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
-- 8. QR LOCATIONS (synced)
-- ============================================================
CREATE TABLE IF NOT EXISTS QRLocations (
    Id        INTEGER NOT NULL PRIMARY KEY,
    POIId     INTEGER NOT NULL,
    QRCode    TEXT    NOT NULL UNIQUE,
    Label     TEXT,
    IsActive  INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (POIId) REFERENCES POIs(Id)
);

CREATE INDEX IF NOT EXISTS IX_QRLocations_Code
    ON QRLocations (QRCode)
    WHERE IsActive = 1;

-- ============================================================
-- 9. NARRATION LOGS (local, queued for sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS NarrationLogs (
    Id                    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    ServerId              INTEGER,           -- NULL until synced
    POIId                 INTEGER NOT NULL,
    TriggerType           TEXT    NOT NULL,  -- 'gps' | 'qr' | 'manual'
    LanguageCode          TEXT    NOT NULL,
    PlayedAt              TEXT    NOT NULL DEFAULT (datetime('now')),
    DurationPlayedSeconds INTEGER,
    DeviceId              TEXT,
    Synced                INTEGER NOT NULL DEFAULT 0,  -- 0=pending, 1=synced
    SyncedAt              TEXT,
    FOREIGN KEY (POIId) REFERENCES POIs(Id)
);

CREATE INDEX IF NOT EXISTS IX_NarrationLogs_Pending
    ON NarrationLogs (Synced, PlayedAt)
    WHERE Synced = 0;

CREATE INDEX IF NOT EXISTS IX_NarrationLogs_POI
    ON NarrationLogs (POIId, PlayedAt DESC);

-- ============================================================
-- 10. OFFLINE PACKAGES (download management)
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
    DownloadedAt    TEXT,
    PublishedAt     TEXT    NOT NULL,
    UNIQUE (TourId, LanguageCode)
);

-- ============================================================
-- 11. GEOFENCE STATE (transient — resets on app restart)
-- ============================================================
CREATE TABLE IF NOT EXISTS GeofenceState (
    POIId             INTEGER NOT NULL PRIMARY KEY,
    LastTriggeredAt   TEXT,                     -- ISO-8601 UTC
    CooldownUntil     TEXT,                     -- ISO-8601 UTC
    EnteredAt         TEXT,                     -- for debounce
    IsInsideRadius    INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (POIId) REFERENCES POIs(Id)
);

-- ============================================================
-- 12. SYNC CURSOR (tracks last sync per entity)
-- ============================================================
CREATE TABLE IF NOT EXISTS SyncCursors (
    EntityType   TEXT NOT NULL PRIMARY KEY,  -- 'POI' | 'AudioTrack' | 'Tour' ...
    LastSyncedAt TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z'
);

-- Seed cursors
INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES
    ('POI'),
    ('AudioTrack'),
    ('Tour'),
    ('QRLocation'),
    ('OfflinePackage');

PRAGMA user_version = 1;  -- schema migration version