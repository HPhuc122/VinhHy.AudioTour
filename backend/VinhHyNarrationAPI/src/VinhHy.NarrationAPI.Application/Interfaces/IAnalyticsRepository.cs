using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IAnalyticsRepository
{
    Task<IReadOnlyList<AnalyticsDaily>> GetByDateRangeAsync(
        DateTime from,
        DateTime to,
        int? poiId = null,
        int? ownerUserId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AnalyticsDaily>> GetByPoiIdAsync(
        int poiId,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default);

    Task UpsertDailyAsync(AnalyticsDaily record, CancellationToken cancellationToken = default);
}
