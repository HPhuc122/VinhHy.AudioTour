using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class AppBootstrapService(
    ILocalDatabaseInitializer databaseInitializer,
    IAuthService authService,
    IDeviceIdentityService deviceIdentity,
    IConnectivityMonitor connectivityMonitor,
    IOfflineSyncCoordinator syncCoordinator) : IAppBootstrapService
{
    public async Task BootstrapAsync(CancellationToken cancellationToken = default)
    {
        await databaseInitializer.InitializeAsync(cancellationToken).ConfigureAwait(false);
        await authService.RestoreSessionAsync(cancellationToken).ConfigureAwait(false);
        await deviceIdentity.GetOrCreateDeviceIdAsync(cancellationToken).ConfigureAwait(false);
        await connectivityMonitor.StartAsync(cancellationToken).ConfigureAwait(false);

        syncCoordinator.Start();

        if (connectivityMonitor.IsConnected)
        {
            try
            {
                await syncCoordinator.SyncNowAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Initial sync deferred: {ex.Message}");
                await syncCoordinator.ProcessRetryQueueAsync(cancellationToken).ConfigureAwait(false);
            }
        }
    }
}
