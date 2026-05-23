using VinhHy.AudioTour.Mobile.Core.Api.Sync;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface ISyncService
{
    Task<SyncPullResponse> PullAsync(SyncPullRequest request, CancellationToken cancellationToken = default);

    Task<SyncPushResponse> PushAsync(SyncPushRequest request, CancellationToken cancellationToken = default);

    Task SyncAllAsync(CancellationToken cancellationToken = default);
}
