using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class AnalyticsRepository : IAnalyticsRepository
{
    private readonly ApplicationDbContext _db;

    public AnalyticsRepository(ApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<AnalyticsDaily>> GetByDateRangeAsync(
        DateTime from,
        DateTime to,
        int? poiId = null,
        CancellationToken cancellationToken = default)
    {
        var fromDate = DateOnly.FromDateTime(from);
        var toDate = DateOnly.FromDateTime(to);

        var query = _db.AnalyticsDaily
            .Include(a => a.Poi)
            .Where(a => a.Date >= fromDate && a.Date <= toDate);

        if (poiId.HasValue)
            query = query.Where(a => a.POIId == poiId.Value);

        return await query
            .OrderBy(a => a.Date)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AnalyticsDaily>> GetByPoiIdAsync(
        int poiId,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = _db.AnalyticsDaily
            .Include(a => a.Poi)
            .Where(a => a.POIId == poiId);

        if (from.HasValue)
            query = query.Where(a => a.Date >= DateOnly.FromDateTime(from.Value));

        if (to.HasValue)
            query = query.Where(a => a.Date <= DateOnly.FromDateTime(to.Value));

        return await query
            .OrderByDescending(a => a.Date)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task UpsertDailyAsync(AnalyticsDaily record, CancellationToken cancellationToken = default)
    {
        var existing = await _db.AnalyticsDaily
            .FirstOrDefaultAsync(
                a => a.POIId == record.POIId && a.Date == record.Date,
                cancellationToken)
            .ConfigureAwait(false);

        if (existing is null)
            await _db.AnalyticsDaily.AddAsync(record, cancellationToken).ConfigureAwait(false);
        else
        {
            existing.TotalPlays = record.TotalPlays;
            existing.GpsPlays = record.GpsPlays;
            existing.QrPlays = record.QrPlays;
            existing.ManualPlays = record.ManualPlays;
            existing.UniqueDevices = record.UniqueDevices;
            _db.AnalyticsDaily.Update(existing);
        }
    }
}
