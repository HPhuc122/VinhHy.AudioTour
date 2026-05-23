using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Audio.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/audio")]
[Authorize(Roles = RoleGroups.ContentManagement)]
public class AudioController(IAudioService audioService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var track = await audioService.GetByIdAsync(id, cancellationToken);
        if (track is null)
        {
            throw new NotFoundException("Audio track", id);
        }

        return this.ApiOk(track);
    }

    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoiId(int poiId, CancellationToken cancellationToken)
    {
        var tracks = await audioService.GetByPoiIdAsync(poiId, cancellationToken);
        return this.ApiOk(tracks);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAudioTrackRequest request,
        CancellationToken cancellationToken)
    {
        var track = await audioService.CreateAsync(request, cancellationToken);
        return this.ApiOk(track, "Audio track created");
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateAudioTrackRequest request,
        CancellationToken cancellationToken)
    {
        var track = await audioService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(track, "Audio track updated");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await audioService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("Audio track deleted");
    }
}
