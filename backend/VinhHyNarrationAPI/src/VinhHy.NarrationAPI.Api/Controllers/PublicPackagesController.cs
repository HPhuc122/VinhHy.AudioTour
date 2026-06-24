using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.PublicPackages.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/public/packages")]
public class PublicPackagesController(IQrService qrService, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPackages(CancellationToken cancellationToken)
    {
        var publicWebBaseUrl = GetPublicWebBaseUrl();
        var qrs = await qrService.GetPublicPackagesAsync(cancellationToken).ConfigureAwait(false);
        var packages = qrs.Select(qr => new PublicPackageDto
        {
            Code = qr.Code,
            RequiresPayment = qr.RequiresPayment,
            PriceAmount = qr.PriceAmount,
            AccessDurationMinutes = qr.AccessDurationMinutes,
            PublicQrUrl = $"{publicWebBaseUrl}/qr/{Uri.EscapeDataString(qr.Code)}"
        }).ToArray();

        return this.ApiOk(packages);
    }

    private string GetPublicWebBaseUrl()
    {
        var configured =
            configuration["PUBLIC_WEB_BASE_URL"] ??
            configuration["PublicWeb:BaseUrl"] ??
            "http://localhost:5173";

        return configured.TrimEnd('/');
    }
}
