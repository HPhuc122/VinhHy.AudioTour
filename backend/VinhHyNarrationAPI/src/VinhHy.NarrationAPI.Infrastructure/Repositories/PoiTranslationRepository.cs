using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class PoiTranslationRepository : IPoiTranslationRepository
{
    private readonly ApplicationDbContext _db;

    public PoiTranslationRepository(ApplicationDbContext db) => _db = db;

    public async Task<PoiTranslation?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.PoiTranslations.FindAsync([id], cancellationToken).ConfigureAwait(false);

    public async Task<PoiTranslation?> GetByPoiAndLanguageAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        await _db.PoiTranslations
            .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode == languageCode, cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<PoiTranslation>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default) =>
        await _db.PoiTranslations.Where(t => t.POIId == poiId).ToListAsync(cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<PoiTranslation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default) =>
        await _db.PoiTranslations
            .Where(t => t.UpdatedAt >= since)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task AddAsync(PoiTranslation translation, CancellationToken cancellationToken = default) =>
        await _db.PoiTranslations.AddAsync(translation, cancellationToken).ConfigureAwait(false);

    public void Update(PoiTranslation translation) => _db.PoiTranslations.Update(translation);

    public void Delete(PoiTranslation translation) => _db.PoiTranslations.Remove(translation);
}
