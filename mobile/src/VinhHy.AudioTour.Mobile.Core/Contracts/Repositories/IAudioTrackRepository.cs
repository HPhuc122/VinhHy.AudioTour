using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IAudioTrackRepository
{
    Task<AudioTrackLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<AudioTrackLocal?> GetByPoiAndLanguageAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AudioTrackLocal>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(IEnumerable<AudioTrackLocal> tracks, CancellationToken cancellationToken = default);

    Task UpdateDownloadStateAsync(
        int id,
        bool isDownloaded,
        string? localFilePath,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
