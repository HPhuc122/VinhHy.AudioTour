using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IOfflinePackageRepository
{
    Task<OfflinePackage?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<OfflinePackage?> GetLatestActiveAsync(
        int tourId,
        string languageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OfflinePackage>> GetByTourIdAsync(int tourId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OfflinePackage>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(OfflinePackage package, CancellationToken cancellationToken = default);

    void Update(OfflinePackage package);

    void Delete(OfflinePackage package);
}
