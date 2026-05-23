using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IAudioTrackRepository
{
    Task<AudioTrack?> GetByIdAsync(int id, bool includeDeleted = false, CancellationToken cancellationToken = default);

    Task<AudioTrack?> GetByPoiAndLanguageAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AudioTrack>> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AudioTrack>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(AudioTrack track, CancellationToken cancellationToken = default);

    void Update(AudioTrack track);

    void SoftDelete(AudioTrack track);
}
