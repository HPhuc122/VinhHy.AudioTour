using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface INarrationLogRepository
{
    Task<NarrationLog?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NarrationLog>> GetUnsyncedAsync(
        int take,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<NarrationLog> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        int? poiId = null,
        int? userId = null,
        string? deviceId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(NarrationLog log, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<NarrationLog> logs, CancellationToken cancellationToken = default);

    void Update(NarrationLog log);
}
