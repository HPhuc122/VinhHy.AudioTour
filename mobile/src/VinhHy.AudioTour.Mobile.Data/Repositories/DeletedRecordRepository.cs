using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class DeletedRecordRepository(LocalDatabase database) : IDeletedRecordRepository
{
    public Task InsertRangeAsync(
        IEnumerable<DeletedRecordLocal> records,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var record in records)
                    {
                        var entity = EntityMapper.FromLocal(record);
                        entity.Id = 0;
                        transaction.Insert(entity);
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task<IReadOnlyList<DeletedRecordLocal>> GetUnprocessedAsync(
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<DeletedRecordEntity>()
                    .Where(r => r.ProcessedAt == null)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<DeletedRecordLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task MarkProcessedAsync(
        IEnumerable<long> ids,
        DateTime processedAt,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var idList = ids.ToList();
                if (idList.Count == 0)
                {
                    return;
                }

                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var id in idList)
                    {
                        var entity = transaction.Find<DeletedRecordEntity>(id);
                        if (entity is null)
                        {
                            continue;
                        }

                        entity.ProcessedAt = processedAt;
                        transaction.Update(entity);
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);
}
