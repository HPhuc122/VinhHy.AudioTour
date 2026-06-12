using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Media.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/media")]
[Authorize(Roles = RoleGroups.ContentManagement)]
public class MediaController(IMediaService mediaService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var mediaFiles = await mediaService.GetAllAsync(cancellationToken);
        return this.ApiOk(mediaFiles);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] MediaListRequest request, CancellationToken cancellationToken)
    {
        var mediaFiles = await mediaService.SearchAsync(request, BuildPublicUrl, cancellationToken);
        return this.ApiOk(mediaFiles);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var mediaFile = await mediaService.GetByIdAsync(id, cancellationToken);
        if (mediaFile is null)
        {
            throw new NotFoundException("Media file", id);
        }

        return this.ApiOk(mediaFile);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload([FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null)
        {
            throw new ValidationException(nameof(file), "File is required.");
        }

        var uploaded = await mediaService.UploadAsync(
            new UploadMediaRequest
            {
                FileContent = file.OpenReadStream(),
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedByUserId = GetCurrentUserId()
            },
            cancellationToken);

        return this.ApiOk(uploaded, "Media file uploaded");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await mediaService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("Media file deleted");
    }

    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id, CancellationToken cancellationToken)
    {
        await mediaService.RestoreAsync(id, cancellationToken);
        return this.ApiOk("Media file restored");
    }

    private int? GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId) ? userId : null;
    }

    private string BuildPublicUrl(string relativePath)
    {
        var path = relativePath.StartsWith('/') ? relativePath : $"/{relativePath}";
        return $"{Request.Scheme}://{Request.Host}{path}";
    }
}
