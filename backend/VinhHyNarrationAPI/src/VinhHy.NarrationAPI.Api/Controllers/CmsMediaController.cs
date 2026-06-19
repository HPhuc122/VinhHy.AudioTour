using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/cms/media")]
[Authorize(Roles = RoleGroups.VendorMedia)]
public class CmsMediaController(ApplicationDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet("images/{mediaFileId:int}/stream")]
    public async Task<IActionResult> StreamMediaImage(int mediaFileId, CancellationToken cancellationToken)
    {
        var mediaFile = await db.MediaFiles
            .AsNoTracking()
            .Include(m => m.Poi)
            .FirstOrDefaultAsync(m => m.Id == mediaFileId && !m.IsDeleted, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Media file", mediaFileId);

        if (mediaFile.FileType != "image")
        {
            throw new NotFoundException("Media file", mediaFileId);
        }

        EnsureCanAccessPoi(mediaFile.Poi);

        return StreamImageFile(mediaFile.RelativePath, mediaFile.ContentType);
    }

    [HttpGet("poi-assets/stream")]
    public async Task<IActionResult> StreamPoiAsset(
        [FromQuery] int poiId,
        [FromQuery] string relativePath,
        CancellationToken cancellationToken)
    {
        if (poiId <= 0)
        {
            throw new ValidationException(nameof(poiId), "POI id is required.");
        }

        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ValidationException(nameof(relativePath), "Relative path is required.");
        }

        var poi = await db.Pois
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == poiId && p.DeletedAt == null, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), poiId);

        EnsureCanAccessPoi(poi);

        var normalizedPath = NormalizeUploadPath(relativePath);
        if (!IsPoiAssetPath(poi, normalizedPath))
        {
            throw new NotFoundException("Media file", relativePath);
        }

        return StreamImageFile(normalizedPath, contentType: null);
    }

    private IActionResult StreamImageFile(string relativePath, string? contentType)
    {
        var filePath = ResolveUploadImagePath(relativePath);
        if (!System.IO.File.Exists(filePath))
        {
            throw new NotFoundException("Media file", relativePath);
        }

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, string.IsNullOrWhiteSpace(contentType) ? GuessContentType(relativePath) : contentType);
    }

    private void EnsureCanAccessPoi(Poi? poi)
    {
        if (!User.IsInRole(RoleNames.Vendor))
        {
            return;
        }

        if (poi is null)
        {
            throw new ForbiddenException("You are not allowed to preview this media file.");
        }

        var currentUserId = GetRequiredCurrentUserId();
        if (poi.UserId != currentUserId)
        {
            throw new ForbiddenException("You are not allowed to preview media for this POI.");
        }
    }

    private static bool IsPoiAssetPath(Poi poi, string normalizedPath)
    {
        var knownPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var path in DeserializeImageUrls(poi.ImageUrls))
        {
            knownPaths.Add(NormalizeUploadPath(path));
        }

        if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
        {
            knownPaths.Add(NormalizeUploadPath(poi.ImageUrl));
        }

        return knownPaths.Contains(normalizedPath);
    }

    private static IReadOnlyList<string> DeserializeImageUrls(string? imageUrls)
    {
        if (string.IsNullOrWhiteSpace(imageUrls))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(imageUrls) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private string ResolveUploadImagePath(string relativePath)
    {
        var normalizedPath = NormalizeUploadPath(relativePath);
        if (!normalizedPath.StartsWith("uploads/images/", StringComparison.OrdinalIgnoreCase) &&
            !normalizedPath.StartsWith("uploads/pois/", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotFoundException("Media file", "unsupported");
        }

        var candidateRoots = new[]
            {
                environment.ContentRootPath,
                environment.WebRootPath,
                Path.Combine(environment.ContentRootPath, "wwwroot")
            }
            .Where(root => !string.IsNullOrWhiteSpace(root))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        string? fallbackPath = null;
        foreach (var root in candidateRoots)
        {
            var resolvedPath = ResolveUnderUploadsRoot(root!, normalizedPath);
            fallbackPath ??= resolvedPath;
            if (System.IO.File.Exists(resolvedPath))
            {
                return resolvedPath;
            }
        }

        return fallbackPath ?? throw new NotFoundException("Media file", relativePath);
    }

    private static string NormalizeUploadPath(string relativePath) =>
        relativePath.Trim().Replace('\\', '/').TrimStart('/');

    private static string ResolveUnderUploadsRoot(string root, string normalizedPath)
    {
        var uploadsRoot = Path.GetFullPath(Path.Combine(root, "uploads"));
        var resolvedPath = Path.GetFullPath(Path.Combine(root, normalizedPath));
        var normalizedUploadsRoot = uploadsRoot
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        if (!resolvedPath.StartsWith(normalizedUploadsRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Media file path is not allowed.");
        }

        return resolvedPath;
    }

    private static string GuessContentType(string relativePath)
    {
        var extension = Path.GetExtension(relativePath).ToLowerInvariant();
        return extension switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => "image/jpeg"
        };
    }

    private int GetRequiredCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedException("Missing authenticated user id.");
    }
}
