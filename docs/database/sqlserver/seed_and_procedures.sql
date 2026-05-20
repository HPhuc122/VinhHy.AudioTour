-- ============================================================
--  VinhHy.AudioTour — Seed Data + Stored Procedures
--  Run AFTER 01_sqlserver_schema.sql
-- ============================================================

USE VinhHyAudioTourDB;
GO

-- ============================================================
-- SECTION A: SEED DATA
-- ============================================================

-- Roles
INSERT INTO Roles (Name, Description) VALUES
    ('Admin',    N'Quản trị hệ thống'),
    ('Editor',   N'Biên tập viên nội dung'),
    ('Viewer',   N'Khách xem báo cáo');
GO

-- Admin user (password: Admin@123 — bcrypt hash placeholder)
INSERT INTO Users (Username, Email, PasswordHash, RoleId, PreferredLanguage)
VALUES (
    'admin',
    'admin@vinhhyaudiotour.vn',
    '$2a$12$PLACEHOLDER_BCRYPT_HASH_HERE',
    1,
    'vi'
);
GO

-- POIs — Phố ẩm thực Vĩnh Hy (Ninh Thuận)
-- Coordinates centered around Vĩnh Hy bay area (~11.67°N, 109.26°E)
INSERT INTO POIs (Code, Latitude, Longitude, RadiusMeters, Priority, Category, ImageUrl) VALUES
    ('POI-001', 11.6724, 109.2621, 30, 10, N'landmark',   'https://cdn.vinhhyaudiotour.vn/poi/001.jpg'),
    ('POI-002', 11.6718, 109.2635, 25, 9,  N'seafood',    'https://cdn.vinhhyaudiotour.vn/poi/002.jpg'),
    ('POI-003', 11.6731, 109.2608, 20, 8,  N'seafood',    'https://cdn.vinhhyaudiotour.vn/poi/003.jpg'),
    ('POI-004', 11.6745, 109.2650, 30, 7,  N'history',    'https://cdn.vinhhyaudiotour.vn/poi/004.jpg'),
    ('POI-005', 11.6710, 109.2595, 25, 6,  N'craft',      'https://cdn.vinhhyaudiotour.vn/poi/005.jpg'),
    ('POI-006', 11.6755, 109.2670, 20, 5,  N'viewpoint',  'https://cdn.vinhhyaudiotour.vn/poi/006.jpg'),
    ('POI-007', 11.6699, 109.2580, 25, 7,  N'seafood',    'https://cdn.vinhhyaudiotour.vn/poi/007.jpg'),
    ('POI-008', 11.6762, 109.2640, 30, 8,  N'landmark',   'https://cdn.vinhhyaudiotour.vn/poi/008.jpg');
GO

-- POI Translations (vi + en)
INSERT INTO POITranslations (POIId, LanguageCode, Name, Description, ShortDescription) VALUES
-- POI-001
(1, 'vi', N'Cổng làng chài Vĩnh Hy',
    N'Cổng chào truyền thống đánh dấu lối vào khu vực ẩm thực làng chài Vĩnh Hy. Được xây dựng năm 2010 từ gỗ và đá địa phương, mang đậm nét kiến trúc duyên hải miền Trung.',
    N'Cổng vào làng chài lịch sử'),
(1, 'en', 'Vĩnh Hy Fishing Village Gate',
    'The traditional welcome gate marking the entrance to the Vĩnh Hy seafood street. Built in 2010 using local wood and stone, it reflects the coastal architecture of Central Vietnam.',
    'Historic fishing village entrance'),

-- POI-002
(2, 'vi', N'Hàng hải sản tươi Bà Năm',
    N'Quầy hải sản nổi tiếng nhất phố Vĩnh Hy, chuyên bán tôm hùm, mực, cá hố tươi sống đánh bắt mỗi sáng sớm. Bà Năm đã gắn bó với nghề biển hơn 30 năm.',
    N'Hải sản tươi sống mỗi ngày'),
(2, 'en', 'Bà Năm Fresh Seafood Stall',
    'The most famous seafood stall on Vĩnh Hy street, specialising in live lobster, squid, and hairtail fish caught every morning. Owner Bà Năm has been in the fishing trade for over 30 years.',
    'Daily catch, straight from the sea'),

-- POI-003
(3, 'vi', N'Quán bánh canh chả cá Dì Tư',
    N'Quán ăn truyền thống phục vụ bánh canh chả cá đặc sản Ninh Thuận. Nước dùng được ninh từ xương cá tươi trong 6 tiếng, chả cá tự làm từ cá thu biển.',
    N'Bánh canh chả cá đặc sản địa phương'),
(3, 'en', 'Dì Tư Fish Cake Noodle Soup',
    'A traditional eatery serving Ninh Thuận specialty fish cake noodle soup. The broth is simmered for six hours from fresh fish bones, with handmade mackerel fish cakes.',
    'Local specialty noodle soup'),

-- POI-004
(4, 'vi', N'Miếu ngư thần làng Vĩnh Hy',
    N'Ngôi miếu thờ thần cá Ông (cá voi) hơn 200 tuổi, trung tâm tín ngưỡng của cộng đồng ngư dân. Lễ hội Cầu Ngư được tổ chức hàng năm vào tháng 3 âm lịch.',
    N'Miếu thờ 200 năm tuổi'),
(4, 'en', 'Vĩnh Hy Sea God Temple',
    'A 200-year-old temple dedicated to Ông (the whale), the central place of worship for the fishing community. The annual Cầu Ngư festival is held here every third lunar month.',
    '200-year-old sea deity temple'),

-- POI-005
(5, 'vi', N'Xưởng đan thuyền thúng truyền thống',
    N'Xưởng gia đình sản xuất thuyền thúng bằng tre đan tay, một nghề truyền thống hàng trăm năm của ngư dân Trung Bộ. Du khách có thể tham quan và thử đan.',
    N'Thuyền thúng thủ công truyền thống'),
(5, 'en', 'Traditional Basket Boat Workshop',
    'A family workshop crafting hand-woven bamboo basket boats, a centuries-old tradition of Central Vietnamese fishermen. Visitors can tour the process and try weaving.',
    'Handcrafted bamboo boat-making'),

-- POI-006
(6, 'vi', N'Vọng gác ngắm vịnh Vĩnh Hy',
    N'Điểm ngắm cảnh cao nhất khu vực, từ đây có thể thấy toàn bộ vịnh Vĩnh Hy với màu nước xanh ngọc đặc trưng và những dãy núi đá granit hùng vĩ của VQG Núi Chúa.',
    N'Toàn cảnh vịnh xanh ngọc'),
(6, 'en', 'Vĩnh Hy Bay Observation Point',
    'The highest viewpoint in the area, offering a panoramic view of Vĩnh Hy Bay with its characteristic turquoise water and the granite mountains of Núi Chúa National Park.',
    'Panoramic turquoise bay views'),

-- POI-007
(7, 'vi', N'Cảng cá Vĩnh Hy — Buổi sáng sớm',
    N'Cảng cá nhộn nhịp nhất từ 4h đến 7h sáng khi tàu thuyền vào bờ. Du khách có thể chứng kiến cảnh mua bán hải sản sỉ và lẻ ngay trên bến.',
    N'Phiên chợ cá sáng sớm'),
(7, 'en', 'Vĩnh Hy Fish Landing Port',
    'The port is busiest between 4 and 7 AM when boats return with their catch. Visitors can witness both wholesale and retail seafood trading right on the dock.',
    'Early morning fish market'),

-- POI-008
(8, 'vi', N'Bãi biển Vĩnh Hy — Khu tắm biển',
    N'Bãi biển hoang sơ với cát trắng mịn và nước trong xanh, nằm trong khu bảo tồn biển Hòn Cau. Nơi đây có nhiều loài san hô và cá nhiệt đới phù hợp lặn biển.',
    N'Bãi biển hoang sơ trong khu bảo tồn'),
(8, 'en', 'Vĩnh Hy Beach — Swimming Area',
    'A pristine beach with fine white sand and crystal-clear water within the Hòn Cau Marine Reserve. The area hosts diverse coral reefs and tropical fish ideal for snorkelling.',
    'Pristine beach in marine reserve');
GO

-- Audio Tracks (TTS entries — files to be uploaded separately)
INSERT INTO AudioTracks (POIId, LanguageCode, AudioType, TTSText, DurationSeconds) VALUES
(1, 'vi', 'tts', N'Chào mừng quý khách đến với làng chài Vĩnh Hy. Cổng làng này được xây dựng năm 2010, là điểm khởi đầu cho hành trình khám phá ẩm thực và văn hóa biển của vùng đất đặc biệt này.', 15),
(1, 'en', 'tts', 'Welcome to Vĩnh Hy fishing village. This gate, built in 2010, marks the beginning of your journey through the seafood culture and coastal traditions of this remarkable place.', 14),
(2, 'vi', 'tts', N'Đây là quầy hải sản tươi của bà Năm, nổi tiếng nhất phố Vĩnh Hy. Tôm hùm, mực và cá đều được đánh bắt từ sáng sớm, đảm bảo độ tươi ngon tuyệt đối cho quý khách.', 16),
(2, 'en', 'tts', 'This is Bà Năm''s fresh seafood stall, the most famous on Vĩnh Hy street. Lobster, squid, and fish are caught each morning, guaranteeing the freshest quality for you.', 15),
(4, 'vi', 'tts', N'Trước mặt bạn là miếu thờ Thần Cá Ông, hơn 200 năm tuổi. Đây là trái tim tín ngưỡng của cộng đồng ngư dân Vĩnh Hy. Lễ hội Cầu Ngư mỗi năm thu hút hàng nghìn người tham dự.', 18),
(4, 'en', 'tts', 'Before you stands the Sea God Temple, over 200 years old. This is the spiritual heart of the Vĩnh Hy fishing community. The annual Cầu Ngư festival draws thousands of worshippers each year.', 17),
(6, 'vi', 'tts', N'Từ vọng gác này, bạn có thể ngắm toàn bộ vịnh Vĩnh Hy với màu nước xanh ngọc tuyệt đẹp. Phía xa là những đỉnh núi granit của vườn quốc gia Núi Chúa.', 15),
(6, 'en', 'tts', 'From this observation point, you can take in the full panorama of Vĩnh Hy Bay with its stunning turquoise waters. In the distance rise the granite peaks of Núi Chúa National Park.', 16);
GO

-- Tours
INSERT INTO Tours (Code, DefaultLanguage, EstimatedMinutes) VALUES
    ('TOUR-FOOD-VI', 'vi', 90),
    ('TOUR-CULTURE-VI', 'vi', 120),
    ('TOUR-FOOD-EN', 'en', 90);
GO

INSERT INTO TourTranslations (TourId, LanguageCode, Name, Description) VALUES
(1, 'vi', N'Khám phá ẩm thực Vĩnh Hy', N'Hành trình 90 phút khám phá các món đặc sản biển nổi tiếng của làng chài Vĩnh Hy'),
(1, 'en', 'Vĩnh Hy Food Discovery', 'A 90-minute journey through the famous seafood specialties of Vĩnh Hy fishing village'),
(2, 'vi', N'Di sản văn hóa Vĩnh Hy', N'Hành trình 120 phút tìm hiểu lịch sử và văn hóa tín ngưỡng của làng chài'),
(2, 'en', 'Vĩnh Hy Cultural Heritage', 'A 120-minute exploration of the history and beliefs of the fishing village'),
(3, 'en', 'Vĩnh Hy Food Discovery', 'A 90-minute guided audio tour of the best seafood spots in Vĩnh Hy');
GO

-- Tour POIs (food tour: cổng → hải sản → bánh canh → cảng → bãi biển)
INSERT INTO TourPOIs (TourId, POIId, OrderIndex) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 7, 4), (1, 8, 5),
    (2, 1, 1), (2, 4, 2), (2, 5, 3), (2, 6, 4),
    (3, 1, 1), (3, 2, 2), (3, 3, 3), (3, 7, 4), (3, 8, 5);
GO

-- QR Codes
INSERT INTO QRLocations (POIId, QRCode, Label) VALUES
    (1, 'VH-QR-POI001-A1B2C3', N'QR tại cổng chính'),
    (2, 'VH-QR-POI002-D4E5F6', N'QR tại quầy bà Năm'),
    (4, 'VH-QR-POI004-G7H8I9', N'QR tại cột miếu'),
    (5, 'VH-QR-POI005-J0K1L2', N'QR tại cửa xưởng'),
    (6, 'VH-QR-POI006-M3N4O5', N'QR tại bảng vọng cảnh'),
    (7, 'VH-QR-POI007-P6Q7R8', N'QR tại cổng cảng cá'),
    (8, 'VH-QR-POI008-S9T0U1', N'QR tại bảng bãi biển');
GO

-- Seed analytics (sample 7-day data)
INSERT INTO AnalyticsDaily (POIId, Date, TotalPlays, GpsPlays, QrPlays, ManualPlays, UniqueDevices)
SELECT
    p.Id,
    DATEADD(DAY, -n.n, CAST(GETUTCDATE() AS DATE)),
    (p.Priority * 3) + n.n,
    (p.Priority * 2) + n.n,
    p.Priority,
    1,
    (p.Priority * 2)
FROM POIs p
CROSS JOIN (
    SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) n
WHERE p.IsActive = 1;
GO

-- ============================================================
-- SECTION B: STORED PROCEDURES
-- ============================================================

-- SP 1: Incremental sync — return POIs updated after cursor
CREATE OR ALTER PROCEDURE usp_GetPOIsForSync
    @LastSyncedAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id, p.Code, p.Latitude, p.Longitude, p.RadiusMeters,
        p.Priority, p.IsActive, p.ImageUrl, p.Category, p.Version, p.UpdatedAt,
        (
            SELECT pt.LanguageCode, pt.Name, pt.Description, pt.ShortDescription, pt.Version
            FROM POITranslations pt
            WHERE pt.POIId = p.Id
            FOR JSON PATH
        ) AS Translations,
        (
            SELECT at2.LanguageCode, at2.AudioType, at2.FileUrl, at2.DurationSeconds,
                   at2.FileSizeBytes, at2.MimeType, at2.Version
            FROM AudioTracks at2
            WHERE at2.POIId = p.Id AND at2.IsActive = 1
            FOR JSON PATH
        ) AS AudioTracks
    FROM POIs p
    WHERE p.UpdatedAt > @LastSyncedAt
    ORDER BY p.UpdatedAt;
END;
GO

-- SP 2: Batch upsert narration logs from mobile sync
CREATE OR ALTER PROCEDURE usp_UpsertNarrationLogBatch
    @LogsJson NVARCHAR(MAX)   -- JSON array of log objects
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO NarrationLogs (UserId, POIId, TriggerType, LanguageCode, PlayedAt, DurationPlayedSeconds, DeviceId, Synced)
        SELECT
            NULLIF(j.UserId, 0),
            j.POIId,
            j.TriggerType,
            j.LanguageCode,
            j.PlayedAt,
            j.DurationPlayedSeconds,
            j.DeviceId,
            1  -- mark as synced on insertion
        FROM OPENJSON(@LogsJson) WITH (
            UserId                INT           '$.userId',
            POIId                 INT           '$.poiId',
            TriggerType           NVARCHAR(20)  '$.triggerType',
            LanguageCode          NVARCHAR(10)  '$.languageCode',
            PlayedAt              DATETIME2     '$.playedAt',
            DurationPlayedSeconds INT           '$.durationPlayedSeconds',
            DeviceId              NVARCHAR(200) '$.deviceId'
        ) j
        WHERE EXISTS (SELECT 1 FROM POIs WHERE Id = j.POIId);

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH;
END;
GO

-- SP 3: POI narration analytics summary
CREATE OR ALTER PROCEDURE usp_GetPOIAnalytics
    @POIId    INT  = NULL,
    @FromDate DATE = NULL,
    @ToDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @FromDate = ISNULL(@FromDate, DATEADD(DAY, -30, CAST(GETUTCDATE() AS DATE)));
    SET @ToDate   = ISNULL(@ToDate,   CAST(GETUTCDATE() AS DATE));

    SELECT
        ad.POIId,
        pt.Name         AS POIName,
        ad.Date,
        ad.TotalPlays,
        ad.GpsPlays,
        ad.QrPlays,
        ad.ManualPlays,
        ad.UniqueDevices
    FROM AnalyticsDaily ad
    INNER JOIN POITranslations pt ON pt.POIId = ad.POIId AND pt.LanguageCode = 'vi'
    WHERE ad.Date BETWEEN @FromDate AND @ToDate
      AND (@POIId IS NULL OR ad.POIId = @POIId)
    ORDER BY ad.Date DESC, ad.TotalPlays DESC;
END;
GO

-- SP 4: Upsert daily analytics (called by background job)
CREATE OR ALTER PROCEDURE usp_RefreshAnalyticsDaily
    @ForDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @ForDate = ISNULL(@ForDate, CAST(GETUTCDATE() AS DATE));

    MERGE AnalyticsDaily AS target
    USING (
        SELECT
            nl.POIId,
            @ForDate                                      AS Date,
            COUNT(*)                                      AS TotalPlays,
            SUM(CASE WHEN nl.TriggerType = 'gps'    THEN 1 ELSE 0 END) AS GpsPlays,
            SUM(CASE WHEN nl.TriggerType = 'qr'     THEN 1 ELSE 0 END) AS QrPlays,
            SUM(CASE WHEN nl.TriggerType = 'manual' THEN 1 ELSE 0 END) AS ManualPlays,
            COUNT(DISTINCT nl.DeviceId)                  AS UniqueDevices
        FROM NarrationLogs nl
        WHERE CAST(nl.PlayedAt AS DATE) = @ForDate
        GROUP BY nl.POIId
    ) AS source ON target.POIId = source.POIId AND target.Date = source.Date
    WHEN MATCHED THEN
        UPDATE SET
            TotalPlays    = source.TotalPlays,
            GpsPlays      = source.GpsPlays,
            QrPlays       = source.QrPlays,
            ManualPlays   = source.ManualPlays,
            UniqueDevices = source.UniqueDevices
    WHEN NOT MATCHED THEN
        INSERT (POIId, Date, TotalPlays, GpsPlays, QrPlays, ManualPlays, UniqueDevices)
        VALUES (source.POIId, source.Date, source.TotalPlays, source.GpsPlays,
                source.QrPlays, source.ManualPlays, source.UniqueDevices);
END;
GO

-- SP 5: Get full offline package manifest for a tour + language
CREATE OR ALTER PROCEDURE usp_GetOfflineManifest
    @TourId      INT,
    @Language    NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.Id          AS TourId,
        t.Code        AS TourCode,
        tt.Name       AS TourName,
        p.Id          AS POIId,
        p.Code        AS POICode,
        p.Latitude,
        p.Longitude,
        p.RadiusMeters,
        p.Priority,
        pt.Name       AS POIName,
        pt.Description,
        pt.ShortDescription,
        atr.AudioType,
        atr.FileUrl   AS AudioUrl,
        atr.DurationSeconds,
        atr.FileSizeBytes,
        atr.Version   AS AudioVersion,
        qr.QRCode,
        tp.OrderIndex
    FROM Tours t
    INNER JOIN TourTranslations tt  ON tt.TourId = t.Id AND tt.LanguageCode = @Language
    INNER JOIN TourPOIs tp          ON tp.TourId = t.Id
    INNER JOIN POIs p               ON p.Id = tp.POIId AND p.IsActive = 1
    LEFT  JOIN POITranslations pt   ON pt.POIId = p.Id AND pt.LanguageCode = @Language
    LEFT  JOIN AudioTracks atr      ON atr.POIId = p.Id AND atr.LanguageCode = @Language AND atr.IsActive = 1
    LEFT  JOIN QRLocations qr       ON qr.POIId = p.Id AND qr.IsActive = 1
    WHERE t.Id = @TourId AND t.IsActive = 1
    ORDER BY tp.OrderIndex;
END;
GO

PRINT 'Seed data and stored procedures created successfully.';
GO