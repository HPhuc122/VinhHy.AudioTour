using VinhHy.NarrationAPI.Application.Features.Devices.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IDeviceService
{
    Task<DeviceDto?> GetByDeviceIdAsync(string deviceId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DeviceDto>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    Task<DeviceDto> UpdateLastSeenAsync(string deviceId, CancellationToken cancellationToken = default);
}
