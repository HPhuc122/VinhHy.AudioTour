using VinhHy.AudioTour.Mobile.Core.Contracts;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class ConnectivityMonitorService : IConnectivityMonitor, IDisposable
{
    private bool _disposed;
    private bool _started;

    public bool IsConnected =>
        Connectivity.Current.NetworkAccess is NetworkAccess.Internet or NetworkAccess.ConstrainedInternet;

    public event EventHandler<ConnectivityChangedEventArgs>? ConnectivityChanged;

    public Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (!_started)
        {
            Connectivity.Current.ConnectivityChanged += OnConnectivityChanged;
            _started = true;
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken = default)
    {
        if (_started)
        {
            Connectivity.Current.ConnectivityChanged -= OnConnectivityChanged;
            _started = false;
        }

        return Task.CompletedTask;
    }

    private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
    {
        var online = e.NetworkAccess is NetworkAccess.Internet or NetworkAccess.ConstrainedInternet;
        ConnectivityChanged?.Invoke(this, new ConnectivityChangedEventArgs(online, DateTime.UtcNow));
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        if (_started)
        {
            Connectivity.Current.ConnectivityChanged -= OnConnectivityChanged;
        }

        _disposed = true;
    }
}
