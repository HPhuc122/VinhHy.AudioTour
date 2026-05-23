using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IPoiTranslationRepository
{
    Task<PoiTranslationLocal?> GetAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PoiTranslationLocal>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(
        IEnumerable<PoiTranslationLocal> translations,
        CancellationToken cancellationToken = default);

    Task DeleteByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);
}
