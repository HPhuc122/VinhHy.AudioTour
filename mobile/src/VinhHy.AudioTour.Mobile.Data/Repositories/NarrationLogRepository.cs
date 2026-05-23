using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class NarrationLogRepository(LocalDatabase database) : INarrationLogRepository
{
    public Task<long> InsertAsync(NarrationLogLocal log, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = EntityMapper.FromLocal(log);
                await connection.InsertAsync(entity).ConfigureAwait(false);
                return entity.Id;
            },
            cancellationToken);

    public Task<IReadOnlyList<NarrationLogLocal>> GetPendingSyncAsync(
        int limit,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<NarrationLogEntity>()
                    .Where(l => !l.Synced)
                    .OrderBy(l => l.PlayedAt)
                    .Take(limit)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<NarrationLogLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task MarkSyncedAsync(
        IEnumerable<long> localIds,
        DateTime syncedAt,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var idList = localIds.ToList();
                if (idList.Count == 0)
                {
                    return;
                }

                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var id in idList)
                    {
                        var entity = transaction.Find<NarrationLogEntity>(id);
                        if (entity is null)
                        {
                            continue;
                        }

                        entity.Synced = true;
                        entity.SyncedAt = syncedAt;
                        transaction.Update(entity);
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);
}
