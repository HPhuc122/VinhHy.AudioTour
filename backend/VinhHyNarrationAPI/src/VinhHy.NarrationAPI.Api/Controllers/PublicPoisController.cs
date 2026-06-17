using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/pois")]
[AllowAnonymous]
public class PublicPoisController(IPoiService poiService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        CancellationToken cancellationToken = default)
    {
        var result = await poiService.GetPagedAsync(
            page,
            pageSize,
            search,
            category,
            isActive: true,
            includeDeleted: false,
            cancellationToken);

        return this.ApiOk(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.GetByIdAsync(id, cancellationToken);
        if (poi is null || poi.IsActive)
        {
            if (poi is not null)
            {
                return this.ApiOk(poi);
            }

            throw new NotFoundException("POI", id);
        }

        throw new NotFoundException("POI", id);
    }
}
