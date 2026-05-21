-- ============================================================
--  VinhHy.AudioTour — SQL Server Schema
--  Database: VinhHyAudioTourDB
--  Engine:   SQL Server 2019+ / Azure SQL
--  Encoding: UTF-8
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'VinhHyAudioTourDB')
    CREATE DATABASE VinhHyAudioTourDB COLLATE Vietnamese_CI_AI;
GO

USE VinhHyAudioTourDB;
GO

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE Roles (
    Id          INT           NOT NULL IDENTITY(1,1),
    Name        NVARCHAR(50)  NOT NULL,
    Description NVARCHAR(200) NULL,
    CONSTRAINT PK_Roles PRIMARY KEY (Id),
    CONSTRAINT UQ_Roles_Name UNIQUE (Name)
);
GO

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE Users (
    Id                INT              NOT NULL IDENTITY(1,1),
    Username          NVARCHAR(100)    NOT NULL,
    Email             NVARCHAR(254)    NOT NULL,
    PasswordHash      NVARCHAR(512)    NOT NULL,
    RoleId            INT              NOT NULL,
    PreferredLanguage NVARCHAR(10)     NOT NULL DEFAULT 'vi',
    IsActive          BIT              NOT NULL DEFAULT 1,
    RefreshToken      NVARCHAR(512)    NULL,
    RefreshTokenExpiry DATETIME2       NULL,
    CreatedAt         DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users         PRIMARY KEY (Id),
    CONSTRAINT UQ_Users_Email   UNIQUE (Email),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT FK_Users_Roles   FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);
GO

-- ============================================================
-- 3. POIS (Points of Interest)
-- ============================================================
CREATE TABLE POIs (
    Id            INT             NOT NULL IDENTITY(1,1),
    Code          NVARCHAR(50)    NOT NULL,           -- e.g. POI-001
    Latitude      FLOAT           NOT NULL,
    Longitude     FLOAT           NOT NULL,
    RadiusMeters  FLOAT           NOT NULL DEFAULT 30,
    Priority      INT             NOT NULL DEFAULT 1,  -- higher = more important
    IsActive      BIT             NOT NULL DEFAULT 1,
    ImageUrl      NVARCHAR(500)   NULL,
    Category      NVARCHAR(100)   NULL,               -- e.g. "seafood", "history"
    Version       INT             NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_POIs      PRIMARY KEY (Id),
    CONSTRAINT UQ_POIs_Code UNIQUE (Code),
    CONSTRAINT CK_POIs_Lat  CHECK (Latitude  BETWEEN -90   AND 90),
    CONSTRAINT CK_POIs_Lon  CHECK (Longitude BETWEEN -180  AND 180),
    CONSTRAINT CK_POIs_Rad  CHECK (RadiusMeters > 0)
);
GO

-- Spatial index equivalent — filtered index for active POIs bounding box
CREATE INDEX IX_POIs_LatLon_Active
    ON POIs (Latitude, Longitude)
    WHERE IsActive = 1;
GO

CREATE INDEX IX_POIs_UpdatedAt ON POIs (UpdatedAt);
GO

-- ============================================================
-- 4. POI TRANSLATIONS
-- ============================================================
CREATE TABLE POITranslations (
    Id           INT            NOT NULL IDENTITY(1,1),
    POIId        INT            NOT NULL,
    LanguageCode NVARCHAR(10)   NOT NULL,   -- vi, en, zh, ko, ja, fr
    Name         NVARCHAR(200)  NOT NULL,
    Description  NVARCHAR(MAX)  NOT NULL,
    ShortDescription NVARCHAR(500) NULL,
    Version      INT            NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_POITranslations    PRIMARY KEY (Id),
    CONSTRAINT UQ_POITranslations_Lang UNIQUE (POIId, LanguageCode),
    CONSTRAINT FK_POITranslations_POI FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_POITranslations_Lang ON POITranslations (LanguageCode);
GO

-- ============================================================
-- 5. AUDIO TRACKS
-- ============================================================
CREATE TABLE AudioTracks (
    Id              INT           NOT NULL IDENTITY(1,1),
    POIId           INT           NOT NULL,
    LanguageCode    NVARCHAR(10)  NOT NULL,
    AudioType       NVARCHAR(20)  NOT NULL DEFAULT 'tts',  -- 'tts' | 'prerecorded'
    FileUrl         NVARCHAR(500) NULL,
    TTSText         NVARCHAR(MAX) NULL,
    DurationSeconds INT           NULL,
    FileSizeBytes   BIGINT        NULL,
    MimeType        NVARCHAR(50)  NULL DEFAULT 'audio/mp4',
    IsActive        BIT           NOT NULL DEFAULT 1,
    Version         INT           NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_AudioTracks       PRIMARY KEY (Id),
    CONSTRAINT FK_AudioTracks_POI   FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE,
    CONSTRAINT CK_AudioTracks_Type  CHECK (AudioType IN ('tts', 'prerecorded')),
    CONSTRAINT CK_AudioTracks_File  CHECK (
        (AudioType = 'prerecorded' AND FileUrl IS NOT NULL)
        OR (AudioType = 'tts' AND TTSText IS NOT NULL)
    )
);
GO

CREATE INDEX IX_AudioTracks_POI_Lang ON AudioTracks (POIId, LanguageCode) WHERE IsActive = 1;
GO

-- ============================================================
-- 6. TOURS
-- ============================================================
CREATE TABLE Tours (
    Id              INT           NOT NULL IDENTITY(1,1),
    Code            NVARCHAR(50)  NOT NULL,
    DefaultLanguage NVARCHAR(10)  NOT NULL DEFAULT 'vi',
    IsActive        BIT           NOT NULL DEFAULT 1,
    EstimatedMinutes INT          NULL,
    Version         INT           NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Tours      PRIMARY KEY (Id),
    CONSTRAINT UQ_Tours_Code UNIQUE (Code)
);
GO

-- ============================================================
-- 7. TOUR TRANSLATIONS
-- ============================================================
CREATE TABLE TourTranslations (
    Id           INT           NOT NULL IDENTITY(1,1),
    TourId       INT           NOT NULL,
    LanguageCode NVARCHAR(10)  NOT NULL,
    Name         NVARCHAR(200) NOT NULL,
    Description  NVARCHAR(MAX) NULL,
    CONSTRAINT PK_TourTranslations      PRIMARY KEY (Id),
    CONSTRAINT UQ_TourTranslations_Lang UNIQUE (TourId, LanguageCode),
    CONSTRAINT FK_TourTranslations_Tour FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE
);
GO

-- ============================================================
-- 8. TOUR POIS (Junction — ordered)
-- ============================================================
CREATE TABLE TourPOIs (
    Id         INT  NOT NULL IDENTITY(1,1),
    TourId     INT  NOT NULL,
    POIId      INT  NOT NULL,
    OrderIndex INT  NOT NULL DEFAULT 0,
    CONSTRAINT PK_TourPOIs      PRIMARY KEY (Id),
    CONSTRAINT UQ_TourPOIs_Pair UNIQUE (TourId, POIId),
    CONSTRAINT FK_TourPOIs_Tour FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TourPOIs_POI  FOREIGN KEY (POIId)  REFERENCES POIs(Id)
);
GO

CREATE INDEX IX_TourPOIs_Order ON TourPOIs (TourId, OrderIndex);
GO

-- ============================================================
-- 9. QR LOCATIONS
-- ============================================================
CREATE TABLE QRLocations (
    Id          INT           NOT NULL IDENTITY(1,1),
    POIId       INT           NOT NULL,
    QRCode      NVARCHAR(200) NOT NULL,    -- unique string embedded in QR image
    Label       NVARCHAR(200) NULL,
    IsActive    BIT           NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    ExpiresAt   DATETIME2     NULL,
    CONSTRAINT PK_QRLocations       PRIMARY KEY (Id),
    CONSTRAINT UQ_QRLocations_Code  UNIQUE (QRCode),
    CONSTRAINT FK_QRLocations_POI   FOREIGN KEY (POIId) REFERENCES POIs(Id)
);
GO

CREATE INDEX IX_QRLocations_Code ON QRLocations (QRCode) WHERE IsActive = 1;
GO

-- ============================================================
-- 10. NARRATION LOGS (User history)
-- ============================================================
CREATE TABLE NarrationLogs (
    Id           BIGINT        NOT NULL IDENTITY(1,1),
    UserId       INT           NULL,       -- NULL = anonymous
    POIId        INT           NOT NULL,
    TriggerType  NVARCHAR(20)  NOT NULL,   -- 'gps' | 'qr' | 'manual'
    LanguageCode NVARCHAR(10)  NOT NULL,
    PlayedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    DurationPlayedSeconds INT  NULL,
    DeviceId     NVARCHAR(200) NULL,
    Synced       BIT           NOT NULL DEFAULT 1,
    CONSTRAINT PK_NarrationLogs      PRIMARY KEY (Id),
    CONSTRAINT FK_NarrationLogs_User FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_NarrationLogs_POI  FOREIGN KEY (POIId)  REFERENCES POIs(Id),
    CONSTRAINT CK_NarrationLogs_Trigger CHECK (TriggerType IN ('gps', 'qr', 'manual'))
);
GO

CREATE INDEX IX_NarrationLogs_User    ON NarrationLogs (UserId, PlayedAt DESC);
CREATE INDEX IX_NarrationLogs_POI     ON NarrationLogs (POIId, PlayedAt DESC);
CREATE INDEX IX_NarrationLogs_Date    ON NarrationLogs (PlayedAt DESC);
CREATE INDEX IX_NarrationLogs_Synced  ON NarrationLogs (Synced) WHERE Synced = 0;
GO

-- ============================================================
-- 11. OFFLINE PACKAGES
-- ============================================================
CREATE TABLE OfflinePackages (
    Id           INT           NOT NULL IDENTITY(1,1),
    TourId       INT           NOT NULL,
    LanguageCode NVARCHAR(10)  NOT NULL,
    PackageVersion NVARCHAR(20) NOT NULL,
    DownloadUrl  NVARCHAR(500) NOT NULL,
    FileSizeBytes BIGINT       NOT NULL DEFAULT 0,
    Checksum     NVARCHAR(64)  NULL,      -- SHA-256
    IsActive     BIT           NOT NULL DEFAULT 1,
    PublishedAt  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OfflinePackages        PRIMARY KEY (Id),
    CONSTRAINT FK_OfflinePackages_Tour   FOREIGN KEY (TourId) REFERENCES Tours(Id),
    CONSTRAINT UQ_OfflinePackages_Ver    UNIQUE (TourId, LanguageCode, PackageVersion)
);
GO

-- ============================================================
-- 12. SYNC HISTORY
-- ============================================================
CREATE TABLE SyncHistory (
    Id           BIGINT        NOT NULL IDENTITY(1,1),
    UserId       INT           NOT NULL,
    SyncType     NVARCHAR(50)  NOT NULL,  -- 'full' | 'incremental' | 'narration_upload'
    SyncedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    RecordsIn    INT           NULL,
    RecordsOut   INT           NULL,
    Success      BIT           NOT NULL DEFAULT 1,
    ErrorMessage NVARCHAR(MAX) NULL,
    DeviceId     NVARCHAR(200) NULL,
    CONSTRAINT PK_SyncHistory      PRIMARY KEY (Id),
    CONSTRAINT FK_SyncHistory_User FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE INDEX IX_SyncHistory_User ON SyncHistory (UserId, SyncedAt DESC);
GO

-- ============================================================
-- 13. AUDIT LOGS
-- ============================================================
CREATE TABLE AuditLogs (
    Id         BIGINT         NOT NULL IDENTITY(1,1),
    UserId     INT            NULL,
    TableName  NVARCHAR(100)  NOT NULL,
    RecordId   INT            NOT NULL,
    Action     NVARCHAR(10)   NOT NULL,   -- INSERT | UPDATE | DELETE
    OldValues  NVARCHAR(MAX)  NULL,       -- JSON
    NewValues  NVARCHAR(MAX)  NULL,       -- JSON
    IPAddress  NVARCHAR(50)   NULL,
    CreatedAt  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_AuditLogs PRIMARY KEY (Id)
);
GO

CREATE INDEX IX_AuditLogs_Table  ON AuditLogs (TableName, RecordId);
CREATE INDEX IX_AuditLogs_User   ON AuditLogs (UserId, CreatedAt DESC);
CREATE INDEX IX_AuditLogs_Date   ON AuditLogs (CreatedAt DESC);
GO

-- ============================================================
-- 14. CONTENT VERSIONS (versioning table for rollback)
-- ============================================================
CREATE TABLE ContentVersions (
    Id            BIGINT        NOT NULL IDENTITY(1,1),
    EntityType    NVARCHAR(50)  NOT NULL,  -- 'POI' | 'AudioTrack' | 'Tour'
    EntityId      INT           NOT NULL,
    Version       INT           NOT NULL,
    SnapshotJson  NVARCHAR(MAX) NOT NULL,  -- full entity snapshot as JSON
    CreatedBy     INT           NULL,
    CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ContentVersions PRIMARY KEY (Id)
);
GO

CREATE INDEX IX_ContentVersions_Entity ON ContentVersions (EntityType, EntityId, Version DESC);
GO

-- ============================================================
-- 15. ANALYTICS DAILY (pre-aggregated)
-- ============================================================
CREATE TABLE AnalyticsDaily (
    Id            INT      NOT NULL IDENTITY(1,1),
    POIId         INT      NOT NULL,
    Date          DATE     NOT NULL,
    TotalPlays    INT      NOT NULL DEFAULT 0,
    GpsPlays      INT      NOT NULL DEFAULT 0,
    QrPlays       INT      NOT NULL DEFAULT 0,
    ManualPlays   INT      NOT NULL DEFAULT 0,
    UniqueDevices INT      NOT NULL DEFAULT 0,
    CONSTRAINT PK_AnalyticsDaily       PRIMARY KEY (Id),
    CONSTRAINT UQ_AnalyticsDaily_Day   UNIQUE (POIId, Date),
    CONSTRAINT FK_AnalyticsDaily_POI   FOREIGN KEY (POIId) REFERENCES POIs(Id)
);
GO

CREATE INDEX IX_AnalyticsDaily_Date ON AnalyticsDaily (Date DESC);
GO

PRINT 'SQL Server schema created successfully.';
GO