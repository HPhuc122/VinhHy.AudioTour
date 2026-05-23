using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.OfflinePackages.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/offline-packages")]
[Authorize]
public class OfflinePackagesController(IOfflinePackageService offlinePackageService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var package = await offlinePackageService.GetByIdAsync(id, cancellationToken);
        if (package is null)
        {
            throw new NotFoundException("Offline package", id);
        }

        return this.ApiOk(package);
    }

    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest(
        [FromQuery] int tourId,
        [FromQuery] string languageCode,
        CancellationToken cancellationToken)
    {
        var package = await offlinePackageService.GetLatestAsync(tourId, languageCode, cancellationToken);
        if (package is null)
        {
            throw new NotFoundException("Offline package", $"{tourId}/{languageCode}");
        }

        return this.ApiOk(package);
    }

    [HttpGet("by-tour/{tourId:int}")]
    public async Task<IActionResult> GetByTourId(int tourId, CancellationToken cancellationToken)
    {
        var packages = await offlinePackageService.GetByTourIdAsync(tourId, cancellationToken);
        return this.ApiOk(packages);
    }

    [HttpPost]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Create(
        [FromBody] CreateOfflinePackageRequest request,
        CancellationToken cancellationToken)
    {
        var package = await offlinePackageService.CreateAsync(request, cancellationToken);
        return this.ApiOk(package, "Offline package created");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateOfflinePackageRequest request,
        CancellationToken cancellationToken)
    {
        var package = await offlinePackageService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(package, "Offline package updated");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await offlinePackageService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("Offline package deleted");
    }
}
