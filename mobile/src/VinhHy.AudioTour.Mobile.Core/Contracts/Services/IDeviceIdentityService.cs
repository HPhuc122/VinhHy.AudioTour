namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IDeviceIdentityService
{
    Task<string> GetOrCreateDeviceIdAsync(CancellationToken cancellationToken = default);
}
