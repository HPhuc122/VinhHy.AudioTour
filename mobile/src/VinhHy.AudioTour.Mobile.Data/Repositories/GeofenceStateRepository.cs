using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class GeofenceStateRepository(LocalDatabase database) : IGeofenceStateRepository
{
    public Task<GeofenceStateLocal?> GetAsync(int poiId, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<GeofenceStateEntity>(poiId).ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task UpsertAsync(GeofenceStateLocal state, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.InsertOrReplaceAsync(EntityMapper.FromLocal(state)),
            cancellationToken);

    public Task DeleteAllAsync(CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.ExecuteAsync("DELETE FROM GeofenceState;").ConfigureAwait(false);
            },
            cancellationToken);
}
