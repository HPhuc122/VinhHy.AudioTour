using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class NarrationLogRepository : INarrationLogRepository
{
    private readonly ApplicationDbContext _db;

    public NarrationLogRepository(ApplicationDbContext db) => _db = db;

    public async Task<NarrationLog?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        await _db.NarrationLogs.FindAsync([id], cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<NarrationLog>> GetUnsyncedAsync(
        int take,
        CancellationToken cancellationToken = default) =>
        await _db.NarrationLogs
            .Where(l => !l.Synced)
            .OrderBy(l => l.PlayedAt)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<(IReadOnlyList<NarrationLog> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        int? poiId = null,
        int? userId = null,
        string? deviceId = null,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = _db.NarrationLogs.AsNoTracking();

        if (poiId.HasValue)
            query = query.Where(l => l.POIId == poiId.Value);

        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId.Value);

        if (!string.IsNullOrWhiteSpace(deviceId))
            query = query.Where(l => l.DeviceId == deviceId);

        if (from.HasValue)
            query = query.Where(l => l.PlayedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(l => l.PlayedAt <= to.Value);

        var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(l => l.PlayedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return (items, total);
    }

    public async Task AddAsync(NarrationLog log, CancellationToken cancellationToken = default) =>
        await _db.NarrationLogs.AddAsync(log, cancellationToken).ConfigureAwait(false);

    public async Task AddRangeAsync(IEnumerable<NarrationLog> logs, CancellationToken cancellationToken = default) =>
        await _db.NarrationLogs.AddRangeAsync(logs, cancellationToken).ConfigureAwait(false);

    public void Update(NarrationLog log) => _db.NarrationLogs.Update(log);
}
