using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/pois")]
[AllowAnonymous]
public class PublicPoisController(IPublicPoiService publicPoiService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? lang = null,
        CancellationToken cancellationToken = default)
    {
        var result = await publicPoiService.GetPagedAsync(
            page,
            pageSize,
            search,
            category,
            lang,
            cancellationToken);

        return this.ApiOk(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id,
        [FromQuery] string? lang = null,
        CancellationToken cancellationToken = default)
    {
        var poi = await publicPoiService.GetByIdAsync(id, lang, cancellationToken);
        if (poi is null)
        {
            throw new NotFoundException("POI", id);
        }

        return this.ApiOk(poi);
    }
}
