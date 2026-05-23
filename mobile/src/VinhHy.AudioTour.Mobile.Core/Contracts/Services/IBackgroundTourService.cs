namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IBackgroundTourService
{
    int? ActiveTourId { get; }

    Task StartTourAsync(int tourId, CancellationToken cancellationToken = default);

    Task StopTourAsync(CancellationToken cancellationToken = default);
}
