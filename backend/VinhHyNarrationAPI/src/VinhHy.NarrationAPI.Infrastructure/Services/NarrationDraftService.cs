using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class NarrationDraftService : INarrationDraftService
{
    private const int MaxTitleLength = 200;
    private const int MaxLanguageCodeLength = 10;
    private const int MinTextContentLength = 10;
    private const int MaxTextContentLength = 8000;
    private const int MaxVoiceLength = 100;
    private const long DefaultMaxAudioFileSizeBytes = 50 * 1024 * 1024;

    private readonly ApplicationDbContext _db;
    private readonly IHostEnvironment _environment;
    private readonly long _maxAudioFileSizeBytes;

    public NarrationDraftService(
        ApplicationDbContext db,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        _db = db;
        _environment = environment;
        _maxAudioFileSizeBytes = configuration.GetValue<long?>("MediaUpload:MaxAudioFileSizeBytes")
            ?? DefaultMaxAudioFileSizeBytes;
    }

    public async Task<PagedResult<NarrationDraftDto>> SearchAsync(
        NarrationDraftListRequest request,
        CancellationToken cancellationToken = default)
    {
        var status = NormalizeStatus(request.Status);

        IQueryable<NarrationDraft> query = _db.NarrationDrafts
            .AsNoTracking()
            .Include(d => d.Poi)
            .Include(d => d.SubmittedByUser)
            .Include(d => d.ReviewedByUser);

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(d => d.Status == status);
        }

        if (request.SubmittedByUserId.HasValue)
        {
            query = query.Where(d => d.SubmittedByUserId == request.SubmittedByUserId.Value);
        }

        if (request.PoiId.HasValue)
        {
            query = query.Where(d => d.PoiId == request.PoiId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var keyword = request.Search.Trim();
            query = query.Where(d =>
                d.Title.Contains(keyword) ||
                d.TextContent.Contains(keyword) ||
                d.Poi.Code.Contains(keyword) ||
                d.Poi.Name.Contains(keyword));
        }

        var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(d => d.SubmittedAt)
            .Skip((request.NormalizedPage - 1) * request.NormalizedPageSize)
            .Take(request.NormalizedPageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return PagedResult<NarrationDraftDto>.Create(
            items.Select(Map).ToList(),
            request.NormalizedPage,
            request.NormalizedPageSize,
            total);
    }

    public async Task<NarrationDraftDto> CreateAsync(
        CreateNarrationDraftRequest request,
        int submittedByUserId,
        bool autoApprove,
        bool requireOwnedPoi,
        CancellationToken cancellationToken = default)
    {
        await ValidateCreateAsync(request, cancellationToken).ConfigureAwait(false);
        var poi = await _db.Pois
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PoiId && p.DeletedAt == null, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), request.PoiId);

        if (requireOwnedPoi && poi.UserId != submittedByUserId)
        {
            throw new UnauthorizedException("Vendors can only create narration for their own POIs.");
        }

        var now = DateTime.UtcNow;
        var draft = new NarrationDraft
        {
            Title = request.Title.Trim(),
            LanguageCode = request.LanguageCode.Trim(),
            TextContent = request.TextContent.Trim(),
            Voice = request.Voice.Trim(),
            PoiId = request.PoiId,
            Status = autoApprove ? NarrationDraftStatuses.Approved : NarrationDraftStatuses.Pending,
            SubmittedByUserId = submittedByUserId,
            SubmittedAt = now,
            ReviewedByUserId = autoApprove ? submittedByUserId : null,
            ReviewedAt = autoApprove ? now : null,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _db.NarrationDrafts.AddAsync(draft, cancellationToken).ConfigureAwait(false);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return await GetMappedAsync(draft.Id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<NarrationDraftDto> ApproveAsync(
        int id,
        int reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        var draft = await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);
        draft.Status = NarrationDraftStatuses.Approved;
        draft.ReviewedByUserId = reviewerUserId;
        draft.ReviewedAt = DateTime.UtcNow;
        draft.RejectionReason = null;
        draft.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<NarrationDraftDto> RejectAsync(
        int id,
        int reviewerUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ValidationException(nameof(reason), "Rejection reason is required.");
        }

        var draft = await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);
        draft.Status = NarrationDraftStatuses.Rejected;
        draft.ReviewedByUserId = reviewerUserId;
        draft.ReviewedAt = DateTime.UtcNow;
        draft.RejectionReason = reason.Trim();
        draft.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<NarrationDraftDto> GenerateAudioAsync(
        int id,
        int reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);
        throw new ValidationException(nameof(id), "Manual MP3 upload is required. Use /api/v1/narrations/{id}/upload-audio.");
    }

    public async Task<NarrationDraftDto> UploadAudioAsync(
        int id,
        UploadNarrationAudioRequest request,
        int uploadedByUserId,
        CancellationToken cancellationToken = default)
    {
        ValidateAudioUpload(request);

        var draft = await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);
        if (draft.Status != NarrationDraftStatuses.Approved && draft.Status != NarrationDraftStatuses.AudioGenerated)
        {
            throw new ValidationException(nameof(id), "MP3 upload is allowed only for approved narration.");
        }

        var extension = Path.GetExtension(request.OriginalFileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var relativePath = Path.Combine("uploads", "audio", fileName).Replace('\\', '/');
        var uploadDirectory = Path.Combine(_environment.ContentRootPath, "uploads", "audio");
        var absolutePath = Path.Combine(uploadDirectory, fileName);

        Directory.CreateDirectory(uploadDirectory);

        await using (var output = new FileStream(absolutePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await request.FileContent.CopyToAsync(output, cancellationToken).ConfigureAwait(false);
        }

        var now = DateTime.UtcNow;
        var audioTrack = await _db.AudioTracks
            .FirstOrDefaultAsync(a =>
                a.POIId == draft.PoiId &&
                a.LanguageCode == draft.LanguageCode &&
                a.DeletedAt == null,
                cancellationToken)
            .ConfigureAwait(false);

        if (audioTrack is null)
        {
            audioTrack = new AudioTrack
            {
                POIId = draft.PoiId,
                LanguageCode = draft.LanguageCode,
                CreatedAt = now
            };
            await _db.AudioTracks.AddAsync(audioTrack, cancellationToken).ConfigureAwait(false);
        }
        else
        {
            audioTrack.Version++;
        }

        audioTrack.Title = string.IsNullOrWhiteSpace(request.Title) ? draft.Title : request.Title.Trim();
        audioTrack.AudioType = "prerecorded";
        audioTrack.FileUrl = relativePath;
        audioTrack.TTSText = null;
        audioTrack.DurationSeconds = request.DurationSeconds;
        audioTrack.FileSizeBytes = request.FileSize;
        audioTrack.MimeType = "audio/mpeg";
        audioTrack.IsActive = true;
        audioTrack.UpdatedAt = now;

        draft.Status = NarrationDraftStatuses.AudioGenerated;
        draft.GeneratedAudioTrack = audioTrack;
        draft.AudioGeneratedAt = now;
        draft.ReviewedByUserId ??= uploadedByUserId;
        draft.ReviewedAt ??= now;
        draft.SimulatedAudioUrl = null;
        draft.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
    }

    private async Task<NarrationDraft> GetTrackedAsync(int id, CancellationToken cancellationToken) =>
        await _db.NarrationDrafts.FirstOrDefaultAsync(d => d.Id == id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(NarrationDraft), id);

    private async Task<NarrationDraftDto> GetMappedAsync(int id, CancellationToken cancellationToken)
    {
        var draft = await _db.NarrationDrafts
            .AsNoTracking()
            .Include(d => d.Poi)
            .Include(d => d.SubmittedByUser)
            .Include(d => d.ReviewedByUser)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(NarrationDraft), id);

        return Map(draft);
    }

    private async Task ValidateCreateAsync(CreateNarrationDraftRequest request, CancellationToken cancellationToken)
    {
        if (request.PoiId <= 0)
        {
            throw new ValidationException(nameof(request.PoiId), "POI is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException(nameof(request.Title), "Title is required.");
        }

        if (request.Title.Trim().Length > MaxTitleLength)
        {
            throw new ValidationException(nameof(request.Title), $"Title cannot exceed {MaxTitleLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(request.LanguageCode))
        {
            throw new ValidationException(nameof(request.LanguageCode), "Language is required.");
        }

        var languageCode = request.LanguageCode.Trim();
        if (languageCode.Length > MaxLanguageCodeLength)
        {
            throw new ValidationException(
                nameof(request.LanguageCode),
                $"Language code cannot exceed {MaxLanguageCodeLength} characters.");
        }

        var languageExists = await _db.Languages
            .AsNoTracking()
            .AnyAsync(language => language.Code == languageCode && language.IsActive, cancellationToken)
            .ConfigureAwait(false);
        if (!languageExists)
        {
            throw new ValidationException(nameof(request.LanguageCode), "Language is not supported.");
        }

        if (string.IsNullOrWhiteSpace(request.TextContent))
        {
            throw new ValidationException(nameof(request.TextContent), "Narration text is required.");
        }

        var textContent = request.TextContent.Trim();
        if (textContent.Length < MinTextContentLength)
        {
            throw new ValidationException(
                nameof(request.TextContent),
                $"Narration text must be at least {MinTextContentLength} characters.");
        }

        if (textContent.Length > MaxTextContentLength)
        {
            throw new ValidationException(
                nameof(request.TextContent),
                $"Narration text cannot exceed {MaxTextContentLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Voice))
        {
            throw new ValidationException(nameof(request.Voice), "Voice is required.");
        }

        if (request.Voice.Trim().Length > MaxVoiceLength)
        {
            throw new ValidationException(nameof(request.Voice), $"Voice cannot exceed {MaxVoiceLength} characters.");
        }
    }

    private void ValidateAudioUpload(UploadNarrationAudioRequest request)
    {
        if (request.FileContent is null)
        {
            throw new ValidationException(nameof(request.FileContent), "MP3 file is required.");
        }

        if (request.FileSize <= 0)
        {
            throw new ValidationException(nameof(request.FileSize), "MP3 file must not be empty.");
        }

        if (request.FileSize > _maxAudioFileSizeBytes)
        {
            throw new ValidationException(
                nameof(request.FileSize),
                $"MP3 file size exceeds maximum allowed size of {_maxAudioFileSizeBytes / (1024 * 1024)} MB.");
        }

        if (string.IsNullOrWhiteSpace(request.OriginalFileName))
        {
            throw new ValidationException(nameof(request.OriginalFileName), "Original file name is required.");
        }

        if (!string.Equals(Path.GetExtension(request.OriginalFileName), ".mp3", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException(nameof(request.OriginalFileName), "Only MP3 files are allowed.");
        }

        if (!string.IsNullOrWhiteSpace(request.ContentType) &&
            !string.Equals(request.ContentType.Trim(), "audio/mpeg", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(request.ContentType.Trim(), "audio/mp3", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException(nameof(request.ContentType), "MP3 MIME type is invalid.");
        }

        if (request.DurationSeconds.HasValue && request.DurationSeconds.Value <= 0)
        {
            throw new ValidationException(nameof(request.DurationSeconds), "Duration must be greater than 0.");
        }
    }

    private static string? NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return null;
        }

        return status.Trim() switch
        {
            NarrationDraftStatuses.Pending => NarrationDraftStatuses.Pending,
            NarrationDraftStatuses.Approved => NarrationDraftStatuses.Approved,
            NarrationDraftStatuses.Rejected => NarrationDraftStatuses.Rejected,
            NarrationDraftStatuses.AudioGenerated => NarrationDraftStatuses.AudioGenerated,
            _ => throw new ValidationException(nameof(status), "Status is invalid.")
        };
    }

    private static NarrationDraftDto Map(NarrationDraft draft) => new()
    {
        Id = draft.Id,
        Title = draft.Title,
        LanguageCode = draft.LanguageCode,
        TextContent = draft.TextContent,
        Voice = draft.Voice,
        PoiId = draft.PoiId,
        PoiCode = draft.Poi.Code,
        PoiName = string.IsNullOrWhiteSpace(draft.Poi.Name) ? draft.Poi.Code : draft.Poi.Name,
        Status = draft.Status,
        SubmittedByUserId = draft.SubmittedByUserId,
        SubmittedByUsername = draft.SubmittedByUser.Username,
        SubmittedAt = draft.SubmittedAt,
        ReviewedByUserId = draft.ReviewedByUserId,
        ReviewedByUsername = draft.ReviewedByUser?.Username,
        ReviewedAt = draft.ReviewedAt,
        RejectionReason = draft.RejectionReason,
        GeneratedAudioTrackId = draft.GeneratedAudioTrackId,
        AudioGeneratedAt = draft.AudioGeneratedAt,
        SimulatedAudioUrl = draft.SimulatedAudioUrl,
        CreatedAt = draft.CreatedAt,
        UpdatedAt = draft.UpdatedAt
    };
}
