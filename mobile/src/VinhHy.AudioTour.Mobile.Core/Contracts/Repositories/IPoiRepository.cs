using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IPoiRepository
{
    Task<PoiLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PoiLocal?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PoiLocal>> GetActiveForGeofenceAsync(CancellationToken cancellationToken = default);

    Task UpsertAsync(PoiLocal poi, CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(IEnumerable<PoiLocal> pois, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
