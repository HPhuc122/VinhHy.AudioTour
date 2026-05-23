using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[Authorize(Roles = RoleGroups.Analytics)]
public class AnalyticsController(IAnalyticsService analyticsService) : ControllerBase
{
    [HttpGet("daily")]
    public async Task<IActionResult> GetDaily(
        [FromQuery] AnalyticsQueryFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await analyticsService.GetDailyAsync(filter, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] AnalyticsQueryFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await analyticsService.GetSummaryAsync(filter, cancellationToken);
        return this.ApiOk(result);
    }
}
