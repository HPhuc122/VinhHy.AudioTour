using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.NarrationLogs.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/narration-logs")]
[Authorize]
public class NarrationLogsController(INarrationLogService narrationLogService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateNarrationLogRequest request,
        CancellationToken cancellationToken)
    {
        var log = await narrationLogService.CreateAsync(request, cancellationToken);
        return this.ApiOk(log, "Narration log created");
    }

    [HttpGet]
    [Authorize(Roles = RoleGroups.TourOperations)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] NarrationLogListFilter filter,
        CancellationToken cancellationToken)
    {
        var result = await narrationLogService.GetPagedAsync(filter, cancellationToken);
        return this.ApiOk(result);
    }
}
