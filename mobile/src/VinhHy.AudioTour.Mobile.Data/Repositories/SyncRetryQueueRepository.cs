using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class SyncRetryQueueRepository(LocalDatabase database) : ISyncRetryQueueRepository
{
    public Task EnqueueAsync(SyncRetryItemLocal item, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                item.CreatedAt = item.CreatedAt == default ? DateTime.UtcNow : item.CreatedAt;
                await connection.InsertAsync(EntityMapper.FromLocal(item)).ConfigureAwait(false);
            },
            cancellationToken);

    public Task<IReadOnlyList<SyncRetryItemLocal>> GetDueAsync(
        DateTime utcNow,
        int limit,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<SyncRetryQueueEntity>()
                    .Where(q => q.NextAttemptAt <= utcNow)
                    .OrderBy(q => q.NextAttemptAt)
                    .Take(limit)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<SyncRetryItemLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpdateAsync(SyncRetryItemLocal item, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.UpdateAsync(EntityMapper.FromLocal(item)),
            cancellationToken);

    public Task RemoveAsync(long id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.DeleteAsync<SyncRetryQueueEntity>(id),
            cancellationToken);
}
