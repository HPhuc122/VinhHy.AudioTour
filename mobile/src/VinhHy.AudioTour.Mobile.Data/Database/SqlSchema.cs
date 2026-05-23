namespace VinhHy.AudioTour.Mobile.Data.Database;

public static class SqlSchema
{
    public const int UserVersion = 2;

    public static string[] GetBootstrapStatements() =>
    [
        """
        CREATE TABLE IF NOT EXISTS LocalSettings (
            Key       TEXT NOT NULL PRIMARY KEY,
            Value     TEXT NOT NULL,
            UpdatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS DeviceRegistration (
            DeviceId     TEXT NOT NULL PRIMARY KEY,
            Platform     TEXT NOT NULL,
            AppVersion   TEXT,
            OsVersion    TEXT,
            PushToken    TEXT,
            RegisteredAt TEXT NOT NULL DEFAULT (datetime('now')),
            LastSyncedAt TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS POIs (
            Id              INTEGER NOT NULL PRIMARY KEY,
            Code            TEXT    NOT NULL UNIQUE,
            Latitude        REAL    NOT NULL,
            Longitude       REAL    NOT NULL,
            RadiusMeters    REAL    NOT NULL DEFAULT 30,
            Priority        INTEGER NOT NULL DEFAULT 1,
            IsActive        INTEGER NOT NULL DEFAULT 1,
            ImageUrl        TEXT,
            Category        TEXT,
            CooldownSeconds INTEGER NOT NULL DEFAULT 300,
            MinDwellSeconds INTEGER NOT NULL DEFAULT 5,
            DeletedAt       TEXT,
            Version         INTEGER NOT NULL DEFAULT 1,
            UpdatedAt       TEXT    NOT NULL,
            SyncedAt        TEXT    NOT NULL DEFAULT (datetime('now'))
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_POIs_LatLon
            ON POIs (Latitude, Longitude)
            WHERE IsActive = 1 AND DeletedAt IS NULL;
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_POIs_UpdatedAt ON POIs (UpdatedAt);
        """,
        """
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
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_POITranslations_Lang ON POITranslations (LanguageCode);
        """,
        """
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
            DeletedAt       TEXT,
            Version         INTEGER NOT NULL DEFAULT 1,
            UpdatedAt       TEXT    NOT NULL,
            FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE,
            UNIQUE (POIId, LanguageCode)
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_AudioTracks_POI_Lang
            ON AudioTracks (POIId, LanguageCode)
            WHERE IsActive = 1 AND DeletedAt IS NULL;
        """,
        """
        CREATE TABLE IF NOT EXISTS Tours (
            Id               INTEGER NOT NULL PRIMARY KEY,
            Code             TEXT    NOT NULL UNIQUE,
            DefaultLanguage  TEXT    NOT NULL DEFAULT 'vi',
            IsActive         INTEGER NOT NULL DEFAULT 1,
            EstimatedMinutes INTEGER,
            DeletedAt        TEXT,
            Version          INTEGER NOT NULL DEFAULT 1,
            UpdatedAt        TEXT    NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS TourTranslations (
            Id           INTEGER NOT NULL PRIMARY KEY,
            TourId       INTEGER NOT NULL,
            LanguageCode TEXT    NOT NULL,
            Name         TEXT    NOT NULL,
            Description  TEXT,
            FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE,
            UNIQUE (TourId, LanguageCode)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS OfflinePackages (
            Id             INTEGER NOT NULL PRIMARY KEY,
            TourId         INTEGER NOT NULL,
            LanguageCode   TEXT    NOT NULL,
            PackageVersion TEXT    NOT NULL,
            DownloadUrl    TEXT    NOT NULL,
            FileSizeBytes  INTEGER NOT NULL DEFAULT 0,
            Checksum       TEXT,
            IsDownloaded   INTEGER NOT NULL DEFAULT 0,
            IsActive       INTEGER NOT NULL DEFAULT 1,
            DownloadedAt   TEXT,
            PublishedAt    TEXT    NOT NULL,
            UNIQUE (TourId, LanguageCode, PackageVersion)
        );
        """,
        """
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
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_NarrationLogs_Pending
            ON NarrationLogs (Synced, PlayedAt)
            WHERE Synced = 0;
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_NarrationLogs_POI
            ON NarrationLogs (POIId, PlayedAt DESC);
        """,
        """
        CREATE TABLE IF NOT EXISTS DeletedRecords (
            Id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            EntityType  TEXT    NOT NULL,
            EntityId    INTEGER NOT NULL,
            DeletedAt   TEXT    NOT NULL,
            ProcessedAt TEXT
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS IX_DeletedRecords_Pending
            ON DeletedRecords (EntityType, EntityId)
            WHERE ProcessedAt IS NULL;
        """,
        """
        CREATE TABLE IF NOT EXISTS GeofenceState (
            POIId           INTEGER NOT NULL PRIMARY KEY,
            LastTriggeredAt TEXT,
            CooldownUntil   TEXT,
            EnteredAt       TEXT,
            IsInsideRadius  INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (POIId) REFERENCES POIs(Id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS SyncCursors (
            EntityType   TEXT NOT NULL PRIMARY KEY,
            LastSyncedAt TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z'
        );
        """,
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('POI');",
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('AudioTrack');",
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('Tour');",
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('QRLocation');",
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('OfflinePackage');",
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('Language');",
        "INSERT OR IGNORE INTO SyncCursors (EntityType) VALUES ('DeletedRecord');",
    ];
}
