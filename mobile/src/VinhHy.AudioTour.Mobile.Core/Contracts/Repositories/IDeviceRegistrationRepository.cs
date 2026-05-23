using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IDeviceRegistrationRepository
{
    Task<DeviceRegistrationLocal?> GetAsync(CancellationToken cancellationToken = default);

    Task UpsertAsync(DeviceRegistrationLocal registration, CancellationToken cancellationToken = default);
}
