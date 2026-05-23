using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface ITourPoiRepository
{
    Task<TourPoi?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TourPoi>> GetByTourIdAsync(int tourId, CancellationToken cancellationToken = default);

    Task<TourPoi?> GetByTourAndPoiAsync(int tourId, int poiId, CancellationToken cancellationToken = default);

    Task AddAsync(TourPoi tourPoi, CancellationToken cancellationToken = default);

    void Update(TourPoi tourPoi);

    void Delete(TourPoi tourPoi);
}
