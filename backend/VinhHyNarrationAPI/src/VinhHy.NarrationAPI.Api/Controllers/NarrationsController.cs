using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/narrations")]
[Authorize(Roles = RoleGroups.VendorMedia)]
public class NarrationsController(INarrationDraftService narrationDraftService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] NarrationDraftListRequest request, CancellationToken cancellationToken)
    {
        if (IsVendor())
        {
            request.SubmittedByUserId = GetRequiredCurrentUserId();
        }

        var result = await narrationDraftService.SearchAsync(request, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoi(
        int poiId,
        [FromQuery] NarrationDraftListRequest request,
        CancellationToken cancellationToken)
    {
        request.PoiId = poiId;
        if (IsVendor())
        {
            request.SubmittedByUserId = GetRequiredCurrentUserId();
        }

        var result = await narrationDraftService.SearchAsync(request, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateNarrationDraftRequest request,
        CancellationToken cancellationToken)
    {
        var draft = await narrationDraftService.CreateAsync(
            request,
            GetRequiredCurrentUserId(),
            autoApprove: !IsVendor(),
            requireOwnedPoi: IsVendor(),
            cancellationToken);
        return this.ApiOk(draft, "Narration draft created");
    }

    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Approve(int id, CancellationToken cancellationToken)
    {
        var draft = await narrationDraftService.ApproveAsync(id, GetRequiredCurrentUserId(), cancellationToken);
        return this.ApiOk(draft, "Narration draft approved");
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Reject(
        int id,
        [FromBody] RejectNarrationDraftRequest request,
        CancellationToken cancellationToken)
    {
        var draft = await narrationDraftService.RejectAsync(id, GetRequiredCurrentUserId(), request.Reason, cancellationToken);
        return this.ApiOk(draft, "Narration draft rejected");
    }

    [HttpPost("{id:int}/generate-audio")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> GenerateAudio(int id, CancellationToken cancellationToken)
    {
        var draft = await narrationDraftService.GenerateAudioAsync(id, GetRequiredCurrentUserId(), cancellationToken);
        return this.ApiOk(draft, "TTS simulated. No real audio provider is connected.");
    }

    [HttpPost("{id:int}/upload-audio")]
    [Authorize(Roles = RoleGroups.AdminOnly)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAudio(
        int id,
        [FromForm] UploadNarrationAudioForm form,
        CancellationToken cancellationToken)
    {
        if (form.File is null)
        {
            throw new ValidationException(nameof(form.File), "MP3 file is required.");
        }

        await using var fileStream = form.File.OpenReadStream();
        var draft = await narrationDraftService.UploadAudioAsync(
            id,
            new UploadNarrationAudioRequest
            {
                FileContent = fileStream,
                OriginalFileName = form.File.FileName,
                ContentType = form.File.ContentType,
                FileSize = form.File.Length,
                Title = form.Title,
                DurationSeconds = form.DurationSeconds
            },
            GetRequiredCurrentUserId(),
            cancellationToken);

        return this.ApiOk(draft, "Narration audio uploaded");
    }

    private bool IsVendor() => User.IsInRole(RoleNames.Vendor);

    private int GetRequiredCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedException("Missing authenticated user id.");
    }
}

public class UploadNarrationAudioForm
{
    public IFormFile? File { get; set; }

    public string? Title { get; set; }

    public int? DurationSeconds { get; set; }
}
