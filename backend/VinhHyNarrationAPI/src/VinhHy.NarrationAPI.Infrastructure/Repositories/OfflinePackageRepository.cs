using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class OfflinePackageRepository : IOfflinePackageRepository
{
    private readonly ApplicationDbContext _db;

    public OfflinePackageRepository(ApplicationDbContext db) => _db = db;

    public async Task<OfflinePackage?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.OfflinePackages.FindAsync([id], cancellationToken).ConfigureAwait(false);

    public async Task<OfflinePackage?> GetLatestActiveAsync(
        int tourId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        await _db.OfflinePackages
            .Where(p => p.TourId == tourId && p.LanguageCode == languageCode && p.IsActive)
            .OrderByDescending(p => p.PublishedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<OfflinePackage>> GetByTourIdAsync(
        int tourId,
        CancellationToken cancellationToken = default) =>
        await _db.OfflinePackages
            .Where(p => p.TourId == tourId)
            .OrderByDescending(p => p.PublishedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<OfflinePackage>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.OfflinePackages
            .Where(p => p.PublishedAt >= since)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(OfflinePackage package, CancellationToken cancellationToken = default) =>
        await _db.OfflinePackages.AddAsync(package, cancellationToken).ConfigureAwait(false);

    public void Update(OfflinePackage package) => _db.OfflinePackages.Update(package);

    public void Delete(OfflinePackage package) => _db.OfflinePackages.Remove(package);
}
