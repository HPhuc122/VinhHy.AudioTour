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
[Authorize(Roles = RoleGroups.ContentManagement)]
public class QrController(IQrService qrService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var locations = await qrService.GetAllAsync(cancellationToken);
        return this.ApiOk(locations);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var location = await qrService.GetByIdAsync(id, cancellationToken);
        if (location is null)
        {
            throw new NotFoundException("QR location", id);
        }

        return this.ApiOk(location);
    }

    [AllowAnonymous]
    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var location = await qrService.GetByCodeAsync(code, cancellationToken);
        if (location is null)
        {
            throw new NotFoundException("QR code", code);
        }

        return this.ApiOk(location);
    }

    [AllowAnonymous]
    [HttpGet("resolve/{code}")]
    public async Task<IActionResult> Resolve(string code, CancellationToken cancellationToken)
    {
        var result = await qrService.ResolveAsync(code, cancellationToken);
        if (result is null)
        {
            throw new NotFoundException("QR code", code);
        }

        return this.ApiOk(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateQrRequest request,
        CancellationToken cancellationToken)
    {
        var location = await qrService.CreateAsync(request, cancellationToken);
        return this.ApiOk(location, "QR location created");
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateQrRequest request,
        CancellationToken cancellationToken)
    {
        var location = await qrService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(location, "QR location updated");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await qrService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("QR location deleted");
    }
}
