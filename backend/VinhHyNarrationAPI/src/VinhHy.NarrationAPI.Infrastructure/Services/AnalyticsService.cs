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
        var from = filter.From?.ToDateTime(TimeOnly.MinValue) ?? DateTime.UtcNow.AddDays(-30);
        var to = filter.To?.ToDateTime(TimeOnly.MaxValue) ?? DateTime.UtcNow;
        var ownerUserId = GetVendorOwnerUserId();

        if (ownerUserId.HasValue && filter.POIId.HasValue)
        {
            await EnsureVendorOwnsPoiAsync(filter.POIId.Value, ownerUserId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        var query = _db.NarrationLogs
            .AsNoTracking()
            .Where(log => log.PlayedAt >= from && log.PlayedAt <= to);

        if (filter.POIId.HasValue)
        {
            query = query.Where(log => log.POIId == filter.POIId.Value);
        }

        if (ownerUserId.HasValue)
        {
            query = query.Where(log => log.Poi.UserId == ownerUserId.Value);
        }

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
}
