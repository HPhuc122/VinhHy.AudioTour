using VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IAnalyticsService
{
    Task<IReadOnlyList<AnalyticsDailyDto>> GetDailyAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken = default);

    Task<AnalyticsSummaryDto> GetSummaryAsync(
        AnalyticsQueryFilter filter,
        CancellationToken cancellationToken = default);
}
