using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/access")]
[AllowAnonymous]
public class PublicAccessController(IPublicAccessService publicAccessService) : ControllerBase
{
    [HttpPost("start")]
    public async Task<IActionResult> Start(
        [FromBody] StartAccessRequest request,
        CancellationToken cancellationToken)
    {
        var result = await publicAccessService.StartAsync(request, cancellationToken);
        return this.ApiOk(result, "Access flow started");
    }

    [HttpPost("simulate-payment")]
    public async Task<IActionResult> SimulatePayment(
        [FromBody] SimulatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await publicAccessService.SimulatePaymentAsync(request, cancellationToken);
        return this.ApiOk(result, "Simulated payment processed");
    }

    [HttpGet("validate")]
    public async Task<IActionResult> Validate(CancellationToken cancellationToken)
    {
        var token = Request.Headers["X-Guest-Access-Token"].FirstOrDefault()
            ?? Request.Query["accessToken"].FirstOrDefault();
        var result = await publicAccessService.ValidateAsync(token, cancellationToken);
        return this.ApiOk(result, "Access validation completed");
    }
}
