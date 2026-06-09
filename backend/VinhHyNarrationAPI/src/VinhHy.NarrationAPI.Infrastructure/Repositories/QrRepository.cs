using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class QrRepository : IQrRepository
{
    private readonly ApplicationDbContext _db;

    public QrRepository(ApplicationDbContext db) => _db = db;

    private IQueryable<QrLocation> Query(bool includeDeleted) =>
        includeDeleted ? _db.QrLocations.IgnoreQueryFilters() : _db.QrLocations;

    public async Task<IReadOnlyList<QrLocation>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Query(includeDeleted: false)
            .AsNoTracking()
            .Include(q => q.Poi)
            .Include(q => q.Tour)
            .OrderBy(q => q.Code)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<QrLocation?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .Include(q => q.Poi)
            .Include(q => q.Tour)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<QrLocation?> GetByCodeAsync(
        string code,
        bool activeOnly = false,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        var query = Query(includeDeleted)
            .Include(q => q.Poi)
            .Include(q => q.Tour)
            .Where(q => q.Code == code);

        if (activeOnly)
        {
            query = query.Where(q => q.IsActive);
        }

        return await query.FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<QrLocation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.QrLocations.IgnoreQueryFilters()
            .Where(q => q.UpdatedAt >= since || (q.DeletedAt != null && q.DeletedAt >= since))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(QrLocation qrLocation, CancellationToken cancellationToken = default) =>
        await _db.QrLocations.AddAsync(qrLocation, cancellationToken).ConfigureAwait(false);

    public void Update(QrLocation qrLocation) => _db.QrLocations.Update(qrLocation);

    public void SoftDelete(QrLocation qrLocation) => _db.QrLocations.Update(qrLocation);
}
