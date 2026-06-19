using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Features.Sync.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/sync")]
[Authorize(Roles = RoleGroups.AdminOrTourOrContent)]
public class SyncController(ISyncService syncService) : ControllerBase
{
    [HttpPost("pull")]
    public async Task<IActionResult> Pull([FromBody] SyncPullRequest request, CancellationToken cancellationToken)
    {
        var result = await syncService.PullAsync(request, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpPost("push")]
    public async Task<IActionResult> Push([FromBody] SyncPushRequest request, CancellationToken cancellationToken)
    {
        var result = await syncService.PushAsync(request, cancellationToken);
        return this.ApiOk(result);
    }
}
