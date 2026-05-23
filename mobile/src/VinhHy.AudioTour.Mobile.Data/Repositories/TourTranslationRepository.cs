using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class TourTranslationRepository(LocalDatabase database) : ITourTranslationRepository
{
    public Task<TourTranslationLocal?> GetAsync(
        int tourId,
        string languageCode,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.Table<TourTranslationEntity>()
                    .Where(t => t.TourId == tourId && t.LanguageCode == languageCode)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task<IReadOnlyList<TourTranslationLocal>> GetByTourIdAsync(
        int tourId,
        CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<TourTranslationEntity>()
                    .Where(t => t.TourId == tourId)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<TourTranslationLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertRangeAsync(
        IEnumerable<TourTranslationLocal> translations,
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

    public Task DeleteByTourIdAsync(int tourId, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.ExecuteAsync(
                "DELETE FROM TourTranslations WHERE TourId = ?;",
                tourId),
            cancellationToken);
}
