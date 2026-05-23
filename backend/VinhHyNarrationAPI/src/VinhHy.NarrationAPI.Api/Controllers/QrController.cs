using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/qr")]
public class QrController(IQrService qrService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("resolve/{qrCode}")]
    public async Task<IActionResult> Resolve(string qrCode, CancellationToken cancellationToken)
    {
        var result = await qrService.ResolveAsync(qrCode, cancellationToken);
        if (result is null)
        {
            throw new NotFoundException("QR code", qrCode);
        }

        return this.ApiOk(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var location = await qrService.GetByIdAsync(id, cancellationToken);
        if (location is null)
        {
            throw new NotFoundException("QR location", id);
        }

        return this.ApiOk(location);
    }

    [HttpGet("by-poi/{poiId:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> GetByPoiId(int poiId, CancellationToken cancellationToken)
    {
        var locations = await qrService.GetByPoiIdAsync(poiId, cancellationToken);
        return this.ApiOk(locations);
    }

    [HttpPost]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Create(
        [FromBody] CreateQrLocationRequest request,
        CancellationToken cancellationToken)
    {
        var location = await qrService.CreateAsync(request, cancellationToken);
        return this.ApiOk(location, "QR location created");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateQrLocationRequest request,
        CancellationToken cancellationToken)
    {
        var location = await qrService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(location, "QR location updated");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await qrService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("QR location deleted");
    }
}
