using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class PoiTranslationRepository(LocalDatabase database) : IPoiTranslationRepository
{
    public Task<PoiTranslationLocal?> GetAsync(
        int poiId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.Table<PoiTranslationEntity>()
                    .Where(t => t.PoiId == poiId && t.LanguageCode == languageCode)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<IReadOnlyList<PoiTranslationLocal>> GetByPoiIdAsync(
        int poiId,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<PoiTranslationEntity>()
                    .Where(t => t.PoiId == poiId)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<PoiTranslationLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertRangeAsync(
        IEnumerable<PoiTranslationLocal> translations,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var translation in translations)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(translation));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task DeleteByPoiIdAsync(int poiId, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.ExecuteAsync(
                        "DELETE FROM POITranslations WHERE POIId = ?;",
                        poiId)
                    .ConfigureAwait(false);
            },
            cancellationToken);
}
