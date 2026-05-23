using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/poi-translations")]
[Authorize(Roles = RoleGroups.ContentManagement)]
public class PoiTranslationsController(IPoiTranslationService poiTranslationService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var translation = await poiTranslationService.GetByIdAsync(id, cancellationToken);
        if (translation is null)
        {
            throw new NotFoundException("POI translation", id);
        }

        return this.ApiOk(translation);
    }

    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoiId(int poiId, CancellationToken cancellationToken)
    {
        var translations = await poiTranslationService.GetByPoiIdAsync(poiId, cancellationToken);
        return this.ApiOk(translations);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePoiTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var translation = await poiTranslationService.CreateAsync(request, cancellationToken);
        return this.ApiOk(translation, "POI translation created");
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePoiTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var translation = await poiTranslationService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(translation, "POI translation updated");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await poiTranslationService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("POI translation deleted");
    }
}
