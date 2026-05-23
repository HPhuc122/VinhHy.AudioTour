using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface ITourRepository
{
    Task<TourLocal?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<TourLocal?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TourLocal>> GetAllActiveAsync(CancellationToken cancellationToken = default);

    Task UpsertAsync(TourLocal tour, CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(IEnumerable<TourLocal> tours, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
