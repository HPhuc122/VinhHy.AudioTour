namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IAppBootstrapService
{
    Task BootstrapAsync(CancellationToken cancellationToken = default);
}
