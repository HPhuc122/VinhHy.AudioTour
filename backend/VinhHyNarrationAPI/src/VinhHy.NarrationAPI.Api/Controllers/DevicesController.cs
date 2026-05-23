using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/devices")]
[Authorize(Roles = RoleGroups.TourOperations)]
public class DevicesController(IDeviceService deviceService) : ControllerBase
{
    [HttpGet("{deviceId}")]
    public async Task<IActionResult> GetByDeviceId(string deviceId, CancellationToken cancellationToken)
    {
        var device = await deviceService.GetByDeviceIdAsync(deviceId, cancellationToken);
        if (device is null)
        {
            throw new NotFoundException("Device", deviceId);
        }

        return this.ApiOk(device);
    }

    [HttpGet("by-user/{userId:int}")]
    public async Task<IActionResult> GetByUserId(int userId, CancellationToken cancellationToken)
    {
        var devices = await deviceService.GetByUserIdAsync(userId, cancellationToken);
        return this.ApiOk(devices);
    }

    [HttpPost("{deviceId}/heartbeat")]
    public async Task<IActionResult> UpdateLastSeen(string deviceId, CancellationToken cancellationToken)
    {
        var device = await deviceService.UpdateLastSeenAsync(deviceId, cancellationToken);
        return this.ApiOk(device, "Device last seen updated");
    }
}
