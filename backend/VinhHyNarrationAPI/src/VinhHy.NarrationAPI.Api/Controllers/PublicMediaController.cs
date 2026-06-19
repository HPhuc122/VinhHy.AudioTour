using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Domain.Specifications;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/media")]
[AllowAnonymous]
public class PublicMediaController(ApplicationDbContext db, IHostEnvironment environment) : ControllerBase
{
    [HttpGet("images/{mediaFileId:int}")]
    public async Task<IActionResult> StreamImage(int mediaFileId, CancellationToken cancellationToken)
    {
        var mediaFile = await db.MediaFiles
            .AsNoTracking()
            .Include(m => m.Poi)
            .FirstOrDefaultAsync(m => m.Id == mediaFileId && !m.IsDeleted, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Media file", mediaFileId);

        if (mediaFile.FileType != "image" || mediaFile.ApprovalStatus != ApprovalStatuses.Approved)
        {
            throw new NotFoundException("Media file", mediaFileId);
        }

        if (!mediaFile.PoiId.HasValue || mediaFile.Poi is null)
        {
            throw new NotFoundException("Media file", mediaFileId);
        }

        if (!PoiAvailability.IsPubliclyAvailable(mediaFile.Poi, DateTime.UtcNow))
        {
            throw new NotFoundException("Media file", mediaFileId);
        }

        var filePath = ResolveImageFilePath(mediaFile.RelativePath);
        if (!System.IO.File.Exists(filePath))
        {
            throw new NotFoundException("Media file", mediaFileId);
        }

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, string.IsNullOrWhiteSpace(mediaFile.ContentType) ? "image/jpeg" : mediaFile.ContentType);
    }

    private string ResolveImageFilePath(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new NotFoundException("Media file", "missing");
        }

        var normalizedPath = relativePath.Trim().Replace('\\', '/').TrimStart('/');
        if (!normalizedPath.StartsWith("uploads/images/", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotFoundException("Media file", "unsupported");
        }

        var uploadsImagesRoot = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "uploads", "images"));
        var resolvedPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, normalizedPath));
        if (!resolvedPath.StartsWith(uploadsImagesRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Media file path is not allowed.");
        }

        return resolvedPath;
    }
}
