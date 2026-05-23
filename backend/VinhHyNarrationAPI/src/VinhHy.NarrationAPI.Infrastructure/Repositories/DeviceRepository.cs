using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class DeviceRepository : IDeviceRepository
{
    private readonly ApplicationDbContext _db;

    public DeviceRepository(ApplicationDbContext db) => _db = db;

    public async Task<Device?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _db.Devices.FindAsync([id], cancellationToken).ConfigureAwait(false);

    public async Task<Device?> GetByDeviceIdAsync(string deviceId, CancellationToken cancellationToken = default) =>
        await _db.Devices.FirstOrDefaultAsync(d => d.DeviceId == deviceId, cancellationToken).ConfigureAwait(false);

    public async Task<IReadOnlyList<Device>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default) =>
        await _db.Devices.Where(d => d.UserId == userId).ToListAsync(cancellationToken).ConfigureAwait(false);

    public async Task AddAsync(Device device, CancellationToken cancellationToken = default) =>
        await _db.Devices.AddAsync(device, cancellationToken).ConfigureAwait(false);

    public void Update(Device device) => _db.Devices.Update(device);

    public void Delete(Device device) => _db.Devices.Remove(device);
}
