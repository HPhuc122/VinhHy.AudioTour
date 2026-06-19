using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/poi-translations")]
[Authorize(Roles = RoleGroups.VendorPoiRegistration)]
public class PoiTranslationsController(IPoiTranslationService poiTranslationService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var translation = await poiTranslationService.GetByIdAsync(
            id,
            GetCurrentUserIdOrNull(),
            IsVendor(),
            cancellationToken);
        if (translation is null)
        {
            throw new NotFoundException("POI translation", id);
        }

        return this.ApiOk(translation);
    }

    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoiId(int poiId, CancellationToken cancellationToken)
    {
        var translations = await poiTranslationService.GetByPoiIdAsync(
            poiId,
            GetCurrentUserIdOrNull(),
            IsVendor(),
            cancellationToken);
        return this.ApiOk(translations);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(
        [FromBody] GeneratePoiTranslationsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await poiTranslationService.GenerateAsync(
            request,
            GetCurrentUserIdOrNull(),
            IsVendor(),
            cancellationToken);

        return this.ApiOk(result, "POI translations generated");
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePoiTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var translation = await poiTranslationService.CreateAsync(
            request,
            GetCurrentUserIdOrNull(),
            IsVendor(),
            cancellationToken);
        return this.ApiOk(translation, "POI translation created");
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePoiTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var translation = await poiTranslationService.UpdateAsync(
            id,
            request,
            GetCurrentUserIdOrNull(),
            IsVendor(),
            cancellationToken);
        return this.ApiOk(translation, "POI translation updated");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await poiTranslationService.DeleteAsync(
            id,
            GetCurrentUserIdOrNull(),
            IsVendor(),
            cancellationToken);
        return this.ApiOk("POI translation deleted");
    }

    private bool IsVendor() => User.IsInRole(RoleNames.Vendor);

    private int? GetCurrentUserIdOrNull()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId) ? userId : null;
    }
}
