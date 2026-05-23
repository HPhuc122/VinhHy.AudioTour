using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class AudioTrackRepository(LocalDatabase database) : IAudioTrackRepository
{
    public Task<AudioTrackLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<AudioTrackEntity>(id).ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<AudioTrackLocal?> GetByPoiAndLanguageAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.Table<AudioTrackEntity>()
                    .Where(t => t.PoiId == poiId && t.LanguageCode == languageCode)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<IReadOnlyList<AudioTrackLocal>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<AudioTrackEntity>()
                    .Where(t => t.PoiId == poiId)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<AudioTrackLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertRangeAsync(
        IEnumerable<AudioTrackLocal> tracks,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var track in tracks)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(track));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task UpdateDownloadStateAsync(
        int id,
        bool isDownloaded,
        string? localFilePath,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<AudioTrackEntity>(id).ConfigureAwait(false);
                if (entity is null)
                {
                    return;
                }

                entity.IsDownloaded = isDownloaded;
                entity.LocalFilePath = localFilePath;
                await connection.UpdateAsync(entity).ConfigureAwait(false);
            },
            cancellationToken);

    public Task DeleteAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.DeleteAsync<AudioTrackEntity>(id),
            cancellationToken);
}
