using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IGeofenceStateRepository
{
    Task<GeofenceStateLocal?> GetAsync(int poiId, CancellationToken cancellationToken = default);

    Task UpsertAsync(GeofenceStateLocal state, CancellationToken cancellationToken = default);

    Task DeleteAllAsync(CancellationToken cancellationToken = default);
}
