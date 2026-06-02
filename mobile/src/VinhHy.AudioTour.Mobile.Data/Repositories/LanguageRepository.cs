using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class LanguageRepository(LocalDatabase database) : ILanguageRepository
{
    public Task<IReadOnlyList<LanguageLocal>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<LanguageEntity>()
                    .Where(l => l.IsActive)
                    .OrderBy(l => l.SortOrder)
                    .ToListAsync()
                    .ConfigureAwait(false);
                return (IReadOnlyList<LanguageLocal>)entities.Select(EntityMapper.ToLocal).ToList();
            },
            cancellationToken);

    public Task UpsertRangeAsync(IEnumerable<LanguageLocal> languages, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var language in languages)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(language));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);
}
