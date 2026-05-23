using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class AppBootstrapService(
    ILocalDatabaseInitializer databaseInitializer,
    IDeviceIdentityService deviceIdentity,
    IConnectivityMonitor connectivityMonitor,
    ISyncService syncService) : IAppBootstrapService
{
    public async Task BootstrapAsync(CancellationToken cancellationToken = default)
    {
        await databaseInitializer.InitializeAsync(cancellationToken).ConfigureAwait(false);
        await deviceIdentity.GetOrCreateDeviceIdAsync(cancellationToken).ConfigureAwait(false);
        await connectivityMonitor.StartAsync(cancellationToken).ConfigureAwait(false);

        if (connectivityMonitor.IsConnected)
        {
            await syncService.SyncAllAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}
