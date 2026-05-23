using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IOfflinePackageRepository
{
    Task<OfflinePackageLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OfflinePackageLocal>> GetByTourAsync(
        int tourId,
        string? languageCode = null,
        CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(IEnumerable<OfflinePackageLocal> packages, CancellationToken cancellationToken = default);

    Task UpdateDownloadStateAsync(
        int id,
        bool isDownloaded,
        DateTime? downloadedAt,
        CancellationToken cancellationToken = default);
}
