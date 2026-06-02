namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

/// <summary>
/// Pull-first sync with retry queue and connectivity-aware scheduling.
/// </summary>
public interface IOfflineSyncCoordinator
{
    void Start();

    Task SyncNowAsync(CancellationToken cancellationToken = default);

    Task ProcessRetryQueueAsync(CancellationToken cancellationToken = default);
}
