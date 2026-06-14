using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class PoiRepository : IPoiRepository
{
    private readonly ApplicationDbContext _db;

    public PoiRepository(ApplicationDbContext db) => _db = db;

    private IQueryable<Poi> Query(bool includeDeleted) =>
        includeDeleted ? _db.Pois.IgnoreQueryFilters() : _db.Pois;

    public async Task<Poi?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<Poi?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        await _db.Pois.FirstOrDefaultAsync(p => p.Code == code, cancellationToken).ConfigureAwait(false);

    public async Task<(IReadOnlyList<Poi> Items, int TotalCount)> GetPagedAsync(
    int page,
    int pageSize,
    string? search = null,
    string? category = null,
    bool? isActive = null,
    bool includeDeleted = false,
    CancellationToken cancellationToken = default)
    {
        // 1. Dùng .Include để lấy kèm dữ liệu Translation
        var query = Query(includeDeleted)
            .Include(p => p.Translations)
            .AsNoTracking();

        // 2. Tìm kiếm đúng vào thuộc tính Name của Translation
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Code.Contains(search) ||
                p.Translations.Any(t => t.Name.Contains(search))
            );
        }

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);

        if (isActive.HasValue)
            query = query.Where(p => p.IsActive == isActive.Value);

        var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderBy(p => p.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return (items, total);
    }

    public async Task<IReadOnlyList<Poi>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.Pois.IgnoreQueryFilters()
            .Where(p => p.UpdatedAt >= since || (p.DeletedAt != null && p.DeletedAt >= since))
            .OrderBy(p => p.UpdatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<Poi>> GetActiveInBoundsAsync(
        decimal minLat,
        decimal maxLat,
        decimal minLon,
        decimal maxLon,
        CancellationToken cancellationToken = default) =>
        await _db.Pois
            .Where(p => p.IsActive
                && p.Latitude >= minLat && p.Latitude <= maxLat
                && p.Longitude >= minLon && p.Longitude <= maxLon)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(Poi poi, CancellationToken cancellationToken = default) =>
        await _db.Pois.AddAsync(poi, cancellationToken).ConfigureAwait(false);

    public void Update(Poi poi) => _db.Pois.Update(poi);

    public void SoftDelete(Poi poi) => _db.Pois.Update(poi);
}
