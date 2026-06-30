using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/audio")]
[AllowAnonymous]
public class PublicAudioController(
    IUnitOfWork uow,
    IPublicAccessService publicAccessService,
    IHostEnvironment environment) : ControllerBase
{
    [HttpGet("{audioTrackId:int}")]
    public async Task<IActionResult> Stream(int audioTrackId, CancellationToken cancellationToken)
    {
        await publicAccessService
            .ValidateAccessForAudioTrackAsync(GetGuestAccessToken(), audioTrackId, cancellationToken)
            .ConfigureAwait(false);

        var track = await uow.AudioTracks.GetByIdAsync(audioTrackId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Audio track", audioTrackId);

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

    [HttpPost("{audioTrackId:int}/play-log")]
    public async Task<IActionResult> RecordPlay(
        int audioTrackId,
        [FromQuery] string languageCode = "vi",
        [FromQuery] string triggerType = TriggerTypes.Manual,
        CancellationToken cancellationToken = default)
    {
        await publicAccessService
            .ValidateAccessForAudioTrackAsync(GetGuestAccessToken(), audioTrackId, cancellationToken)
            .ConfigureAwait(false);

        var track = await uow.AudioTracks.GetByIdAsync(audioTrackId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Audio track", audioTrackId);

        var deviceId = await ResolveKnownDeviceIdAsync(cancellationToken).ConfigureAwait(false);

        await uow.NarrationLogs.AddAsync(
            new NarrationLog
            {
                POIId = track.POIId,
                TriggerType = NormalizeTriggerType(triggerType),
                LanguageCode = NormalizeLanguageCode(languageCode),
                PlayedAt = DateTime.UtcNow,
                DeviceId = deviceId,
                Synced = true
            },
            cancellationToken).ConfigureAwait(false);

        await uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return this.ApiOk(new { recorded = true }, "Audio play recorded");
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

    private string? GetGuestAccessToken() =>
        Request.Headers["X-Guest-Access-Token"].FirstOrDefault();

    private async Task<string?> ResolveKnownDeviceIdAsync(CancellationToken cancellationToken)
    {
        var candidate = Request.Headers["X-Guest-Device-Id"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return null;
        }

        var deviceId = candidate.Trim();
        var device = await uow.Devices.GetByDeviceIdAsync(deviceId, cancellationToken).ConfigureAwait(false);
        return device is null ? null : deviceId;
    }

    private static string NormalizeLanguageCode(string? languageCode) =>
        string.IsNullOrWhiteSpace(languageCode) ? "vi" : languageCode.Trim().ToLowerInvariant();

    private static string NormalizeTriggerType(string? triggerType)
    {
        var normalized = string.IsNullOrWhiteSpace(triggerType)
            ? TriggerTypes.Manual
            : triggerType.Trim().ToLowerInvariant();

        return normalized switch
        {
            TriggerTypes.Gps => TriggerTypes.Gps,
            TriggerTypes.Qr => TriggerTypes.Qr,
            TriggerTypes.Manual => TriggerTypes.Manual,
            _ => TriggerTypes.Manual
        };
    }
}
