using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface ISyncCursorRepository
{
    Task<SyncCursorLocal?> GetAsync(string entityType, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SyncCursorLocal>> GetAllAsync(CancellationToken cancellationToken = default);

    Task UpsertAsync(SyncCursorLocal cursor, CancellationToken cancellationToken = default);
}
