using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class TourRepository : ITourRepository
{
    private readonly ApplicationDbContext _db;

    public TourRepository(ApplicationDbContext db) => _db = db;

    private IQueryable<Tour> Query(bool includeDeleted) =>
        includeDeleted ? _db.Tours.IgnoreQueryFilters() : _db.Tours;

    public async Task<Tour?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .Include(t => t.Translations)
            .Include(t => t.TourPois)
                .ThenInclude(tp => tp.Poi)
                    .ThenInclude(p => p.Translations)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<Tour?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        await _db.Tours.FirstOrDefaultAsync(t => t.Code == code, cancellationToken).ConfigureAwait(false);

    public async Task<(IReadOnlyList<Tour> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? isActive = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Tour> query = Query(includeDeleted)
            .AsNoTracking()
            .Include(t => t.Translations)
            .Include(t => t.TourPois)
                .ThenInclude(tp => tp.Poi)
                    .ThenInclude(p => p.Translations);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(t => t.Code.Contains(search));

        if (isActive.HasValue)
            query = query.Where(t => t.IsActive == isActive.Value);

        var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderBy(t => t.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return (items, total);
    }

    public async Task<int> CountAsync(
        bool? isActive = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Tour> query = Query(includeDeleted).AsNoTracking();

        if (isActive.HasValue)
        {
            query = query.Where(t => t.IsActive == isActive.Value);
        }

        return await query.CountAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<Tour>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.Tours.IgnoreQueryFilters()
            .Where(t => t.UpdatedAt >= since || (t.DeletedAt != null && t.DeletedAt >= since))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(Tour tour, CancellationToken cancellationToken = default) =>
        await _db.Tours.AddAsync(tour, cancellationToken).ConfigureAwait(false);

    public void Update(Tour tour) => _db.Tours.Update(tour);

    public void SoftDelete(Tour tour) => _db.Tours.Update(tour);
}
