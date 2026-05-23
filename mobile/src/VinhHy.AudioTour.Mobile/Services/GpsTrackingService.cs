using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Services;

/// <summary>
/// Battery-conscious GPS listener using MAUI Geolocation. Geofence evaluation is not implemented here.
/// </summary>
public sealed class GpsTrackingService : IGpsTrackingService
{
    private CancellationTokenSource? _listeningCts;
    private bool _isTracking;

    public bool IsTracking => _isTracking;

    public event EventHandler<GeoLocationUpdate>? LocationUpdated;

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (_isTracking)
        {
            return;
        }

        var status = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>()
            .ConfigureAwait(false);
        if (status != PermissionStatus.Granted)
        {
            status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>()
                .ConfigureAwait(false);
        }

        if (status != PermissionStatus.Granted)
        {
            return;
        }

        _listeningCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _isTracking = true;

        _ = ListenLoopAsync(_listeningCts.Token);
    }

    public Task StopAsync(CancellationToken cancellationToken = default)
    {
        if (!_isTracking)
        {
            return Task.CompletedTask;
        }

        _listeningCts?.Cancel();
        _listeningCts?.Dispose();
        _listeningCts = null;
        _isTracking = false;
        return Task.CompletedTask;
    }

    private async Task ListenLoopAsync(CancellationToken cancellationToken)
    {
        var request = new GeolocationListeningRequest(GeolocationAccuracy.Medium)
        {
            MinimumTime = TimeSpan.FromSeconds(AppConstants.MinLocationIntervalSeconds)
        };

        try
        {
            await foreach (var location in Geolocation.ListenAsync(request, cancellationToken)
                               .ConfigureAwait(false))
            {
                LocationUpdated?.Invoke(
                    this,
                    new GeoLocationUpdate
                    {
                        Latitude = location.Latitude,
                        Longitude = location.Longitude,
                        AccuracyMeters = location.Accuracy,
                        Timestamp = location.Timestamp.UtcDateTime
                    });
            }
        }
        catch (OperationCanceledException)
        {
            // Expected when tracking stops.
        }
    }
}
