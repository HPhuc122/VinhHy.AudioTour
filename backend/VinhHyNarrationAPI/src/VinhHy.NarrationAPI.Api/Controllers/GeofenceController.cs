using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Geofence.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/geofence")]
[Authorize(Roles = RoleGroups.ContentManagement)]
public class GeofenceController(IGeofenceConfigService geofenceConfigService) : ControllerBase
{
    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoiId(int poiId, CancellationToken cancellationToken)
    {
        var config = await geofenceConfigService.GetByPoiIdAsync(poiId, cancellationToken);
        if (config is null)
        {
            throw new NotFoundException("Geofence config", poiId);
        }

        return this.ApiOk(config);
    }

    [HttpPut("by-poi/{poiId:int}")]
    public async Task<IActionResult> Update(
        int poiId,
        [FromBody] UpdateGeofenceConfigRequest request,
        CancellationToken cancellationToken)
    {
        var config = await geofenceConfigService.UpdateAsync(poiId, request, cancellationToken);
        return this.ApiOk(config, "Geofence config updated");
    }
}
