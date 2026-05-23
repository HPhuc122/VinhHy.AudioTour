using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class OfflinePackageRepository(LocalDatabase database) : IOfflinePackageRepository
{
    public Task<OfflinePackageLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<OfflinePackageEntity>(id).ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<IReadOnlyList<OfflinePackageLocal>> GetByTourAsync(
        int tourId,
        string? languageCode = null,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var query = connection.Table<OfflinePackageEntity>().Where(p => p.TourId == tourId);
                if (!string.IsNullOrEmpty(languageCode))
                {
                    query = query.Where(p => p.LanguageCode == languageCode);
                }

                var entities = await query.ToListAsync().ConfigureAwait(false);
                return (IReadOnlyList<OfflinePackageLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertRangeAsync(
        IEnumerable<OfflinePackageLocal> packages,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var package in packages)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(package));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task UpdateDownloadStateAsync(
        int id,
        bool isDownloaded,
        DateTime? downloadedAt,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<OfflinePackageEntity>(id).ConfigureAwait(false);
                if (entity is null)
                {
                    return;
                }

                entity.IsDownloaded = isDownloaded;
                entity.DownloadedAt = downloadedAt;
                await connection.UpdateAsync(entity).ConfigureAwait(false);
            },
            cancellationToken);
}
