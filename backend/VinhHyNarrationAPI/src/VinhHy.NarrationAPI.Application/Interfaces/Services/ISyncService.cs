using VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ISyncService
{
    Task<SyncPullResponse> PullAsync(SyncPullRequest request, CancellationToken cancellationToken = default);

    Task<SyncPushResponse> PushAsync(SyncPushRequest request, CancellationToken cancellationToken = default);
}
