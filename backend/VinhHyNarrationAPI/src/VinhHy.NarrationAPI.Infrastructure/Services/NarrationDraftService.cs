using Microsoft.EntityFrameworkCore;
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
    private readonly ApplicationDbContext _db;

    public NarrationDraftService(ApplicationDbContext db) => _db = db;

    public async Task<PagedResult<NarrationDraftDto>> SearchAsync(
        NarrationDraftListRequest request,
        CancellationToken cancellationToken = default)
    {
        var status = NormalizeStatus(request.Status);

        IQueryable<NarrationDraft> query = _db.NarrationDrafts
            .AsNoTracking()
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

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var keyword = request.Search.Trim();
            query = query.Where(d => d.Title.Contains(keyword) || d.TextContent.Contains(keyword));
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
        CancellationToken cancellationToken = default)
    {
        ValidateCreate(request);

        var now = DateTime.UtcNow;
        var draft = new NarrationDraft
        {
            Title = request.Title.Trim(),
            LanguageCode = request.LanguageCode.Trim(),
            TextContent = request.TextContent.Trim(),
            Voice = request.Voice.Trim(),
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
        var draft = await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);
        if (draft.Status != NarrationDraftStatuses.Approved && draft.Status != NarrationDraftStatuses.AudioGenerated)
        {
            throw new ValidationException(nameof(id), "Only approved narration text can generate audio.");
        }

        var now = DateTime.UtcNow;
        draft.Status = NarrationDraftStatuses.AudioGenerated;
        draft.ReviewedByUserId ??= reviewerUserId;
        draft.ReviewedAt ??= now;
        draft.AudioGeneratedAt = now;
        draft.SimulatedAudioUrl = $"tts-simulated://narration-drafts/{draft.Id}";
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
            .Include(d => d.SubmittedByUser)
            .Include(d => d.ReviewedByUser)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(NarrationDraft), id);

        return Map(draft);
    }

    private static void ValidateCreate(CreateNarrationDraftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ValidationException(nameof(request.Title), "Title is required.");
        if (string.IsNullOrWhiteSpace(request.LanguageCode))
            throw new ValidationException(nameof(request.LanguageCode), "Language is required.");
        if (string.IsNullOrWhiteSpace(request.TextContent))
            throw new ValidationException(nameof(request.TextContent), "Narration text is required.");
        if (string.IsNullOrWhiteSpace(request.Voice))
            throw new ValidationException(nameof(request.Voice), "Voice is required.");
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
