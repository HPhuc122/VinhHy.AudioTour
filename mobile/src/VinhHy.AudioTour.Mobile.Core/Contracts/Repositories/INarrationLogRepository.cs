using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface INarrationLogRepository
{
    Task<long> InsertAsync(NarrationLogLocal log, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NarrationLogLocal>> GetPendingSyncAsync(
        int limit,
        CancellationToken cancellationToken = default);

    Task MarkSyncedAsync(
        IEnumerable<long> localIds,
        DateTime syncedAt,
        CancellationToken cancellationToken = default);
}
