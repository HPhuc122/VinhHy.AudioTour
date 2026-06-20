using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Audio.DTOs;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/cms/audio-preview")]
[Authorize(Roles = RoleGroups.VendorMedia)]
public class CmsAudioPreviewController(
    ApplicationDbContext db,
    IHostEnvironment environment) : ControllerBase
{
    [HttpGet("by-poi/{poiId:int}")]
    public async Task<IActionResult> GetByPoi(int poiId, CancellationToken cancellationToken)
    {
        var poi = await db.Pois
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == poiId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), poiId);

        EnsureCanPreviewPoi(poi);

        var tracks = await db.AudioTracks
            .AsNoTracking()
            .Where(track => track.POIId == poiId && track.IsActive)
            .OrderBy(track => track.LanguageCode)
            .Select(track => new CmsAudioPreviewTrackDto
            {
                Id = track.Id,
                PoiId = track.POIId,
                LanguageCode = track.LanguageCode,
                Title = track.Title,
                AudioType = track.AudioType,
                DurationSeconds = track.DurationSeconds,
                FileSizeBytes = track.FileSizeBytes,
                MimeType = track.MimeType,
                IsActive = track.IsActive
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return this.ApiOk(tracks);
    }

    [HttpGet("{audioTrackId:int}/stream")]
    public async Task<IActionResult> Stream(int audioTrackId, CancellationToken cancellationToken)
    {
        var track = await db.AudioTracks
            .AsNoTracking()
            .Include(t => t.Poi)
            .FirstOrDefaultAsync(t => t.Id == audioTrackId && t.IsActive, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(AudioTrack), audioTrackId);

        EnsureCanPreviewPoi(track.Poi);

        var filePath = ResolveAudioFilePath(track.FileUrl);
        var fileInfo = new FileInfo(filePath);
        if (!fileInfo.Exists)
        {
            throw new NotFoundException("Audio file", audioTrackId);
        }

        if (fileInfo.Length <= 0)
        {
            throw new ValidationException(nameof(audioTrackId), "File audio không hợp lệ hoặc đang rỗng. Vui lòng tải lại MP3.");
        }

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, string.IsNullOrWhiteSpace(track.MimeType) ? "audio/mpeg" : track.MimeType, enableRangeProcessing: true);
    }

    private void EnsureCanPreviewPoi(Poi poi)
    {
        if (!User.IsInRole(RoleNames.Vendor))
        {
            return;
        }

        var currentUserId = GetRequiredCurrentUserId();
        if (poi.UserId != currentUserId)
        {
            throw new ForbiddenException("You are not allowed to preview audio for this POI.");
        }
    }

    private int GetRequiredCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedException("Missing authenticated user id.");
    }

    private string ResolveAudioFilePath(string? fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
        {
            throw new NotFoundException("Audio file", "missing");
        }

        var relativePath = fileUrl.Trim().Replace('\\', '/').TrimStart('/');
        if (!relativePath.StartsWith("uploads/audio/", StringComparison.OrdinalIgnoreCase) ||
            !relativePath.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotFoundException("Audio file", "unsupported");
        }

        var uploadsAudioRoot = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "uploads", "audio"));
        var resolvedPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, relativePath));
        if (!resolvedPath.StartsWith(uploadsAudioRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Audio file path is not allowed.");
        }

        return resolvedPath;
    }
}
