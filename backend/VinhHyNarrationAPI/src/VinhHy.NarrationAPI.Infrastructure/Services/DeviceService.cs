using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Devices.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class DeviceService : IDeviceService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public DeviceService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<DeviceDto?> GetByDeviceIdAsync(string deviceId, CancellationToken cancellationToken = default)
    {
        var device = await _uow.Devices.GetByDeviceIdAsync(deviceId, cancellationToken).ConfigureAwait(false);
        return device is null ? null : _mapper.Map<DeviceDto>(device);
    }

    public async Task<IReadOnlyList<DeviceDto>> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var devices = await _uow.Devices.GetByUserIdAsync(userId, cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<DeviceDto>>(devices);
    }

    public async Task<DeviceDto> UpdateLastSeenAsync(
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        var device = await _uow.Devices.GetByDeviceIdAsync(deviceId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException("Device", deviceId);

        device.LastSeenAt = DateTime.UtcNow;
        _uow.Devices.Update(device);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<DeviceDto>(device);
    }
}
