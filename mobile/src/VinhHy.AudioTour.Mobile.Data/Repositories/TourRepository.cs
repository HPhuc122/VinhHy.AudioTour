using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class TourRepository(LocalDatabase database) : ITourRepository
{
    public Task<TourLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<TourEntity>(id).ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<TourLocal?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.Table<TourEntity>()
                    .Where(t => t.Code == code)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<IReadOnlyList<TourLocal>> GetAllActiveAsync(CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<TourEntity>()
                    .Where(t => t.IsActive && t.DeletedAt == null)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<TourLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertAsync(TourLocal tour, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.InsertOrReplaceAsync(EntityMapper.FromLocal(tour)),
            cancellationToken);

    public Task UpsertRangeAsync(IEnumerable<TourLocal> tours, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var tour in tours)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(tour));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task DeleteAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.DeleteAsync<TourEntity>(id),
            cancellationToken);
}
