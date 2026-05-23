using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IDeviceRepository
{
    Task<Device?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Device?> GetByDeviceIdAsync(string deviceId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Device>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    Task AddAsync(Device device, CancellationToken cancellationToken = default);

    void Update(Device device);

    void Delete(Device device);
}
