using VinhHy.AudioTour.Mobile.Core.Contracts;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IGpsTrackingService
{
    bool IsTracking { get; }

    event EventHandler<GeoLocationUpdate>? LocationUpdated;

    Task StartAsync(CancellationToken cancellationToken = default);

    Task StopAsync(CancellationToken cancellationToken = default);
}
