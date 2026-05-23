using VinhHy.AudioTour.Mobile.Core.Contracts;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IConnectivityMonitor
{
    bool IsConnected { get; }

    event EventHandler<ConnectivityChangedEventArgs>? ConnectivityChanged;

    Task StartAsync(CancellationToken cancellationToken = default);

    Task StopAsync(CancellationToken cancellationToken = default);
}
