using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface ISyncRepository
{
    Task AddHistoryAsync(SyncHistory history, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SyncHistory>> GetHistoryByUserAsync(
        int userId,
        int take,
        CancellationToken cancellationToken = default);
}
