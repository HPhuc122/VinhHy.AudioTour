using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface ITourTranslationRepository
{
    Task<TourTranslation?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<TourTranslation?> GetByTourAndLanguageAsync(
        int tourId,
        string languageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TourTranslation>> GetByTourIdAsync(int tourId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TourTranslation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(TourTranslation translation, CancellationToken cancellationToken = default);

    void Update(TourTranslation translation);

    void Delete(TourTranslation translation);
}
