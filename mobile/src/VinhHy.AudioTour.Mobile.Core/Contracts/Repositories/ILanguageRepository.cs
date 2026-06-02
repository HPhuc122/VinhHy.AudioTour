using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface ILanguageRepository
{
    Task<IReadOnlyList<LanguageLocal>> GetActiveAsync(CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(IEnumerable<LanguageLocal> languages, CancellationToken cancellationToken = default);
}
