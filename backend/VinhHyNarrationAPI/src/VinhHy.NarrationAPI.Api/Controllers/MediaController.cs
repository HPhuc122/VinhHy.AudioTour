using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Media.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/media")]
[Authorize(Roles = RoleGroups.VendorMedia)]
public class MediaController(IMediaService mediaService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var mediaFiles = await mediaService.GetAllAsync(cancellationToken);
        return this.ApiOk(mediaFiles);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] MediaListRequest request, CancellationToken cancellationToken)
    {
        if (IsVendor())
        {
            request.FileType = "image";
            request.IncludeDeleted = false;
            request.PoiOwnerUserId = GetCurrentUserId();
        }

        var mediaFiles = await mediaService.SearchAsync(request, BuildPublicUrl, cancellationToken);
        return this.ApiOk(mediaFiles);
    }

    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoi(
        int poiId,
        [FromQuery] MediaListRequest request,
        CancellationToken cancellationToken)
    {
        request.PoiId = poiId;
        request.FileType = "image";
        request.IncludeDeleted = false;

        if (IsVendor())
        {
            request.PoiOwnerUserId = GetCurrentUserId();
        }

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

        if (IsVendor() && (mediaFile.FileType != "image" || mediaFile.UploadedByUserId != GetCurrentUserId()))
        {
            return Forbid();
        }

        return this.ApiOk(mediaFile);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile? file,
        [FromForm] int? poiId,
        [FromForm] string? imageCategory,
        CancellationToken cancellationToken)
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
                UploadedByUserId = GetCurrentUserId(),
                PoiId = poiId,
                ImageCategory = imageCategory,
                RequiredPoiOwnerUserId = IsVendor() ? GetRequiredCurrentUserId() : null,
                ImageOnly = IsVendor(),
                ApprovalStatus = IsVendor() ? ApprovalStatuses.Pending : ApprovalStatuses.Approved,
                ReviewedByUserId = IsVendor() ? null : GetCurrentUserId()
            },
            cancellationToken);

        return this.ApiOk(uploaded, "Media file uploaded");
    }

    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Approve(int id, CancellationToken cancellationToken)
    {
        var media = await mediaService.ApproveAsync(id, GetRequiredCurrentUserId(), cancellationToken);
        return this.ApiOk(media, "Media file approved");
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Reject(
        int id,
        [FromBody] RejectMediaRequest request,
        CancellationToken cancellationToken)
    {
        var media = await mediaService.RejectAsync(id, GetRequiredCurrentUserId(), request.Reason, cancellationToken);
        return this.ApiOk(media, "Media file rejected");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await mediaService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("Media file deleted");
    }

    [HttpPost("{id:int}/restore")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
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

    private int GetRequiredCurrentUserId() =>
        GetCurrentUserId() ?? throw new UnauthorizedException("Missing authenticated user id.");

    private bool IsVendor() => User.IsInRole(RoleNames.Vendor);

    private string BuildPublicUrl(string relativePath)
    {
        var path = relativePath.StartsWith('/') ? relativePath : $"/{relativePath}";
        return $"{Request.Scheme}://{Request.Host}{path}";
    }
}
