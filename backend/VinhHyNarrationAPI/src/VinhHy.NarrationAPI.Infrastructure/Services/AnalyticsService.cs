using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _uow;
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly PresenceStore _presence;

    public AnalyticsService(
        IUnitOfWork uow,
        ApplicationDbContext db,
        IHttpContextAccessor httpContextAccessor,
        PresenceStore presence)
    {
        _uow = uow;
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _presence = presence;
    }

    public async Task<IReadOnlyList<AnalyticsDailyDto>> GetDailyAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = await BuildAnalyticsLogQueryAsync(filter, cancellationToken).ConfigureAwait(false);
        var logs = await query
            .Select(log => new
            {
                log.POIId,
                PoiCode = log.Poi.Code,
                log.PlayedAt,
                log.TriggerType,
                log.DeviceId
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return logs
            .GroupBy(log => new { log.POIId, log.PoiCode, Date = DateOnly.FromDateTime(log.PlayedAt) })
            .OrderBy(group => group.Key.Date)
            .ThenBy(group => group.Key.PoiCode)
            .Select(group => new AnalyticsDailyDto
            {
                POIId = group.Key.POIId,
                PoiCode = group.Key.PoiCode,
                Date = group.Key.Date,
                TotalPlays = group.Count(),
                GpsPlays = group.Count(log => log.TriggerType == TriggerTypes.Gps),
                QrPlays = group.Count(log => log.TriggerType == TriggerTypes.Qr),
                ManualPlays = group.Count(log => log.TriggerType == TriggerTypes.Manual),
                UniqueDevices = group
                    .Where(log => !string.IsNullOrWhiteSpace(log.DeviceId))
                    .Select(log => log.DeviceId)
                    .Distinct()
                    .Count()
            })
            .ToArray();
    }

    public async Task<IReadOnlyList<AnalyticsGroupedDto>> GetGroupedAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = await BuildAnalyticsLogQueryAsync(filter, cancellationToken).ConfigureAwait(false);
        var logs = await query
            .Select(log => new
            {
                log.PlayedAt,
                log.TriggerType,
                log.DeviceId
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var grouped = logs
            .GroupBy(log => GetGroupKey(log.PlayedAt, filter.GroupBy))
            .ToDictionary(
                group => group.Key.Key,
                group => new AnalyticsGroupedDto
                {
                    Key = group.Key.Key,
                    Label = group.Key.Label,
                    SortOrder = group.Key.SortOrder,
                    TotalPlays = group.Count(),
                    GpsPlays = group.Count(log => log.TriggerType == TriggerTypes.Gps),
                    QrPlays = group.Count(log => log.TriggerType == TriggerTypes.Qr),
                    ManualPlays = group.Count(log => log.TriggerType == TriggerTypes.Manual),
                    UniqueDevices = group
                        .Where(log => !string.IsNullOrWhiteSpace(log.DeviceId))
                        .Select(log => log.DeviceId)
                        .Distinct()
                        .Count()
                });

        return GetEmptyGroupBuckets(filter)
            .Select(bucket => grouped.TryGetValue(bucket.Key, out var existing)
                ? existing
                : bucket)
            .OrderBy(item => item.SortOrder)
            .ToArray();
    }

    private static IReadOnlyList<AnalyticsGroupedDto> GetEmptyGroupBuckets(AnalyticsQueryFilter filter)
    {
        return filter.GroupBy switch
        {
            AnalyticsGroupBy.Hour => Enumerable.Range(0, 24)
                .Select(hour => new AnalyticsGroupedDto
                {
                    Key = hour.ToString("00"),
                    Label = (hour + 1).ToString(),
                    SortOrder = hour
                })
                .ToArray(),
            AnalyticsGroupBy.DayOfWeek => new[]
            {
                CreateEmptyGroup("1", GetDayOfWeekLabel(DayOfWeek.Monday), 1),
                CreateEmptyGroup("2", GetDayOfWeekLabel(DayOfWeek.Tuesday), 2),
                CreateEmptyGroup("3", GetDayOfWeekLabel(DayOfWeek.Wednesday), 3),
                CreateEmptyGroup("4", GetDayOfWeekLabel(DayOfWeek.Thursday), 4),
                CreateEmptyGroup("5", GetDayOfWeekLabel(DayOfWeek.Friday), 5),
                CreateEmptyGroup("6", GetDayOfWeekLabel(DayOfWeek.Saturday), 6),
                CreateEmptyGroup("0", GetDayOfWeekLabel(DayOfWeek.Sunday), 7)
            },
            AnalyticsGroupBy.WeekOfMonth => Enumerable.Range(1, 4)
                .Select(week => new AnalyticsGroupedDto
                {
                    Key = $"W{week}",
                    Label = $"Tuần {week}",
                    SortOrder = week
                })
                .ToArray(),
            AnalyticsGroupBy.MonthOfYear => Enumerable.Range(1, 12)
                .Select(month => new AnalyticsGroupedDto
                {
                    Key = month.ToString("00"),
                    Label = $"Tháng {month}",
                    SortOrder = month
                })
                .ToArray(),
            _ => GetDayOfMonthBuckets(filter)
        };
    }

    private static IReadOnlyList<AnalyticsGroupedDto> GetDayOfMonthBuckets(AnalyticsQueryFilter filter)
    {
        var ictNow = DateTime.UtcNow.Add(IctOffset);
        var from = filter.From ?? new DateOnly(ictNow.Year, ictNow.Month, 1);
        var to = filter.To ?? DateOnly.FromDateTime(ictNow);
        var days = from.Year == to.Year && from.Month == to.Month
            ? DateTime.DaysInMonth(from.Year, from.Month)
            : 31;

        return Enumerable.Range(1, days)
            .Select(day => new AnalyticsGroupedDto
            {
                Key = day.ToString("00"),
                Label = $"Ngày {day}",
                SortOrder = day
            })
            .ToArray();
    }

    private static AnalyticsGroupedDto CreateEmptyGroup(string key, string label, int sortOrder) =>
        new()
        {
            Key = key,
            Label = label,
            SortOrder = sortOrder
        };

    public async Task<AnalyticsSummaryDto> GetSummaryAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var daily = await GetDailyAsync(filter, cancellationToken).ConfigureAwait(false);

        return new AnalyticsSummaryDto
        {
            TotalPlays = daily.Sum(d => d.TotalPlays),
            GpsPlays = daily.Sum(d => d.GpsPlays),
            QrPlays = daily.Sum(d => d.QrPlays),
            ManualPlays = daily.Sum(d => d.ManualPlays),
            UniqueDevices = daily.Sum(d => d.UniqueDevices),
            From = filter.From,
            To = filter.To
        };
    }

    private async Task<IQueryable<NarrationLog>> BuildAnalyticsLogQueryAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken)
    {
        // Frontend sends dates in ICT (UTC+7). Convert the day boundaries to UTC
        // so the WHERE clause spans the correct wall-clock range in the database.
        // e.g. ICT 2026-06-25 00:00 → UTC 2026-06-24 17:00
        var ictNow = DateTime.UtcNow.Add(IctOffset);
        var from = filter.From.HasValue
            ? filter.From.Value.ToDateTime(TimeOnly.MinValue).Subtract(IctOffset)   // ICT midnight → UTC
            : ictNow.AddDays(-30).Date.Subtract(IctOffset);
        var to = filter.To.HasValue
            ? filter.To.Value.ToDateTime(TimeOnly.MaxValue).Subtract(IctOffset)     // ICT 23:59:59 → UTC
            : ictNow.Date.Add(TimeSpan.FromHours(23).Add(TimeSpan.FromMinutes(59)).Add(TimeSpan.FromSeconds(59))).Subtract(IctOffset);
        var ownerUserId = GetVendorOwnerUserId();
        var poiCode = string.IsNullOrWhiteSpace(filter.PoiCode) ? null : filter.PoiCode.Trim();

        if (ownerUserId.HasValue && filter.POIId.HasValue)
        {
            await EnsureVendorOwnsPoiAsync(filter.POIId.Value, ownerUserId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        if (ownerUserId.HasValue && poiCode is not null)
        {
            await EnsureVendorOwnsPoiAsync(poiCode, ownerUserId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        var query = _db.NarrationLogs
            .AsNoTracking()
            .Where(log => log.PlayedAt >= from && log.PlayedAt <= to);

        if (filter.POIId.HasValue)
        {
            query = query.Where(log => log.POIId == filter.POIId.Value);
        }

        if (poiCode is not null)
        {
            query = query.Where(log => log.Poi.Code == poiCode);
        }

        if (ownerUserId.HasValue)
        {
            query = query.Where(log => log.Poi.UserId == ownerUserId.Value);
        }

        return query;
    }

    /// <summary>Indochina Time offset (UTC+7). Fixed offset — Vietnam does not use DST.</summary>
    private static readonly TimeSpan IctOffset = TimeSpan.FromHours(7);

    private static (string Key, string Label, int SortOrder) GetGroupKey(DateTime playedAt, AnalyticsGroupBy groupBy)
    {
        // PlayedAt is stored as UTC. Convert to ICT (UTC+7) before extracting
        // hour / day-of-week etc., otherwise a play at 01:00 UTC (= 08:00 ICT)
        // would be bucketed as hour 1 instead of hour 8.
        var localTime = playedAt.Add(IctOffset);

        return groupBy switch
        {
            AnalyticsGroupBy.Hour => (
                localTime.Hour.ToString("00"),
                (localTime.Hour + 1).ToString(),
                localTime.Hour),
            AnalyticsGroupBy.DayOfWeek => (
                ((int)localTime.DayOfWeek).ToString(),
                GetDayOfWeekLabel(localTime.DayOfWeek),
                GetDayOfWeekSortOrder(localTime.DayOfWeek)),
            AnalyticsGroupBy.WeekOfMonth => (
                $"W{GetWeekOfMonth(localTime)}",
                $"Tuần {GetWeekOfMonth(localTime)}",
                GetWeekOfMonth(localTime)),
            AnalyticsGroupBy.MonthOfYear => (
                localTime.Month.ToString("00"),
                $"Tháng {localTime.Month}",
                localTime.Month),
            _ => (
                localTime.Day.ToString("00"),
                $"Ngày {localTime.Day}",
                localTime.Day)
        };
    }

    private static int GetDayOfWeekSortOrder(DayOfWeek dayOfWeek) =>
        dayOfWeek == DayOfWeek.Sunday ? 7 : (int)dayOfWeek;

    private static int GetWeekOfMonth(DateTime value) =>
        Math.Min(4, ((value.Day - 1) / 7) + 1);

    private static string GetDayOfWeekLabel(DayOfWeek dayOfWeek) =>
        dayOfWeek switch
        {
            DayOfWeek.Monday => "Thứ 2",
            DayOfWeek.Tuesday => "Thứ 3",
            DayOfWeek.Wednesday => "Thứ 4",
            DayOfWeek.Thursday => "Thứ 5",
            DayOfWeek.Friday => "Thứ 6",
            DayOfWeek.Saturday => "Thứ 7",
            _ => "Chủ nhật"
        };

    public async Task<DashboardStatsDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var ownerUserId = GetVendorOwnerUserId();
        var poiQuery = _db.Pois.AsNoTracking();
        var mediaQuery = _db.MediaFiles.AsNoTracking();
        var siteNarrationQuery = _db.NarrationLogs.AsNoTracking();
        var narrationQuery = _db.NarrationLogs.AsNoTracking();
        var qrQuery = _db.QrLocations.AsNoTracking();

        if (ownerUserId.HasValue)
        {
            poiQuery = poiQuery.Where(p => p.UserId == ownerUserId.Value);
            mediaQuery = mediaQuery.Where(m => m.PoiId.HasValue && m.Poi != null && m.Poi.UserId == ownerUserId.Value);
            narrationQuery = narrationQuery.Where(n => n.Poi.UserId == ownerUserId.Value);
            qrQuery = qrQuery.Where(q => q.PoiId.HasValue && q.Poi != null && q.Poi.UserId == ownerUserId.Value);
        }

        return new DashboardStatsDto
        {
            TotalPois = await poiQuery.CountAsync(cancellationToken).ConfigureAwait(false),
            TotalTours = ownerUserId.HasValue
                ? 0
                : await _uow.Tours.CountAsync(cancellationToken: cancellationToken).ConfigureAwait(false),
            ActiveTours = ownerUserId.HasValue
                ? 0
                : await _uow.Tours.CountAsync(isActive: true, cancellationToken: cancellationToken).ConfigureAwait(false),
            TotalQrCodes = await qrQuery.CountAsync(cancellationToken).ConfigureAwait(false),
            ActiveQrCodes = await qrQuery.CountAsync(q => q.IsActive, cancellationToken).ConfigureAwait(false),
            TotalMediaFiles = await mediaQuery.CountAsync(cancellationToken).ConfigureAwait(false),
            TotalImages = await mediaQuery.CountAsync(m => m.FileType == "image", cancellationToken).ConfigureAwait(false),
            TotalAudioFiles = await mediaQuery.CountAsync(m => m.FileType == "audio", cancellationToken).ConfigureAwait(false),
            DeletedMediaFiles = await mediaQuery.CountAsync(m => m.IsDeleted, cancellationToken).ConfigureAwait(false),
            PendingImages = await mediaQuery.CountAsync(
                m => m.FileType == "image" && m.ApprovalStatus == ApprovalStatuses.Pending,
                cancellationToken).ConfigureAwait(false),
            PendingNarrations = await BuildNarrationDraftQuery(ownerUserId).CountAsync(
                n => n.Status == NarrationDraftStatuses.Pending,
                cancellationToken).ConfigureAwait(false),
            PendingReviewPois = await CountPoisByLifecycleAsync(poiQuery, PoiLifecycleStatus.PendingReview, cancellationToken).ConfigureAwait(false),
            ApprovedPois = await CountPoisByLifecycleAsync(poiQuery, PoiLifecycleStatus.Approved, cancellationToken).ConfigureAwait(false),
            PendingPaymentPois = await CountPoisByLifecycleAsync(poiQuery, PoiLifecycleStatus.PendingPayment, cancellationToken).ConfigureAwait(false),
            ActivePois = await CountActivePoisAsync(poiQuery, cancellationToken).ConfigureAwait(false),
            ExpiredPois = await CountExpiredPoisAsync(poiQuery, cancellationToken).ConfigureAwait(false),
            RejectedPois = await CountPoisByLifecycleAsync(poiQuery, PoiLifecycleStatus.Rejected, cancellationToken).ConfigureAwait(false),
            TotalTourViews = null,
            TotalQrScans = await narrationQuery.CountAsync(n => n.TriggerType == TriggerTypes.Qr, cancellationToken).ConfigureAwait(false),
            TotalAudioPlays = await narrationQuery.CountAsync(cancellationToken).ConfigureAwait(false),
            TotalSiteVisits = await siteNarrationQuery.CountAsync(cancellationToken).ConfigureAwait(false),
            TotalVendorPoiVisits = ownerUserId.HasValue
                ? await narrationQuery.CountAsync(cancellationToken).ConfigureAwait(false)
                : null,
            ActiveVisitors = _presence.CountActive(),
            ActiveVisitorsByPoi = ownerUserId.HasValue
                ? await GetVendorPrimaryPoiActiveVisitorsAsync(ownerUserId.Value, cancellationToken).ConfigureAwait(false)
                : null
        };
    }

    private async Task<int> CountPoisByLifecycleAsync(
        IQueryable<Poi> query,
        PoiLifecycleStatus lifecycleStatus,
        CancellationToken cancellationToken) =>
        await query.CountAsync(p => p.LifecycleStatus == lifecycleStatus, cancellationToken)
            .ConfigureAwait(false);

    private async Task<int> CountActivePoisAsync(IQueryable<Poi> query, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await query
            .CountAsync(
                p => p.LifecycleStatus == PoiLifecycleStatus.Active
                    && p.IsActive
                    && (!p.ValidFrom.HasValue || p.ValidFrom.Value <= now)
                    && (!p.ValidUntil.HasValue || p.ValidUntil.Value >= now),
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<int> CountExpiredPoisAsync(IQueryable<Poi> query, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await query
            .CountAsync(
                p => p.LifecycleStatus == PoiLifecycleStatus.Expired
                    || (p.LifecycleStatus == PoiLifecycleStatus.Active
                        && p.ValidUntil.HasValue
                        && p.ValidUntil.Value < now),
                cancellationToken)
            .ConfigureAwait(false);
    }

    private IQueryable<NarrationDraft> BuildNarrationDraftQuery(int? ownerUserId)
    {
        var query = _db.NarrationDrafts.AsNoTracking();

        return ownerUserId.HasValue
            ? query.Where(n => n.Poi.UserId == ownerUserId.Value)
            : query;
    }


    private async Task<int> GetVendorPrimaryPoiActiveVisitorsAsync(int ownerUserId, CancellationToken cancellationToken)
    {
        var primaryPoiCode = await _db.Pois
            .AsNoTracking()
            .Where(p => p.UserId == ownerUserId)
            .OrderBy(p =>
                p.LifecycleStatus == PoiLifecycleStatus.PendingPayment ? 0 :
                p.LifecycleStatus == PoiLifecycleStatus.PendingReview  ? 1 :
                p.LifecycleStatus == PoiLifecycleStatus.Approved       ? 2 :
                p.LifecycleStatus == PoiLifecycleStatus.Active         ? 3 :
                p.LifecycleStatus == PoiLifecycleStatus.Rejected       ? 4 : 5)
            .Select(p => p.Code)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        return primaryPoiCode is null ? 0 : _presence.CountActiveByPoi(primaryPoiCode);
    }

    private int? GetVendorOwnerUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.FindFirst(ClaimTypes.Role)?.Value != RoleNames.Vendor)
        {
            return null;
        }

        var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedException("Missing authenticated user id.");
    }

    private async Task EnsureVendorOwnsPoiAsync(
        int poiId,
        int ownerUserId,
        CancellationToken cancellationToken)
    {
        var ownsPoi = await _db.Pois
            .AsNoTracking()
            .AnyAsync(p => p.Id == poiId && p.UserId == ownerUserId, cancellationToken)
            .ConfigureAwait(false);

        if (!ownsPoi)
        {
            throw new ForbiddenException("Vendors can only view analytics for their own POIs.");
        }
    }

    private async Task EnsureVendorOwnsPoiAsync(
        string poiCode,
        int ownerUserId,
        CancellationToken cancellationToken)
    {
        var ownsPoi = await _db.Pois
            .AsNoTracking()
            .AnyAsync(p => p.Code == poiCode && p.UserId == ownerUserId, cancellationToken)
            .ConfigureAwait(false);

        if (!ownsPoi)
        {
            throw new ForbiddenException("Vendors can only view analytics for their own POIs.");
        }
    }
}
