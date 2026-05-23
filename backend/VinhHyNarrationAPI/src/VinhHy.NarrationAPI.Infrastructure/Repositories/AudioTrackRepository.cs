using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class AudioTrackRepository : IAudioTrackRepository
{
    private readonly ApplicationDbContext _db;

    public AudioTrackRepository(ApplicationDbContext db) => _db = db;

    private IQueryable<AudioTrack> Query(bool includeDeleted) =>
        includeDeleted ? _db.AudioTracks.IgnoreQueryFilters() : _db.AudioTracks;

    public async Task<AudioTrack?> GetByIdAsync(
        int id,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default) =>
        await Query(includeDeleted)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public async Task<AudioTrack?> GetByPoiAndLanguageAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        await _db.AudioTracks
            .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode == languageCode, cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<AudioTrack>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default) =>
        await _db.AudioTracks.Where(t => t.POIId == poiId).ToListAsync(cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<AudioTrack>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.AudioTracks.IgnoreQueryFilters()
            .Where(t => t.UpdatedAt >= since || (t.DeletedAt != null && t.DeletedAt >= since))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(AudioTrack track, CancellationToken cancellationToken = default) =>
        await _db.AudioTracks.AddAsync(track, cancellationToken).ConfigureAwait(false);

    public void Update(AudioTrack track) => _db.AudioTracks.Update(track);

    public void SoftDelete(AudioTrack track) => _db.AudioTracks.Update(track);
}
