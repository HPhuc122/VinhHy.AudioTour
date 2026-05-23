using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class QrLocationRepository : IQrLocationRepository
{
    private readonly ApplicationDbContext _db;

    public QrLocationRepository(ApplicationDbContext db) => _db = db;

    private IQueryable<QrLocation> Query(bool includeDeleted) =>
        includeDeleted ? _db.QrLocations.IgnoreQueryFilters() : _db.QrLocations;

    public async Task<QrLocation?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<QrLocation?> GetByQrCodeAsync(string qrCode, CancellationToken cancellationToken = default) =>
        await _db.QrLocations
            .Include(q => q.Poi)
            .FirstOrDefaultAsync(q => q.QRCode == qrCode && q.IsActive, cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<QrLocation>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default) =>
        await _db.QrLocations.Where(q => q.POIId == poiId).ToListAsync(cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<QrLocation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.QrLocations.IgnoreQueryFilters()
            .Where(q => q.CreatedAt >= since || (q.DeletedAt != null && q.DeletedAt >= since))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(QrLocation qrLocation, CancellationToken cancellationToken = default) =>
        await _db.QrLocations.AddAsync(qrLocation, cancellationToken).ConfigureAwait(false);

    public void Update(QrLocation qrLocation) => _db.QrLocations.Update(qrLocation);

    public void SoftDelete(QrLocation qrLocation) => _db.QrLocations.Update(qrLocation);
}
