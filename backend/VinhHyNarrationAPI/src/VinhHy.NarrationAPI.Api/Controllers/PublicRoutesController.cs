using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/routes")]
[AllowAnonymous]
public class PublicRoutesController(IPublicRouteService publicRouteService) : ControllerBase
{
    [HttpGet("poi-to-poi")]
    public async Task<IActionResult> GetPoiToPoiRoute(
        [FromQuery] int fromPoiId,
        [FromQuery] int toPoiId,
        CancellationToken cancellationToken)
    {
        var result = await publicRouteService.GetPoiToPoiRouteAsync(fromPoiId, toPoiId, cancellationToken);
        return this.ApiOk(result);
    }
}
