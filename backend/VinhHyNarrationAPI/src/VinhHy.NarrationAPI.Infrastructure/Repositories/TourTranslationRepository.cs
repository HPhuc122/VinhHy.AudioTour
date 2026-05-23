using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class TourTranslationRepository : ITourTranslationRepository
{
    private readonly ApplicationDbContext _db;

    public TourTranslationRepository(ApplicationDbContext db) => _db = db;

    public async Task<TourTranslation?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.TourTranslations.FindAsync([id], cancellationToken).ConfigureAwait(false);

    public async Task<TourTranslation?> GetByTourAndLanguageAsync(
        int tourId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        await _db.TourTranslations
            .FirstOrDefaultAsync(t => t.TourId == tourId && t.LanguageCode == languageCode, cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<TourTranslation>> GetByTourIdAsync(
        int tourId,
        CancellationToken cancellationToken = default) =>
        await _db.TourTranslations.Where(t => t.TourId == tourId).ToListAsync(cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<TourTranslation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.TourTranslations
            .Where(t => _db.Tours.Any(tour => tour.Id == t.TourId && tour.UpdatedAt >= since))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(TourTranslation translation, CancellationToken cancellationToken = default) =>
        await _db.TourTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);

    public void Update(TourTranslation translation) => _db.TourTranslations.Update(translation);

    public void Delete(TourTranslation translation) => _db.TourTranslations.Remove(translation);
}
