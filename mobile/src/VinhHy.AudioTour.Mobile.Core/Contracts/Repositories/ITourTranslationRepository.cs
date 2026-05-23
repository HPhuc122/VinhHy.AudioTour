using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface ITourTranslationRepository
{
    Task<IReadOnlyList<TourTranslationLocal>> GetByTourIdAsync(
        int tourId,
        CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(
        IEnumerable<TourTranslationLocal> translations,
        CancellationToken cancellationToken = default);

    Task DeleteByTourIdAsync(int tourId, CancellationToken cancellationToken = default);
}
