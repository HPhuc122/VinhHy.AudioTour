using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IPoiTranslationRepository
{
    Task<PoiTranslation?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PoiTranslation?> GetByPoiAndLanguageAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PoiTranslation>> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PoiTranslation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(PoiTranslation translation, CancellationToken cancellationToken = default);

    void Update(PoiTranslation translation);

    void Delete(PoiTranslation translation);
}
