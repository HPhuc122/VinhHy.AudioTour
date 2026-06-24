using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/audio-tour")]
[AllowAnonymous]
public class PublicAudioTourController(IPublicAudioTourService audioTourService) : ControllerBase
{
    [HttpGet("tours/{tourId:int}")]
    public async Task<IActionResult> GetTour(
        int tourId,
        [FromQuery] string languageCode = "vi",
        CancellationToken cancellationToken = default)
    {
        var result = await audioTourService.GetTourAsync(
            GetGuestAccessToken(),
            tourId,
            languageCode,
            cancellationToken);

        return this.ApiOk(result);
    }

    [HttpGet("pois/{poiId:int}")]
    public async Task<IActionResult> GetPoi(
        int poiId,
        [FromQuery] string languageCode = "vi",
        [FromQuery] string triggerType = "manual",
        CancellationToken cancellationToken = default)
    {
        var result = await audioTourService.GetPoiAsync(
            GetGuestAccessToken(),
            poiId,
            languageCode,
            triggerType,
            cancellationToken);

        return this.ApiOk(result);
    }

    private string? GetGuestAccessToken() =>
        Request.Headers["X-Guest-Access-Token"].FirstOrDefault();
}
