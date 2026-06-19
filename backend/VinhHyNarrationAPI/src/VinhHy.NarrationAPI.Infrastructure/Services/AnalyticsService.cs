using AutoMapper;
using Microsoft.EntityFrameworkCore;
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
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _db;

    public AnalyticsService(IUnitOfWork uow, IMapper mapper, ApplicationDbContext db)
    {
        _uow = uow;
        _mapper = mapper;
        _db = db;
    }

    public async Task<IReadOnlyList<AnalyticsDailyDto>> GetDailyAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var from = filter.From?.ToDateTime(TimeOnly.MinValue) ?? DateTime.UtcNow.AddDays(-30);
        var to = filter.To?.ToDateTime(TimeOnly.MaxValue) ?? DateTime.UtcNow;

        var records = await _uow.Analytics.GetByDateRangeAsync(from, to, filter.POIId, cancellationToken)
            .ConfigureAwait(false);

        return _mapper.Map<IReadOnlyList<AnalyticsDailyDto>>(records);
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
        return new DashboardStatsDto
        {
            TotalPois = await _db.Pois.AsNoTracking().CountAsync(cancellationToken).ConfigureAwait(false),
            TotalTours = await _uow.Tours.CountAsync(cancellationToken: cancellationToken).ConfigureAwait(false),
            ActiveTours = await _uow.Tours.CountAsync(isActive: true, cancellationToken: cancellationToken).ConfigureAwait(false),
            TotalQrCodes = await _uow.QrLocations.CountAsync(cancellationToken: cancellationToken).ConfigureAwait(false),
            ActiveQrCodes = await _uow.QrLocations.CountAsync(isActive: true, cancellationToken: cancellationToken).ConfigureAwait(false),
            TotalMediaFiles = await _uow.MediaFiles.CountAsync(cancellationToken: cancellationToken).ConfigureAwait(false),
            TotalImages = await _uow.MediaFiles.CountAsync(fileType: "image", cancellationToken: cancellationToken).ConfigureAwait(false),
            TotalAudioFiles = await _uow.MediaFiles.CountAsync(fileType: "audio", cancellationToken: cancellationToken).ConfigureAwait(false),
            DeletedMediaFiles = await _uow.MediaFiles.CountAsync(isDeleted: true, cancellationToken: cancellationToken).ConfigureAwait(false),
            PendingImages = await _uow.MediaFiles.CountAsync(
                fileType: "image",
                approvalStatus: ApprovalStatuses.Pending,
                cancellationToken: cancellationToken).ConfigureAwait(false),
            PendingNarrations = await _db.NarrationDrafts.CountAsync(
                n => n.Status == NarrationDraftStatuses.Pending,
                cancellationToken).ConfigureAwait(false),
            PendingReviewPois = await CountPoisByLifecycleAsync(PoiLifecycleStatus.PendingReview, cancellationToken).ConfigureAwait(false),
            ApprovedPois = await CountPoisByLifecycleAsync(PoiLifecycleStatus.Approved, cancellationToken).ConfigureAwait(false),
            PendingPaymentPois = await CountPoisByLifecycleAsync(PoiLifecycleStatus.PendingPayment, cancellationToken).ConfigureAwait(false),
            ActivePois = await CountActivePoisAsync(cancellationToken).ConfigureAwait(false),
            ExpiredPois = await CountExpiredPoisAsync(cancellationToken).ConfigureAwait(false),
            RejectedPois = await CountPoisByLifecycleAsync(PoiLifecycleStatus.Rejected, cancellationToken).ConfigureAwait(false),
            TotalTourViews = null,
            TotalQrScans = await _uow.NarrationLogs.CountAsync(TriggerTypes.Qr, cancellationToken).ConfigureAwait(false),
            TotalAudioPlays = await _uow.NarrationLogs.CountAsync(cancellationToken: cancellationToken).ConfigureAwait(false)
        };
    }

    private async Task<int> CountPoisByLifecycleAsync(
        PoiLifecycleStatus lifecycleStatus,
        CancellationToken cancellationToken) =>
        await _db.Pois
            .AsNoTracking()
            .CountAsync(p => p.LifecycleStatus == lifecycleStatus, cancellationToken)
            .ConfigureAwait(false);

    private async Task<int> CountActivePoisAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await _db.Pois
            .AsNoTracking()
            .CountAsync(
                p => p.LifecycleStatus == PoiLifecycleStatus.Active
                    && p.IsActive
                    && (!p.ValidFrom.HasValue || p.ValidFrom.Value <= now)
                    && (!p.ValidUntil.HasValue || p.ValidUntil.Value >= now),
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<int> CountExpiredPoisAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await _db.Pois
            .AsNoTracking()
            .CountAsync(
                p => p.LifecycleStatus == PoiLifecycleStatus.Expired
                    || (p.LifecycleStatus == PoiLifecycleStatus.Active
                        && p.ValidUntil.HasValue
                        && p.ValidUntil.Value < now),
                cancellationToken)
            .ConfigureAwait(false);
    }
}
