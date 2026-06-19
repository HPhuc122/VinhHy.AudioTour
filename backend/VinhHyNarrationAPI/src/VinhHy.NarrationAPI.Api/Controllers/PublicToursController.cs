using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/tours")]
[AllowAnonymous]
public class PublicToursController(ITourService tourService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] TourListFilter filter,
        [FromQuery] string? lang = null,
        CancellationToken cancellationToken = default)
    {
        var result = await tourService.GetPublicPagedAsync(filter, lang, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id,
        [FromQuery] string? lang = null,
        CancellationToken cancellationToken = default)
    {
        var tour = await tourService.GetPublicByIdAsync(id, lang, cancellationToken);
        if (tour is null)
        {
            throw new NotFoundException("Tour", id);
        }

        return this.ApiOk(tour);
    }
}
