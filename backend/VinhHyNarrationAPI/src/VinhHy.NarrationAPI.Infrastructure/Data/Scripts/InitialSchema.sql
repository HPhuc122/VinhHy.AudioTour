-- ============================================================
--  VinhHy.AudioTour — SQL Server Schema (REVISED v2)
--  Database: VinhHyAudioTourDB
--  Engine:   SQL Server 2019+ / Azure SQL
--  Encoding: UTF-8
--
--  CHANGE LOG vs v1:
--  [NEW TABLE]     Languages          — language reference
--  [NEW TABLE]     Devices            — registered mobile devices
--  [NEW TABLE]     GeofenceConfigs    — per-POI geofence tuning
--  [NEW TABLE]     DeletedRecords     — sync tombstone table
--  [CHANGED]  POIs.Latitude/Longitude FLOAT → DECIMAL(9,6)
--  [CHANGED]  POIs + soft-delete      added DeletedAt DATETIME2 NULL
--  [CHANGED]  Tours + soft-delete     added DeletedAt DATETIME2 NULL
--  [CHANGED]  AudioTracks             added UNIQUE(POIId,LanguageCode)
--                                     added DeletedAt DATETIME2 NULL
--  [CHANGED]  QRLocations             added DeletedAt DATETIME2 NULL
--                                     added ExpiresAt (already existed — kept)
--  [CHANGED]  NarrationLogs.DeviceId  added FK to Devices
--  [CHANGED]  SyncHistory.DeviceId    added FK to Devices
--  [CHANGED]  AuditLogs.RecordId      INT → NVARCHAR(20)
--  [CHANGED]  ContentVersions.EntityId INT → BIGINT
--  [CHANGED]  OfflinePackages mobile  unique key fix (in SQLite file)
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'VinhHyAudioTourDB')
    CREATE DATABASE VinhHyAudioTourDB COLLATE Vietnamese_CI_AI;
GO

USE VinhHyAudioTourDB;
GO

-- ============================================================
-- 0. LANGUAGES  [NEW TABLE]
--    Reference table for supported language codes.
--    No FK enforcement on child tables (too rigid for MVP) —
--    child tables use CHECK constraints instead.
--    Populated at seed time; CMS reads this for UI dropdowns.
-- ============================================================
CREATE TABLE Languages (
    Code        NVARCHAR(10)  NOT NULL,
    Name        NVARCHAR(100) NOT NULL,  -- e.g. 'Tiếng Việt'
    NativeName  NVARCHAR(100) NOT NULL,  -- e.g. 'Vietnamese'
    IsActive    BIT           NOT NULL DEFAULT 1,
    SortOrder   INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_Languages      PRIMARY KEY (Code),
    CONSTRAINT UQ_Languages_Name UNIQUE (Name)
);
GO

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE Roles (
    Id          INT           NOT NULL IDENTITY(1,1),
    Name        NVARCHAR(50)  NOT NULL,
    Description NVARCHAR(200) NULL,
    CONSTRAINT PK_Roles      PRIMARY KEY (Id),
    CONSTRAINT UQ_Roles_Name UNIQUE (Name)
);
GO

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE Users (
    Id                 INT           NOT NULL IDENTITY(1,1),
    Username           NVARCHAR(100) NOT NULL,
    Email              NVARCHAR(254) NOT NULL,
    PasswordHash       NVARCHAR(512) NOT NULL,
    RoleId             INT           NOT NULL,
    PreferredLanguage  NVARCHAR(10)  NOT NULL DEFAULT 'vi',
    IsActive           BIT           NOT NULL DEFAULT 1,
    RefreshToken       NVARCHAR(512) NULL,
    RefreshTokenExpiry DATETIME2     NULL,
    CreatedAt          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users          PRIMARY KEY (Id),
    CONSTRAINT UQ_Users_Email    UNIQUE (Email),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT FK_Users_Roles    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);
GO

-- ============================================================
-- 3. DEVICES  [NEW TABLE]
--    Registered mobile client devices.
--    DeviceId is a stable client-generated UUID (stored as string
--    for EF Core compatibility and cross-platform portability).
--    NarrationLogs and SyncHistory FK here via DeviceId string.
-- ============================================================
CREATE TABLE Devices (
    -- [NEW TABLE]
    Id              INT           NOT NULL IDENTITY(1,1),
    DeviceId        NVARCHAR(200) NOT NULL,   -- client-generated UUID string
    UserId          INT           NULL,        -- NULL = anonymous device
    Platform        NVARCHAR(20)  NOT NULL,    -- 'android' | 'ios' | 'windows'
    AppVersion      NVARCHAR(20)  NULL,
    OsVersion       NVARCHAR(50)  NULL,
    PushToken       NVARCHAR(512) NULL,        -- FCM / APNs token (future)
    LastSeenAt      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    RegisteredAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Devices         PRIMARY KEY (Id),
    CONSTRAINT UQ_Devices_DeviceId UNIQUE (DeviceId),
    CONSTRAINT FK_Devices_User    FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT CK_Devices_Platform CHECK (Platform IN ('android', 'ios', 'windows'))
);
GO

CREATE INDEX IX_Devices_User ON Devices (UserId);
GO

-- ============================================================
-- 4. POIS (Points of Interest)
--    [CHANGED] Latitude/Longitude: FLOAT → DECIMAL(9,6)
--    [CHANGED] Added DeletedAt for soft-delete / sync tombstone
--    [CHANGED] Added CooldownSeconds, MinDwellSeconds for geofence config
-- ============================================================
CREATE TABLE POIs (
    Id               INT            NOT NULL IDENTITY(1,1),
    Code             NVARCHAR(50)   NOT NULL,
    -- [CHANGED] FLOAT → DECIMAL(9,6) for GPS precision
    Latitude         DECIMAL(9,6)   NOT NULL,
    Longitude        DECIMAL(9,6)   NOT NULL,
    RadiusMeters     DECIMAL(8,2)   NOT NULL DEFAULT 30,
    Priority         INT            NOT NULL DEFAULT 1,
    IsActive         BIT            NOT NULL DEFAULT 1,
    ImageUrl         NVARCHAR(500)  NULL,
    Category         NVARCHAR(100)  NULL,
    -- [NEW COLS] Geofence tuning (replaces hardcoded mobile values)
    CooldownSeconds     INT         NOT NULL DEFAULT 300,  -- re-trigger suppression
    MinDwellSeconds     INT         NOT NULL DEFAULT 5,    -- debounce: must be inside this long
    -- [NEW COL] Soft-delete for sync tombstone propagation
    DeletedAt        DATETIME2      NULL,
    Version          INT            NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_POIs      PRIMARY KEY (Id),
    CONSTRAINT UQ_POIs_Code UNIQUE (Code),
    -- [CHANGED] DECIMAL range constraints
    CONSTRAINT CK_POIs_Lat  CHECK (Latitude  BETWEEN -90  AND 90),
    CONSTRAINT CK_POIs_Lon  CHECK (Longitude BETWEEN -180 AND 180),
    CONSTRAINT CK_POIs_Rad  CHECK (RadiusMeters > 0),
    CONSTRAINT CK_POIs_Cooldown CHECK (CooldownSeconds >= 0),
    CONSTRAINT CK_POIs_Dwell    CHECK (MinDwellSeconds >= 0)
);
GO

-- GPS bounding-box fast-filter (active, non-deleted only)
-- [CHANGED] Filter now also excludes soft-deleted rows
CREATE INDEX IX_POIs_LatLon_Active
    ON POIs (Latitude, Longitude)
    WHERE IsActive = 1 AND DeletedAt IS NULL;
GO

CREATE INDEX IX_POIs_UpdatedAt ON POIs (UpdatedAt);
GO

-- [NEW INDEX] Incremental sync: find all changed OR deleted rows
CREATE INDEX IX_POIs_DeletedAt ON POIs (DeletedAt) WHERE DeletedAt IS NOT NULL;
GO

-- ============================================================
-- 5. POI TRANSLATIONS
-- ============================================================
CREATE TABLE POITranslations (
    Id               INT           NOT NULL IDENTITY(1,1),
    POIId            INT           NOT NULL,
    LanguageCode     NVARCHAR(10)  NOT NULL,
    Name             NVARCHAR(200) NOT NULL,
    Description      NVARCHAR(MAX) NOT NULL,
    ShortDescription NVARCHAR(500) NULL,
    Version          INT           NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_POITranslations       PRIMARY KEY (Id),
    CONSTRAINT UQ_POITranslations_Lang  UNIQUE (POIId, LanguageCode),
    CONSTRAINT FK_POITranslations_POI   FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_POITranslations_Lang ON POITranslations (LanguageCode);
GO

-- ============================================================
-- 6. AUDIO TRACKS
--    [CHANGED] Added UNIQUE (POIId, LanguageCode) — one track per
--              language per POI. Use IsActive to retire old versions.
--    [CHANGED] Added DeletedAt for soft-delete sync propagation.
-- ============================================================
CREATE TABLE AudioTracks (
    Id              INT           NOT NULL IDENTITY(1,1),
    POIId           INT           NOT NULL,
    LanguageCode    NVARCHAR(10)  NOT NULL,
    AudioType       NVARCHAR(20)  NOT NULL DEFAULT 'tts',
    FileUrl         NVARCHAR(500) NULL,
    TTSText         NVARCHAR(MAX) NULL,
    DurationSeconds INT           NULL,
    FileSizeBytes   BIGINT        NULL,
    MimeType        NVARCHAR(50)  NULL DEFAULT 'audio/mp4',
    IsActive        BIT           NOT NULL DEFAULT 1,
    -- [NEW COL] Soft-delete
    DeletedAt       DATETIME2     NULL,
    Version         INT           NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_AudioTracks       PRIMARY KEY (Id),
    CONSTRAINT FK_AudioTracks_POI   FOREIGN KEY (POIId) REFERENCES POIs(Id) ON DELETE CASCADE,
    CONSTRAINT CK_AudioTracks_Type  CHECK (AudioType IN ('tts', 'prerecorded')),
    CONSTRAINT CK_AudioTracks_File  CHECK (
        (AudioType = 'prerecorded' AND FileUrl IS NOT NULL)
        OR (AudioType = 'tts' AND TTSText IS NOT NULL)
    ),
    -- [NEW CONSTRAINT] One audio track per POI per language
    -- If you ever need multiple tracks per language (A/B test), remove this
    -- and filter on IsActive = 1 in application logic.
    CONSTRAINT UQ_AudioTracks_POI_Lang UNIQUE (POIId, LanguageCode)
);
GO

-- [CHANGED] Index no longer needs WHERE IsActive because UQ already
-- ensures only one row per (POIId, LanguageCode). Keep for query perf.
CREATE INDEX IX_AudioTracks_POI_Lang
    ON AudioTracks (POIId, LanguageCode)
    WHERE IsActive = 1 AND DeletedAt IS NULL;
GO

-- ============================================================
-- 7. TOURS
--    [CHANGED] Added DeletedAt for soft-delete
-- ============================================================
CREATE TABLE Tours (
    Id               INT          NOT NULL IDENTITY(1,1),
    Code             NVARCHAR(50) NOT NULL,
    DefaultLanguage  NVARCHAR(10) NOT NULL DEFAULT 'vi',
    IsActive         BIT          NOT NULL DEFAULT 1,
    EstimatedMinutes INT          NULL,
    -- [NEW COL] Soft-delete
    DeletedAt        DATETIME2    NULL,
    Version          INT          NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Tours      PRIMARY KEY (Id),
    CONSTRAINT UQ_Tours_Code UNIQUE (Code)
);
GO

-- ============================================================
-- 8. TOUR TRANSLATIONS
-- ============================================================
CREATE TABLE TourTranslations (
    Id           INT           NOT NULL IDENTITY(1,1),
    TourId       INT           NOT NULL,
    LanguageCode NVARCHAR(10)  NOT NULL,
    Name         NVARCHAR(200) NOT NULL,
    Description  NVARCHAR(MAX) NULL,
    CONSTRAINT PK_TourTranslations       PRIMARY KEY (Id),
    CONSTRAINT UQ_TourTranslations_Lang  UNIQUE (TourId, LanguageCode),
    CONSTRAINT FK_TourTranslations_Tour  FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE
);
GO

-- ============================================================
-- 9. TOUR POIS (Junction — ordered)
-- ============================================================
CREATE TABLE TourPOIs (
    Id         INT NOT NULL IDENTITY(1,1),
    TourId     INT NOT NULL,
    POIId      INT NOT NULL,
    OrderIndex INT NOT NULL DEFAULT 0,
    CONSTRAINT PK_TourPOIs      PRIMARY KEY (Id),
    CONSTRAINT UQ_TourPOIs_Pair UNIQUE (TourId, POIId),
    CONSTRAINT FK_TourPOIs_Tour FOREIGN KEY (TourId) REFERENCES Tours(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TourPOIs_POI  FOREIGN KEY (POIId)  REFERENCES POIs(Id)
    -- No ON DELETE CASCADE for POI side — a deleted POI should be soft-deleted
    -- and the TourPOI row retained for historical reference.
);
GO

CREATE INDEX IX_TourPOIs_Order ON TourPOIs (TourId, OrderIndex);
GO

-- ============================================================
-- 10. QR LOCATIONS
--     [CHANGED] Added DeletedAt for soft-delete sync
-- ============================================================
CREATE TABLE QRLocations (
    Id        INT           NOT NULL IDENTITY(1,1),
    POIId     INT           NOT NULL,
    QRCode    NVARCHAR(200) NOT NULL,
    Label     NVARCHAR(200) NULL,
    IsActive  BIT           NOT NULL DEFAULT 1,
    -- [NEW COL] Soft-delete
    DeletedAt DATETIME2     NULL,
    CreatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    ExpiresAt DATETIME2     NULL,
    CONSTRAINT PK_QRLocations      PRIMARY KEY (Id),
    CONSTRAINT UQ_QRLocations_Code UNIQUE (QRCode),
    CONSTRAINT FK_QRLocations_POI  FOREIGN KEY (POIId) REFERENCES POIs(Id)
);
GO

CREATE INDEX IX_QRLocations_Code
    ON QRLocations (QRCode)
    WHERE IsActive = 1 AND DeletedAt IS NULL;
GO

-- ============================================================
-- 11. NARRATION LOGS (User history)
--     [CHANGED] DeviceId now FKs to Devices.DeviceId (nullable)
-- ============================================================
CREATE TABLE NarrationLogs (
    Id                    BIGINT       NOT NULL IDENTITY(1,1),
    UserId                INT          NULL,
    POIId                 INT          NOT NULL,
    TriggerType           NVARCHAR(20) NOT NULL,
    LanguageCode          NVARCHAR(10) NOT NULL,
    PlayedAt              DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    DurationPlayedSeconds INT          NULL,
    -- [CHANGED] DeviceId now VARCHAR to match Devices.DeviceId for FK
    DeviceId              NVARCHAR(200) NULL,
    Synced                BIT          NOT NULL DEFAULT 1,
    CONSTRAINT PK_NarrationLogs       PRIMARY KEY (Id),
    CONSTRAINT FK_NarrationLogs_User  FOREIGN KEY (UserId)   REFERENCES Users(Id),
    CONSTRAINT FK_NarrationLogs_POI   FOREIGN KEY (POIId)    REFERENCES POIs(Id),
    -- [NEW FK] Link DeviceId to registered device (nullable — anonymous allowed)
    CONSTRAINT FK_NarrationLogs_Device FOREIGN KEY (DeviceId) REFERENCES Devices(DeviceId),
    CONSTRAINT CK_NarrationLogs_Trigger CHECK (TriggerType IN ('gps', 'qr', 'manual'))
);
GO

CREATE INDEX IX_NarrationLogs_User   ON NarrationLogs (UserId, PlayedAt DESC);
CREATE INDEX IX_NarrationLogs_POI    ON NarrationLogs (POIId, PlayedAt DESC);
CREATE INDEX IX_NarrationLogs_Date   ON NarrationLogs (PlayedAt DESC);
CREATE INDEX IX_NarrationLogs_Synced ON NarrationLogs (Synced) WHERE Synced = 0;
-- [NEW INDEX] Per-device history
CREATE INDEX IX_NarrationLogs_Device ON NarrationLogs (DeviceId, PlayedAt DESC)
    WHERE DeviceId IS NOT NULL;
GO

-- ============================================================
-- 12. OFFLINE PACKAGES
-- ============================================================
CREATE TABLE OfflinePackages (
    Id              INT           NOT NULL IDENTITY(1,1),
    TourId          INT           NOT NULL,
    LanguageCode    NVARCHAR(10)  NOT NULL,
    PackageVersion  NVARCHAR(20)  NOT NULL,
    DownloadUrl     NVARCHAR(500) NOT NULL,
    FileSizeBytes   BIGINT        NOT NULL DEFAULT 0,
    Checksum        NVARCHAR(64)  NULL,
    IsActive        BIT           NOT NULL DEFAULT 1,
    PublishedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_OfflinePackages      PRIMARY KEY (Id),
    CONSTRAINT FK_OfflinePackages_Tour FOREIGN KEY (TourId) REFERENCES Tours(Id),
    CONSTRAINT UQ_OfflinePackages_Ver  UNIQUE (TourId, LanguageCode, PackageVersion)
);
GO

-- ============================================================
-- 13. SYNC HISTORY
--     [CHANGED] DeviceId FKs to Devices.DeviceId
-- ============================================================
CREATE TABLE SyncHistory (
    Id           BIGINT        NOT NULL IDENTITY(1,1),
    UserId       INT           NOT NULL,
    SyncType     NVARCHAR(50)  NOT NULL,
    SyncedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    RecordsIn    INT           NULL,
    RecordsOut   INT           NULL,
    Success      BIT           NOT NULL DEFAULT 1,
    ErrorMessage NVARCHAR(MAX) NULL,
    -- [CHANGED] DeviceId FKs to Devices
    DeviceId     NVARCHAR(200) NULL,
    CONSTRAINT PK_SyncHistory       PRIMARY KEY (Id),
    CONSTRAINT FK_SyncHistory_User  FOREIGN KEY (UserId)   REFERENCES Users(Id),
    -- [NEW FK]
    CONSTRAINT FK_SyncHistory_Device FOREIGN KEY (DeviceId) REFERENCES Devices(DeviceId)
);
GO

CREATE INDEX IX_SyncHistory_User   ON SyncHistory (UserId, SyncedAt DESC);
CREATE INDEX IX_SyncHistory_Device ON SyncHistory (DeviceId, SyncedAt DESC)
    WHERE DeviceId IS NOT NULL;
GO

-- ============================================================
-- 14. DELETED RECORDS (Sync Tombstone)  [NEW TABLE]
--     When a syncable entity is soft-deleted OR hard-deleted,
--     a tombstone row is inserted here. The mobile sync endpoint
--     reads this table to know which local records to remove.
--     Keeps mobile clients clean without full re-sync.
-- ============================================================
CREATE TABLE DeletedRecords (
    -- [NEW TABLE]
    Id          BIGINT        NOT NULL IDENTITY(1,1),
    EntityType  NVARCHAR(50)  NOT NULL,   -- 'POI' | 'AudioTrack' | 'Tour' | 'QRLocation'
    EntityId    INT           NOT NULL,   -- PK of the deleted entity
    DeletedAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    DeletedBy   INT           NULL,       -- UserId who deleted (NULL = system/cascade)
    CONSTRAINT PK_DeletedRecords PRIMARY KEY (Id),
    CONSTRAINT FK_DeletedRecords_User FOREIGN KEY (DeletedBy) REFERENCES Users(Id)
);
GO

CREATE INDEX IX_DeletedRecords_Type_Date
    ON DeletedRecords (EntityType, DeletedAt DESC);
GO

-- ============================================================
-- 15. AUDIT LOGS
--     [CHANGED] RecordId INT → NVARCHAR(20)
--               to accommodate both INT and BIGINT PKs
-- ============================================================
CREATE TABLE AuditLogs (
    Id        BIGINT        NOT NULL IDENTITY(1,1),
    UserId    INT           NULL,
    TableName NVARCHAR(100) NOT NULL,
    -- [CHANGED] Was INT — NVARCHAR(20) handles both INT and BIGINT PKs
    RecordId  NVARCHAR(20)  NOT NULL,
    Action    NVARCHAR(10)  NOT NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(50)  NULL,
    CreatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_AuditLogs PRIMARY KEY (Id),
    CONSTRAINT FK_AuditLogs_User FOREIGN KEY (UserId) REFERENCES Users(Id)
);
GO

CREATE INDEX IX_AuditLogs_Table ON AuditLogs (TableName, RecordId);
CREATE INDEX IX_AuditLogs_User  ON AuditLogs (UserId, CreatedAt DESC);
CREATE INDEX IX_AuditLogs_Date  ON AuditLogs (CreatedAt DESC);
GO

-- ============================================================
-- 16. CONTENT VERSIONS
--     [CHANGED] EntityId INT → BIGINT
-- ============================================================
CREATE TABLE ContentVersions (
    Id           BIGINT        NOT NULL IDENTITY(1,1),
    EntityType   NVARCHAR(50)  NOT NULL,
    -- [CHANGED] INT → BIGINT
    EntityId     BIGINT        NOT NULL,
    Version      INT           NOT NULL,
    SnapshotJson NVARCHAR(MAX) NOT NULL,
    CreatedBy    INT           NULL,
    CreatedAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ContentVersions PRIMARY KEY (Id),
    CONSTRAINT FK_ContentVersions_User FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);
GO

CREATE INDEX IX_ContentVersions_Entity
    ON ContentVersions (EntityType, EntityId, Version DESC);
GO

-- ============================================================
-- 17. ANALYTICS DAILY (pre-aggregated)
-- ============================================================
CREATE TABLE AnalyticsDaily (
    Id            INT  NOT NULL IDENTITY(1,1),
    POIId         INT  NOT NULL,
    Date          DATE NOT NULL,
    TotalPlays    INT  NOT NULL DEFAULT 0,
    GpsPlays      INT  NOT NULL DEFAULT 0,
    QrPlays       INT  NOT NULL DEFAULT 0,
    ManualPlays   INT  NOT NULL DEFAULT 0,
    UniqueDevices INT  NOT NULL DEFAULT 0,
    CONSTRAINT PK_AnalyticsDaily     PRIMARY KEY (Id),
    CONSTRAINT UQ_AnalyticsDaily_Day UNIQUE (POIId, Date),
    CONSTRAINT FK_AnalyticsDaily_POI FOREIGN KEY (POIId) REFERENCES POIs(Id)
);
GO

CREATE INDEX IX_AnalyticsDaily_Date ON AnalyticsDaily (Date DESC);
GO

-- ============================================================
-- LANGUAGE SEED (run once — reference data)
-- ============================================================
INSERT INTO Languages (Code, Name, NativeName, SortOrder) VALUES
    ('vi', N'Tiếng Việt',  'Vietnamese', 1),
    ('en', 'English',       'English',    2),
    ('zh', N'中文',          'Chinese',    3),
    ('ko', N'한국어',         'Korean',     4),
    ('ja', N'日本語',         'Japanese',   5),
    ('fr', 'Français',      'French',     6);
GO

PRINT 'VinhHy AudioTour SQL Server schema v2 created successfully.';
GO