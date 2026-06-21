using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Data.Seed;

public static class KhanhHoiDemoSeeder
{
    private const string DemoPassword = "ChangeMe123!";
    private const string DemoAccessToken = "khanhhoi-demo-access-token";

    private static readonly byte[] PlaceholderPng =
        Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z8BQDwAFgwJ/lEEmNwAAAABJRU5ErkJggg==");

    public static async Task SeedAsync(
        ApplicationDbContext db,
        IHostEnvironment environment,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        Console.WriteLine("Khanh Hoi demo seed: starting.");

        var roles = await EnsureRolesAsync(db, cancellationToken).ConfigureAwait(false);
        await EnsureLanguagesAsync(db, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var users = await EnsureUsersAsync(db, roles, now, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var pois = await EnsurePoisAsync(db, users, now, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await EnsurePoiTranslationsAsync(db, pois, now, cancellationToken).ConfigureAwait(false);
        await EnsureMediaAsync(db, pois, users, environment, now, cancellationToken).ConfigureAwait(false);
        await EnsureNarrationDraftsAsync(db, pois, users, now, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var tours = await EnsureToursAsync(db, pois, now, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await EnsureQrAndAccessAsync(db, tours, pois, now, cancellationToken).ConfigureAwait(false);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        Console.WriteLine("Khanh Hoi demo seed: complete.");
    }

    private static async Task<Dictionary<string, Role>> EnsureRolesAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var roles = await db.Roles.ToDictionaryAsync(r => r.Name, cancellationToken).ConfigureAwait(false);
        foreach (var roleName in new[]
                 {
                     RoleNames.Admin,
                     RoleNames.Vendor,
                     RoleNames.ContentAdmin,
                     RoleNames.TourOperator,
                     RoleNames.AnalyticsViewer
                 })
        {
            if (!roles.ContainsKey(roleName))
            {
                var role = new Role { Name = roleName, Description = $"{roleName} demo role" };
                await db.Roles.AddAsync(role, cancellationToken).ConfigureAwait(false);
                roles[roleName] = role;
                Console.WriteLine($"Khanh Hoi demo seed: created role {roleName}.");
            }
        }

        return roles;
    }

    private static async Task EnsureLanguagesAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var languages = new (string Code, string Name, string NativeName, int SortOrder)[]
        {
            ("vi", "Tiếng Việt", "Tiếng Việt", 1),
            ("en", "English", "English", 2),
            ("zh", "中文", "中文", 3),
            ("ko", "한국어", "한국어", 4),
            ("ja", "日本語", "日本語", 5)
        };

        foreach (var language in languages)
        {
            var existing = await db.Languages
                .FirstOrDefaultAsync(l => l.Code == language.Code, cancellationToken)
                .ConfigureAwait(false);

            if (existing is null)
            {
                await db.Languages.AddAsync(
                    new Language
                    {
                        Code = language.Code,
                        Name = language.Name,
                        NativeName = language.NativeName,
                        SortOrder = language.SortOrder,
                        IsActive = true
                    },
                    cancellationToken).ConfigureAwait(false);
                Console.WriteLine($"Khanh Hoi demo seed: created language {language.Code}.");
                continue;
            }

            existing.Name = language.Name;
            existing.NativeName = language.NativeName;
            existing.SortOrder = language.SortOrder;
            existing.IsActive = true;
        }
    }

    private static async Task<Dictionary<string, User>> EnsureUsersAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, Role> roles,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var users = new (string Email, string Username, string RoleName, string DisplayName)[]
        {
            ("admin@khanhhoi.demo", "admin@khanhhoi.demo", RoleNames.Admin, "Admin Khánh Hội"),
            ("vendor.cafe@khanhhoi.demo", "vendor.cafe@khanhhoi.demo", RoleNames.Vendor, "Chủ quán Cà phê Bến Sông"),
            ("vendor.amthuc@khanhhoi.demo", "vendor.amthuc@khanhhoi.demo", RoleNames.Vendor, "Chủ sạp Ẩm thực Khánh Hội"),
            ("vendor.luuniem@khanhhoi.demo", "vendor.luuniem@khanhhoi.demo", RoleNames.Vendor, "Chủ sạp Lưu niệm Cầu Cảng")
        };

        var result = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);
        foreach (var userInfo in users)
        {
            var existing = await db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == userInfo.Email, cancellationToken)
                .ConfigureAwait(false);

            if (existing is null)
            {
                existing = new User
                {
                    Username = userInfo.Username,
                    Email = userInfo.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword),
                    RoleId = roles[userInfo.RoleName].Id,
                    PreferredLanguage = "vi",
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                await db.Users.AddAsync(existing, cancellationToken).ConfigureAwait(false);
                Console.WriteLine($"Khanh Hoi demo seed: created user {userInfo.Email} ({userInfo.DisplayName}).");
            }
            else
            {
                existing.RoleId = roles[userInfo.RoleName].Id;
                existing.IsActive = true;
                existing.UpdatedAt = now;
            }

            result[userInfo.Email] = existing;
        }

        return result;
    }

    private static async Task<Dictionary<string, Poi>> EnsurePoisAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, User> users,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var future = now.AddYears(2);
        var poiSeeds = new[]
        {
            PoiSeed.Active("KHANHHOI_DINH_KHANH_HOI", "Đình Khánh Hội", "landmark", 10.760950m, 106.706100m,
                "Một điểm dừng văn hóa gợi nhắc đời sống cộng đồng lâu đời của khu Khánh Hội."),
            PoiSeed.Active("KHANHHOI_CONG_VIEN", "Công viên Khánh Hội", "landmark", 10.759900m, 106.702800m,
                "Không gian công cộng quen thuộc của cư dân khu vực Khánh Hội."),
            PoiSeed.Active("KHANHHOI_BEN_VAN_DON", "Không gian ven kênh Bến Vân Đồn", "landmark", 10.763100m, 106.704200m,
                "Tuyến ven kênh kết nối Quận 4 với trung tâm thành phố, phù hợp cho trải nghiệm đi bộ và nghe thuyết minh."),
            PoiSeed.Active("KHANHHOI_CAU_KHANH_HOI", "Khu vực Cầu Khánh Hội", "landmark", 10.765100m, 106.706200m,
                "Điểm kết nối quan trọng giữa Quận 4 và khu trung tâm."),
            PoiSeed.Active("KHANHHOI_CAFE_BEN_SONG", "Cà phê Bến Sông", "restaurant", 10.762400m, 106.703400m,
                "Một điểm nghỉ chân giả lập trong tuyến tham quan Khánh Hội.", "vendor.cafe@khanhhoi.demo"),
            PoiSeed.Active("KHANHHOI_AM_THUC_DIA_PHUONG", "Sạp ẩm thực Khánh Hội", "restaurant", 10.760500m, 106.701800m,
                "Điểm giới thiệu ẩm thực địa phương trong hành trình audio tour.", "vendor.amthuc@khanhhoi.demo"),
            PoiSeed.Active("KHANHHOI_LUU_NIEM_CAU_CANG", "Sạp lưu niệm Cầu Cảng", "landmark", 10.764200m, 106.704900m,
                "Điểm dừng giả lập cho hoạt động mua sắm lưu niệm.", "vendor.luuniem@khanhhoi.demo"),
            new PoiSeed("KHANHHOI_VENDOR_CHO_DUYET", "Sạp demo chờ duyệt", "restaurant", 10.761100m, 106.700900m,
                "POI vendor demo ở trạng thái chờ duyệt.", "vendor.amthuc@khanhhoi.demo", false,
                ApprovalStatus.Pending, PoiLifecycleStatus.PendingReview, false, PoiPaymentStatus.NotRequired),
            new PoiSeed("KHANHHOI_VENDOR_DA_DUYET", "Sạp demo đã duyệt", "restaurant", 10.762000m, 106.701100m,
                "POI vendor demo đã duyệt, chờ admin tạo yêu cầu thanh toán.", "vendor.cafe@khanhhoi.demo", false,
                ApprovalStatus.Approved, PoiLifecycleStatus.Approved, true, PoiPaymentStatus.NotRequired),
            new PoiSeed("KHANHHOI_VENDOR_CHO_THANH_TOAN", "Sạp demo chờ thanh toán", "landmark", 10.763300m, 106.701600m,
                "POI vendor demo đang chờ thanh toán.", "vendor.luuniem@khanhhoi.demo", false,
                ApprovalStatus.Approved, PoiLifecycleStatus.PendingPayment, true, PoiPaymentStatus.PendingPayment)
        };

        var result = new Dictionary<string, Poi>(StringComparer.OrdinalIgnoreCase);
        foreach (var seed in poiSeeds)
        {
            var poi = await db.Pois
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Code == seed.Code, cancellationToken)
                .ConfigureAwait(false);

            int? ownerId = seed.OwnerEmail is null ? null : users[seed.OwnerEmail].Id;
            if (poi is null)
            {
                poi = new Poi
                {
                    Code = seed.Code,
                    CreatedAt = now
                };
                await db.Pois.AddAsync(poi, cancellationToken).ConfigureAwait(false);
                Console.WriteLine($"Khanh Hoi demo seed: created POI {seed.Code}.");
            }

            poi.Name = seed.Name;
            poi.ShortDescription = seed.Description;
            poi.Description = seed.Description;
            poi.Category = seed.Category;
            poi.Latitude = seed.Latitude;
            poi.Longitude = seed.Longitude;
            poi.RadiusMeters = 35m;
            poi.Priority = seed.IsPublic ? 10 : 1;
            poi.UserId = ownerId;
            poi.IsActive = seed.IsPublic;
            poi.ApprovalStatus = seed.ApprovalStatus;
            poi.LifecycleStatus = seed.LifecycleStatus;
            poi.PaymentRequired = seed.PaymentRequired;
            poi.PaymentStatus = seed.PaymentStatus;
            poi.ValidFrom = seed.IsPublic ? now.AddDays(-1) : null;
            poi.ValidUntil = seed.IsPublic ? future : null;
            poi.ActivatedAt = seed.IsPublic ? now.AddDays(-1) : null;
            poi.ActivatedByUserId = seed.IsPublic ? users["admin@khanhhoi.demo"].Id : null;
            poi.CooldownSeconds = 300;
            poi.MinDwellSeconds = 5;
            poi.DeletedAt = null;
            poi.UpdatedAt = now;
            result[seed.Code] = poi;
        }

        return result;
    }

    private static async Task EnsurePoiTranslationsAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, Poi> pois,
        DateTime now,
        CancellationToken cancellationToken)
    {
        foreach (var poi in pois.Values.Where(p => p.LifecycleStatus == PoiLifecycleStatus.Active))
        {
            await UpsertPoiTranslationAsync(db, poi, "vi", poi.Name, poi.Description ?? poi.Name, poi.ShortDescription, now, cancellationToken)
                .ConfigureAwait(false);
            await UpsertPoiTranslationAsync(db, poi, "en", ToEnglishName(poi.Code, poi.Name), ToEnglishDescription(poi.Name), null, now, cancellationToken)
                .ConfigureAwait(false);
            await UpsertPoiTranslationAsync(db, poi, "zh", ToChineseName(poi.Code, poi.Name), ToChineseDescription(poi.Name), null, now, cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static async Task UpsertPoiTranslationAsync(
        ApplicationDbContext db,
        Poi poi,
        string languageCode,
        string name,
        string description,
        string? shortDescription,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var translation = await db.PoiTranslations
            .FirstOrDefaultAsync(t => t.POIId == poi.Id && t.LanguageCode == languageCode, cancellationToken)
            .ConfigureAwait(false);

        if (translation is null)
        {
            translation = new PoiTranslation
            {
                POIId = poi.Id,
                LanguageCode = languageCode,
                CreatedAt = now
            };
            await db.PoiTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);
        }

        translation.Name = name;
        translation.Description = description;
        translation.ShortDescription = shortDescription ?? description;
        translation.UpdatedAt = now;
    }

    private static async Task EnsureMediaAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, Poi> pois,
        IReadOnlyDictionary<string, User> users,
        IHostEnvironment environment,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var publicPois = pois.Values.Where(p => p.LifecycleStatus == PoiLifecycleStatus.Active).ToArray();
        foreach (var poi in publicPois)
        {
            await EnsureImageMediaAsync(db, environment, poi, users["admin@khanhhoi.demo"].Id, users["admin@khanhhoi.demo"].Id, ApprovalStatuses.Approved, now, cancellationToken)
                .ConfigureAwait(false);
        }

        await EnsureImageMediaAsync(db, environment, pois["KHANHHOI_VENDOR_CHO_DUYET"], users["vendor.amthuc@khanhhoi.demo"].Id, null, ApprovalStatuses.Pending, now, cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task EnsureImageMediaAsync(
        ApplicationDbContext db,
        IHostEnvironment environment,
        Poi poi,
        int uploadedByUserId,
        int? reviewedByUserId,
        string approvalStatus,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var fileName = $"{poi.Code.ToLowerInvariant()}-{approvalStatus.ToLowerInvariant()}.png";
        var relativePath = $"uploads/images/{fileName}";
        var absolutePath = Path.Combine(environment.ContentRootPath, "uploads", "images", fileName);
        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);
        if (!File.Exists(absolutePath))
        {
            await File.WriteAllBytesAsync(absolutePath, PlaceholderPng, cancellationToken).ConfigureAwait(false);
        }

        var media = await db.MediaFiles
            .FirstOrDefaultAsync(m => m.FileName == fileName, cancellationToken)
            .ConfigureAwait(false);

        if (media is null)
        {
            media = new MediaFile
            {
                FileName = fileName,
                OriginalFileName = fileName,
                UploadedAt = now
            };
            await db.MediaFiles.AddAsync(media, cancellationToken).ConfigureAwait(false);
        }

        media.FileType = "image";
        media.ContentType = "image/png";
        media.FileSize = PlaceholderPng.Length;
        media.RelativePath = relativePath;
        media.UploadedByUserId = uploadedByUserId;
        media.PoiId = poi.Id;
        media.ApprovalStatus = approvalStatus;
        media.SubmittedAt = now;
        media.ReviewedByUserId = approvalStatus == ApprovalStatuses.Approved ? reviewedByUserId : null;
        media.ReviewedAt = approvalStatus == ApprovalStatuses.Approved ? now : null;
        media.RejectionReason = null;
        media.IsDeleted = false;
    }

    private static async Task EnsureNarrationDraftsAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, Poi> pois,
        IReadOnlyDictionary<string, User> users,
        DateTime now,
        CancellationToken cancellationToken)
    {
        foreach (var code in new[] { "KHANHHOI_DINH_KHANH_HOI", "KHANHHOI_CONG_VIEN", "KHANHHOI_BEN_VAN_DON" })
        {
            await UpsertNarrationDraftAsync(db, pois[code], "vi", NarrationDraftStatuses.Approved, users["admin@khanhhoi.demo"].Id, users["admin@khanhhoi.demo"].Id, null, now, cancellationToken)
                .ConfigureAwait(false);
            await UpsertNarrationDraftAsync(db, pois[code], "en", NarrationDraftStatuses.Approved, users["admin@khanhhoi.demo"].Id, users["admin@khanhhoi.demo"].Id, null, now, cancellationToken)
                .ConfigureAwait(false);
        }

        await UpsertNarrationDraftAsync(db, pois["KHANHHOI_VENDOR_CHO_DUYET"], "vi", NarrationDraftStatuses.Pending, users["vendor.amthuc@khanhhoi.demo"].Id, null, null, now, cancellationToken)
            .ConfigureAwait(false);
        await UpsertNarrationDraftAsync(db, pois["KHANHHOI_VENDOR_DA_DUYET"], "vi", NarrationDraftStatuses.Rejected, users["vendor.cafe@khanhhoi.demo"].Id, users["admin@khanhhoi.demo"].Id, "Nội dung cần bổ sung chi tiết trải nghiệm tại điểm dừng.", now, cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task UpsertNarrationDraftAsync(
        ApplicationDbContext db,
        Poi poi,
        string languageCode,
        string status,
        int submittedByUserId,
        int? reviewedByUserId,
        string? rejectionReason,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var draft = await db.NarrationDrafts
            .FirstOrDefaultAsync(d => d.PoiId == poi.Id && d.LanguageCode == languageCode, cancellationToken)
            .ConfigureAwait(false);

        if (draft is null)
        {
            draft = new NarrationDraft
            {
                PoiId = poi.Id,
                LanguageCode = languageCode,
                CreatedAt = now,
                SubmittedAt = now
            };
            await db.NarrationDrafts.AddAsync(draft, cancellationToken).ConfigureAwait(false);
        }

        draft.Title = $"{poi.Name} ({languageCode})";
        draft.TextContent = $"{poi.Description} Đây là nội dung thuyết minh demo cho khu Khánh Hội.";
        draft.Voice = languageCode == "vi" ? "vi-VN-demo" : "multilingual-demo";
        draft.Status = status;
        draft.SubmittedByUserId = submittedByUserId;
        draft.ReviewedByUserId = reviewedByUserId;
        draft.ReviewedAt = reviewedByUserId.HasValue ? now : null;
        draft.RejectionReason = rejectionReason;
        draft.UpdatedAt = now;
    }

    private static async Task<Dictionary<string, Tour>> EnsureToursAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, Poi> pois,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var tourSeeds = new[]
        {
            new TourSeed(
                "KHANHHOI_WALKING_TOUR",
                "Tuyến đi bộ Khánh Hội",
                "Hành trình ngắn khám phá các điểm văn hóa, không gian ven kênh và đời sống địa phương khu Khánh Hội.",
                45,
                ["KHANHHOI_DINH_KHANH_HOI", "KHANHHOI_CONG_VIEN", "KHANHHOI_BEN_VAN_DON", "KHANHHOI_CAU_KHANH_HOI"]),
            new TourSeed(
                "KHANHHOI_FOOD_AND_LOCAL_LIFE",
                "Ẩm thực và đời sống Khánh Hội",
                "Tuyến trải nghiệm các điểm dừng giả lập về ẩm thực, cà phê và sinh hoạt cộng đồng.",
                35,
                ["KHANHHOI_CAFE_BEN_SONG", "KHANHHOI_AM_THUC_DIA_PHUONG", "KHANHHOI_LUU_NIEM_CAU_CANG", "KHANHHOI_BEN_VAN_DON"])
        };

        var result = new Dictionary<string, Tour>(StringComparer.OrdinalIgnoreCase);
        foreach (var seed in tourSeeds)
        {
            var tour = await db.Tours
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Code == seed.Code, cancellationToken)
                .ConfigureAwait(false);

            if (tour is null)
            {
                tour = new Tour { Code = seed.Code, CreatedAt = now };
                await db.Tours.AddAsync(tour, cancellationToken).ConfigureAwait(false);
                Console.WriteLine($"Khanh Hoi demo seed: created tour {seed.Code}.");
            }

            tour.DefaultLanguage = "vi";
            tour.IsActive = true;
            tour.EstimatedMinutes = seed.EstimatedMinutes;
            tour.DeletedAt = null;
            tour.UpdatedAt = now;
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            result[seed.Code] = tour;

            await UpsertTourTranslationAsync(db, tour, "vi", seed.Name, seed.Description, cancellationToken).ConfigureAwait(false);
            await UpsertTourTranslationAsync(db, tour, "en", ToEnglishTourName(seed.Code), ToEnglishTourDescription(seed.Code), cancellationToken).ConfigureAwait(false);
            await UpsertTourTranslationAsync(db, tour, "zh", ToChineseTourName(seed.Code), ToChineseTourDescription(seed.Code), cancellationToken).ConfigureAwait(false);

            for (var i = 0; i < seed.PoiCodes.Length; i++)
            {
                var poi = pois[seed.PoiCodes[i]];
                var stop = await db.TourPois
                    .FirstOrDefaultAsync(tp => tp.TourId == tour.Id && tp.POIId == poi.Id, cancellationToken)
                    .ConfigureAwait(false);

                if (stop is null)
                {
                    stop = new TourPoi { TourId = tour.Id, POIId = poi.Id };
                    await db.TourPois.AddAsync(stop, cancellationToken).ConfigureAwait(false);
                }

                stop.OrderIndex = i + 1;
            }
        }

        return result;
    }

    private static async Task UpsertTourTranslationAsync(
        ApplicationDbContext db,
        Tour tour,
        string languageCode,
        string name,
        string description,
        CancellationToken cancellationToken)
    {
        var translation = await db.TourTranslations
            .FirstOrDefaultAsync(t => t.TourId == tour.Id && t.LanguageCode == languageCode, cancellationToken)
            .ConfigureAwait(false);

        if (translation is null)
        {
            translation = new TourTranslation { TourId = tour.Id, LanguageCode = languageCode };
            await db.TourTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);
        }

        translation.Name = name;
        translation.Description = description;
    }

    private static async Task EnsureQrAndAccessAsync(
        ApplicationDbContext db,
        IReadOnlyDictionary<string, Tour> tours,
        IReadOnlyDictionary<string, Poi> pois,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var qrs = new[]
        {
            new QrSeed("KHANHHOI_BASIC", null, null, false, 0m, 24 * 60),
            new QrSeed("KHANHHOI_FULL_DAY", null, null, true, 50000m, 24 * 60),
            new QrSeed("KHANHHOI_TOUR_FOOD", null, "KHANHHOI_FOOD_AND_LOCAL_LIFE", true, 30000m, 24 * 60),
            new QrSeed("KHANHHOI_WALKING_TOUR_QR", null, "KHANHHOI_WALKING_TOUR", false, 0m, 24 * 60),
            new QrSeed("KHANHHOI_CAFE_BEN_SONG_QR", "KHANHHOI_CAFE_BEN_SONG", null, false, 0m, 24 * 60)
        };

        QrLocation? basicQr = null;
        foreach (var seed in qrs)
        {
            var qr = await db.QrLocations
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(q => q.Code == seed.Code, cancellationToken)
                .ConfigureAwait(false);

            if (qr is null)
            {
                qr = new QrLocation { Code = seed.Code, CreatedAt = now };
                await db.QrLocations.AddAsync(qr, cancellationToken).ConfigureAwait(false);
                Console.WriteLine($"Khanh Hoi demo seed: created QR/package {seed.Code}.");
            }

            qr.PoiId = seed.PoiCode is null ? null : pois[seed.PoiCode].Id;
            qr.TourId = seed.TourCode is null ? null : tours[seed.TourCode].Id;
            qr.IsActive = true;
            qr.RequiresPayment = seed.RequiresPayment;
            qr.PriceAmount = seed.PriceAmount;
            qr.AccessDurationMinutes = seed.AccessDurationMinutes;
            qr.UpdatedAt = now;
            qr.DeletedAt = null;

            if (seed.Code == "KHANHHOI_BASIC")
            {
                basicQr = qr;
            }
        }

        if (basicQr is not null)
        {
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            var tokenHash = HashToken(DemoAccessToken);
            var pass = await db.GuestAccessPasses
                .FirstOrDefaultAsync(p => p.TokenHash == tokenHash, cancellationToken)
                .ConfigureAwait(false);

            if (pass is null)
            {
                await db.GuestAccessPasses.AddAsync(
                    new GuestAccessPass
                    {
                        TokenHash = tokenHash,
                        QrLocationId = basicQr.Id,
                        StartsAt = now,
                        ExpiresAt = now.AddDays(30),
                        IsPaid = true,
                        Amount = 0m,
                        Currency = "VND",
                        Status = "Active",
                        CreatedAt = now,
                        UpdatedAt = now
                    },
                    cancellationToken).ConfigureAwait(false);
                Console.WriteLine("Khanh Hoi demo seed: created reusable demo guest access pass.");
            }
        }
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static string ToEnglishName(string code, string fallback) => code switch
    {
        "KHANHHOI_DINH_KHANH_HOI" => "Khanh Hoi Communal House",
        "KHANHHOI_CONG_VIEN" => "Khanh Hoi Park",
        "KHANHHOI_BEN_VAN_DON" => "Ben Van Don Canal Walk",
        "KHANHHOI_CAU_KHANH_HOI" => "Khanh Hoi Bridge Area",
        "KHANHHOI_CAFE_BEN_SONG" => "Riverside Cafe",
        "KHANHHOI_AM_THUC_DIA_PHUONG" => "Khanh Hoi Local Food Stall",
        "KHANHHOI_LUU_NIEM_CAU_CANG" => "Harbor Bridge Souvenir Stall",
        _ => fallback
    };

    private static string ToChineseName(string code, string fallback) => code switch
    {
        "KHANHHOI_DINH_KHANH_HOI" => "庆会亭",
        "KHANHHOI_CONG_VIEN" => "庆会公园",
        "KHANHHOI_BEN_VAN_DON" => "边云屯运河步道",
        "KHANHHOI_CAU_KHANH_HOI" => "庆会桥区域",
        "KHANHHOI_CAFE_BEN_SONG" => "河畔咖啡",
        "KHANHHOI_AM_THUC_DIA_PHUONG" => "庆会本地美食摊",
        "KHANHHOI_LUU_NIEM_CAU_CANG" => "港桥纪念品摊",
        _ => fallback
    };

    private static string ToEnglishDescription(string name) =>
        $"A demo audio-tour stop for {name}, introducing local culture and daily life in Khanh Hoi, District 4.";

    private static string ToChineseDescription(string name) =>
        $"{name} 是庆会第四郡演示路线中的语音导览点，介绍当地文化与日常生活。";

    private static string ToEnglishTourName(string code) =>
        code == "KHANHHOI_WALKING_TOUR" ? "Khanh Hoi Walking Tour" : "Khanh Hoi Food and Local Life";

    private static string ToChineseTourName(string code) =>
        code == "KHANHHOI_WALKING_TOUR" ? "庆会步行路线" : "庆会美食与本地生活";

    private static string ToEnglishTourDescription(string code) =>
        code == "KHANHHOI_WALKING_TOUR"
            ? "A short walking route through cultural stops, canal spaces, and local life in Khanh Hoi."
            : "A demo route through local food, coffee, and community-life stops in Khanh Hoi.";

    private static string ToChineseTourDescription(string code) =>
        code == "KHANHHOI_WALKING_TOUR"
            ? "一条短途步行路线，探索庆会的文化点、运河空间与本地生活。"
            : "一条演示路线，串联庆会的美食、咖啡与社区生活点。";

    private sealed record PoiSeed(
        string Code,
        string Name,
        string Category,
        decimal Latitude,
        decimal Longitude,
        string Description,
        string? OwnerEmail,
        bool IsPublic,
        ApprovalStatus ApprovalStatus,
        PoiLifecycleStatus LifecycleStatus,
        bool PaymentRequired,
        PoiPaymentStatus PaymentStatus)
    {
        public static PoiSeed Active(
            string code,
            string name,
            string category,
            decimal latitude,
            decimal longitude,
            string description,
            string? ownerEmail = null) =>
            new(
                code,
                name,
                category,
                latitude,
                longitude,
                description,
                ownerEmail,
                true,
                ApprovalStatus.Approved,
                PoiLifecycleStatus.Active,
                ownerEmail is not null,
                ownerEmail is null ? PoiPaymentStatus.NotRequired : PoiPaymentStatus.Paid);
    }

    private sealed record TourSeed(
        string Code,
        string Name,
        string Description,
        int EstimatedMinutes,
        string[] PoiCodes);

    private sealed record QrSeed(
        string Code,
        string? PoiCode,
        string? TourCode,
        bool RequiresPayment,
        decimal PriceAmount,
        int AccessDurationMinutes);
}
