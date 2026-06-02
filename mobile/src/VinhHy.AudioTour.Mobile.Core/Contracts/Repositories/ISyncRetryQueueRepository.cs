using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface ISyncRetryQueueRepository
{
    Task EnqueueAsync(SyncRetryItemLocal item, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SyncRetryItemLocal>> GetDueAsync(
        DateTime utcNow,
        int limit,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(SyncRetryItemLocal item, CancellationToken cancellationToken = default);

    Task RemoveAsync(long id, CancellationToken cancellationToken = default);
}
