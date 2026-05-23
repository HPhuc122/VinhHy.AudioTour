using VinhHy.AudioTour.Mobile.Core.Contracts;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface INarrationLogQueueService
{
    Task EnqueueAsync(NarrationQueueItem item, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NarrationQueueItem>> GetPendingAsync(CancellationToken cancellationToken = default);

    Task MarkSyncedAsync(IEnumerable<long> localLogIds, CancellationToken cancellationToken = default);
}
