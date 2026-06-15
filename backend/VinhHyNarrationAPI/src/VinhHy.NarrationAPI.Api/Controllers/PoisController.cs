using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/pois")]
[Authorize]
public class PoisController(IPoiService poiService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.GetByIdAsync(id, cancellationToken);
        if (poi is null)
        {
            throw new NotFoundException("POI", id);
        }

        return this.ApiOk(poi);
    }

    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var poi = await poiService.GetByCodeAsync(code, cancellationToken);
        if (poi is null)
        {
            throw new NotFoundException("POI", code);
        }

        return this.ApiOk(poi);
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        var result = await poiService.GetPagedAsync(page, pageSize, search, category, isActive, includeDeleted, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpPost]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    // Đổi [FromBody] thành [FromForm] ở dòng dưới này:
    public async Task<IActionResult> Create([FromForm] CreatePoiRequest request, CancellationToken cancellationToken)
    {
        var poi = await poiService.CreateAsync(request, cancellationToken);
        return this.ApiOk(poi, "POI created");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Update(
        int id,
        // Đổi [FromBody] thành [FromForm] ở dòng dưới này:
        [FromForm] UpdatePoiRequest request,
        CancellationToken cancellationToken)
    {
        var poi = await poiService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(poi, "POI updated");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await poiService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("POI deleted");
    }

    [HttpPut("{id:int}/restore")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Restore(int id, CancellationToken cancellationToken)
    {
        await poiService.RestoreAsync(id, cancellationToken);
        return NoContent();
    }
}
