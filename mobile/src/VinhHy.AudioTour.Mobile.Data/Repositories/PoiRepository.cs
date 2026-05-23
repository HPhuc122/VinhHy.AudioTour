using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class PoiRepository(LocalDatabase database) : IPoiRepository
{
    public Task<PoiLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<PoiEntity>(id).ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<PoiLocal?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.Table<PoiEntity>()
                    .Where(p => p.Code == code)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<IReadOnlyList<PoiLocal>> GetActiveForGeofenceAsync(
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<PoiEntity>()
                    .Where(p => p.IsActive && p.DeletedAt == null)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<PoiLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertAsync(PoiLocal poi, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.InsertOrReplaceAsync(EntityMapper.FromLocal(poi)),
            cancellationToken);

    public Task UpsertRangeAsync(IEnumerable<PoiLocal> pois, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var poi in pois)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(poi));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task DeleteAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.DeleteAsync<PoiEntity>(id),
            cancellationToken);
}
