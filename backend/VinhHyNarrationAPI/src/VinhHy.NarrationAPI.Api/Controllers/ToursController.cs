using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/tours")]
[Authorize(Roles = RoleGroups.AdminOrTourOrContent)]
public class ToursController(ITourService tourService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var tour = await tourService.GetByIdAsync(id, cancellationToken);
        if (tour is null)
        {
            throw new NotFoundException("Tour", id);
        }

        return this.ApiOk(tour);
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] TourListFilter filter, CancellationToken cancellationToken)
    {
        var result = await tourService.GetPagedAsync(filter, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpPost]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Create([FromBody] CreateTourRequest request, CancellationToken cancellationToken)
    {
        var tour = await tourService.CreateAsync(request, cancellationToken);
        return this.ApiOk(tour, "Tour created");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateTourRequest request,
        CancellationToken cancellationToken)
    {
        var tour = await tourService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(tour, "Tour updated");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await tourService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("Tour deleted");
    }

    [HttpPost("{tourId:int}/translations")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> AddTranslation(
        int tourId,
        [FromBody] CreateTourTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var translation = await tourService.AddTranslationAsync(tourId, request, cancellationToken);
        return this.ApiOk(translation, "Tour translation added");
    }

    [HttpPut("translations/{translationId:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> UpdateTranslation(
        int translationId,
        [FromBody] UpdateTourTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var translation = await tourService.UpdateTranslationAsync(translationId, request, cancellationToken);
        return this.ApiOk(translation, "Tour translation updated");
    }

    [HttpDelete("translations/{translationId:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> DeleteTranslation(int translationId, CancellationToken cancellationToken)
    {
        await tourService.DeleteTranslationAsync(translationId, cancellationToken);
        return this.ApiOk("Tour translation deleted");
    }

    [HttpPost("{tourId:int}/pois")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> AddPoi(
        int tourId,
        [FromBody] AddTourPoiRequest request,
        CancellationToken cancellationToken)
    {
        var tourPoi = await tourService.AddPoiAsync(tourId, request, cancellationToken);
        return this.ApiOk(tourPoi, "POI added to tour");
    }

    [HttpDelete("{tourId:int}/pois/{poiId:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> RemovePoi(int tourId, int poiId, CancellationToken cancellationToken)
    {
        await tourService.RemovePoiAsync(tourId, poiId, cancellationToken);
        return this.ApiOk("POI removed from tour");
    }

    [HttpPut("{tourId:int}/pois/reorder")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> ReorderPois(
        int tourId,
        [FromBody] ReorderTourPoisRequest request,
        CancellationToken cancellationToken)
    {
        await tourService.ReorderPoisAsync(tourId, request, cancellationToken);
        return this.ApiOk("Tour POIs reordered");
    }
}
