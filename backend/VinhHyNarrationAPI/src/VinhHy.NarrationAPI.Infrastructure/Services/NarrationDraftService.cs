using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using Microsoft.Extensions.Logging;
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
    private readonly ITranslationProvider _translationProvider;
    private readonly IAutoTranslateTtsQueue _ttsQueue;
    private readonly IGoogleTtsService _googleTtsService;
    private readonly SoftDeleteService _softDelete;
    private readonly long _maxAudioFileSizeBytes;

    public NarrationDraftService(
        ApplicationDbContext db,
        IHostEnvironment environment,
        IConfiguration configuration,
        ITranslationProvider translationProvider,
        IAutoTranslateTtsQueue ttsQueue,
        IGoogleTtsService googleTtsService,
        SoftDeleteService softDelete)
    {
        _db = db;
        _environment = environment;
        _translationProvider = translationProvider;
        _ttsQueue = ttsQueue;
        _googleTtsService = googleTtsService;
        _softDelete = softDelete;
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
            .Include(d => d.ReviewedByUser)
            .Include(d => d.GeneratedAudioTrack);

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

        var languageCode = request.LanguageCode.Trim();
        var existingDraft = await _db.NarrationDrafts
            .FirstOrDefaultAsync(
                draft => draft.PoiId == request.PoiId && draft.LanguageCode == languageCode,
                cancellationToken)
            .ConfigureAwait(false);

        var now = DateTime.UtcNow;
        if (existingDraft is not null)
        {
            if (existingDraft.Status != NarrationDraftStatuses.Rejected)
            {
                throw new ValidationException(
                    nameof(request.LanguageCode),
                    "Narration for this POI and language already exists.");
            }

            existingDraft.Title = request.Title.Trim();
            existingDraft.TextContent = request.TextContent.Trim();
            existingDraft.Voice = request.Voice.Trim();
            existingDraft.Status = autoApprove ? NarrationDraftStatuses.Approved : NarrationDraftStatuses.Pending;
            existingDraft.SubmittedByUserId = submittedByUserId;
            existingDraft.SubmittedAt = now;
            existingDraft.ReviewedByUserId = autoApprove ? submittedByUserId : null;
            existingDraft.ReviewedAt = autoApprove ? now : null;
            existingDraft.RejectionReason = null;
            existingDraft.UpdatedAt = now;

            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return await GetMappedAsync(existingDraft.Id, cancellationToken).ConfigureAwait(false);
        }

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
        if (draft.Status != NarrationDraftStatuses.Pending)
        {
            throw new ValidationException(nameof(id), "Only pending narration drafts can be approved.");
        }

        draft.Status = NarrationDraftStatuses.Approved;
        draft.ReviewedByUserId = reviewerUserId;
        draft.ReviewedAt = DateTime.UtcNow;
        draft.RejectionReason = null;
        draft.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Kích hoạt pipeline tự động dịch + TTS cho tất cả ngôn ngữ còn lại
        await _ttsQueue.EnqueueAsync(id, cancellationToken).ConfigureAwait(false);

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
        if (draft.Status != NarrationDraftStatuses.Pending)
        {
            throw new ValidationException(nameof(id), "Only pending narration drafts can be rejected.");
        }

        draft.Status = NarrationDraftStatuses.Rejected;
        draft.ReviewedByUserId = reviewerUserId;
        draft.ReviewedAt = DateTime.UtcNow;
        draft.RejectionReason = reason.Trim();
        draft.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<NarrationDraftDto> UpdateTextAsync(
        int id,
        UpdateNarrationDraftTextRequest request,
        int reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        var nextText = ValidateNarrationText(request.TextContent);
        var draft = await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);

        if (draft.TextContent.Trim() == nextText)
        {
            return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
        }

        await SyncNarrationTextAndAudioAsync(draft, nextText, reviewerUserId, cancellationToken)
            .ConfigureAwait(false);

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<GenerateNarrationTranslationsResponse> GenerateTranslationsAsync(
        int sourceDraftId,
        GenerateNarrationTranslationsRequest request,
        int reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        var source = await GetTrackedAsync(sourceDraftId, cancellationToken).ConfigureAwait(false);
        if (source.Status != NarrationDraftStatuses.Approved && source.Status != NarrationDraftStatuses.AudioGenerated)
        {
            throw new ValidationException(nameof(sourceDraftId), "Only approved narration can be translated.");
        }

        var targetCodes = request.TargetLanguageCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim().ToLowerInvariant())
            .Where(code => code != source.LanguageCode.ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (targetCodes.Count == 0)
        {
            throw new ValidationException(nameof(request.TargetLanguageCodes), "Select at least one target language.");
        }

        var activeLanguageCodes = await _db.Languages
            .AsNoTracking()
            .Where(language => language.IsActive && targetCodes.Contains(language.Code))
            .Select(language => language.Code)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var unsupportedCodes = targetCodes
            .Except(activeLanguageCodes, StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (unsupportedCodes.Count > 0)
        {
            throw new ValidationException(
                nameof(request.TargetLanguageCodes),
                $"Unsupported target languages: {string.Join(", ", unsupportedCodes)}.");
        }

        var existingByLanguage = await _db.NarrationDrafts
            .Where(draft => draft.PoiId == source.PoiId && targetCodes.Contains(draft.LanguageCode))
            .ToDictionaryAsync(draft => draft.LanguageCode, StringComparer.OrdinalIgnoreCase, cancellationToken)
            .ConfigureAwait(false);

        var generatedIds = new List<int>();
        var skippedCodes = new List<string>();
        var now = DateTime.UtcNow;

        foreach (var targetCode in targetCodes)
        {
            existingByLanguage.TryGetValue(targetCode, out var targetDraft);
            if (targetDraft is not null &&
                (!request.OverwriteExisting || targetDraft.GeneratedAudioTrackId.HasValue || targetDraft.Status == NarrationDraftStatuses.AudioGenerated))
            {
                skippedCodes.Add(targetCode);
                continue;
            }

            var translatedTitle = await _translationProvider
                .TranslateAsync(source.Title, source.LanguageCode, targetCode, cancellationToken)
                .ConfigureAwait(false);
            var translatedText = await _translationProvider
                .TranslateAsync(source.TextContent, source.LanguageCode, targetCode, cancellationToken)
                .ConfigureAwait(false);

            if (targetDraft is null)
            {
                targetDraft = new NarrationDraft
                {
                    PoiId = source.PoiId,
                    LanguageCode = targetCode,
                    CreatedAt = now
                };
                await _db.NarrationDrafts.AddAsync(targetDraft, cancellationToken).ConfigureAwait(false);
            }

            targetDraft.Title = translatedTitle.Trim();
            targetDraft.TextContent = translatedText.Trim();
            targetDraft.Voice = source.Voice;
            targetDraft.Status = NarrationDraftStatuses.Approved;
            targetDraft.SubmittedByUserId = reviewerUserId;
            targetDraft.SubmittedAt = now;
            targetDraft.ReviewedByUserId = reviewerUserId;
            targetDraft.ReviewedAt = now;
            targetDraft.RejectionReason = null;
            targetDraft.UpdatedAt = now;

            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            generatedIds.Add(targetDraft.Id);
        }

        var generated = generatedIds.Count == 0
            ? []
            : await _db.NarrationDrafts
                .AsNoTracking()
                .Include(draft => draft.Poi)
                .Include(draft => draft.SubmittedByUser)
                .Include(draft => draft.ReviewedByUser)
                .Include(draft => draft.GeneratedAudioTrack)
                .Where(draft => generatedIds.Contains(draft.Id))
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);

        return new GenerateNarrationTranslationsResponse
        {
            Narrations = generated.Select(Map).ToList(),
            SkippedLanguageCodes = skippedCodes
        };
    }

    public async Task<NarrationDraftDto> GenerateAudioAsync(
        int id,
        int reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        var draft = await GetTrackedAsync(id, cancellationToken).ConfigureAwait(false);
        if (draft.Status != NarrationDraftStatuses.Approved &&
            draft.Status != NarrationDraftStatuses.AudioGenerated &&
            draft.Status != NarrationDraftStatuses.Translating)
        {
            throw new ValidationException(nameof(id), "TTS is allowed only for approved narration.");
        }

        var text = ValidateNarrationText(draft.TextContent);
        var audioBytes = await _googleTtsService
            .SynthesizeAsync(text, draft.LanguageCode, cancellationToken)
            .ConfigureAwait(false);

        var now = DateTime.UtcNow;
        await UpsertGeneratedAudioAsync(
                draft,
                draft.Title,
                text,
                audioBytes,
                now,
                cancellationToken)
            .ConfigureAwait(false);

        draft.TextContent = text;
        draft.Status = NarrationDraftStatuses.AudioGenerated;
        draft.ReviewedByUserId ??= reviewerUserId;
        draft.ReviewedAt ??= now;
        draft.AudioGeneratedAt = now;
        draft.SimulatedAudioUrl = null;
        draft.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return await GetMappedAsync(id, cancellationToken).ConfigureAwait(false);
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

        var detectedDurationSeconds = Mp3DurationDetector.TryDetectDurationSeconds(absolutePath);
        if (!detectedDurationSeconds.HasValue)
        {
            TryDeleteInvalidAudioFile(absolutePath);
            throw new ValidationException(
                nameof(request.FileContent),
                "File MP3 không hợp lệ hoặc không phát được. Vui lòng xuất lại audio dạng MP3 và tải lên lại.");
        }

        var durationSeconds = detectedDurationSeconds.Value;
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
        audioTrack.DurationSeconds = durationSeconds;
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

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // Admin: mọi trạng thái, mọi draft
    // Vendor: chỉ được xóa draft của chính mình khi Status = Pending
    // ─────────────────────────────────────────────────────────────────────────
    public async Task DeleteAsync(
        int id,
        int requestingUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        // Load draft KHÔNG qua global query filter của AudioTrack
        // vì Include trên nav-property bị lọc bởi HasQueryFilter(e => e.DeletedAt == null)
        var draft = await _db.NarrationDrafts
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(NarrationDraft), id);

        if (!isAdmin)
        {
            // Vendor chỉ xóa draft của chính mình
            if (draft.SubmittedByUserId != requestingUserId)
                throw new UnauthorizedException("You are not allowed to delete this narration draft.");

            // Vendor chỉ xóa được khi chưa qua tay admin (Status = Pending)
            if (draft.Status != NarrationDraftStatuses.Pending)
                throw new ValidationException(nameof(id),
                    "Vendor chỉ có thể xóa bản thuyết minh khi chưa được admin duyệt.");
        }

        // Soft-delete AudioTrack liên kết (nếu có) — giống AudioService.DeleteAsync
        // Dùng IgnoreQueryFilters để lấy được cả track đã bị soft-delete trước đó
        if (draft.GeneratedAudioTrackId.HasValue)
        {
            var audioTrack = await _db.AudioTracks
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == draft.GeneratedAudioTrackId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (audioTrack is { DeletedAt: null })
            {
                await _softDelete
                    .SoftDeleteAsync(audioTrack, SyncEntityTypes.AudioTrack,
                        deletedBy: requestingUserId, cancellationToken)
                    .ConfigureAwait(false);
                _db.AudioTracks.Update(audioTrack);

                // Xóa file vật lý MP3 khỏi disk
                if (!string.IsNullOrWhiteSpace(audioTrack.FileUrl))
                {
                    var absolutePath = Path.Combine(
                        _environment.ContentRootPath,
                        audioTrack.FileUrl.Replace('/', Path.DirectorySeparatorChar));
                    TryDeleteFile(absolutePath);
                }
            }
        }

        // Hard-delete NarrationDraft
        // (entity không có DeletedAt — thiết kế giống MediaFile.IsDeleted, xóa luôn khỏi DB)
        _db.NarrationDrafts.Remove(draft);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task<AudioTrack> UpsertGeneratedAudioAsync(
        NarrationDraft draft,
        string title,
        string text,
        byte[] audioBytes,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var fileName = $"{Guid.NewGuid():N}.mp3";
        var uploadDirectory = Path.Combine(_environment.ContentRootPath, "uploads", "audio");
        Directory.CreateDirectory(uploadDirectory);

        var absolutePath = Path.Combine(uploadDirectory, fileName);
        await File.WriteAllBytesAsync(absolutePath, audioBytes, cancellationToken).ConfigureAwait(false);

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

        audioTrack.Title = title.Trim();
        audioTrack.AudioType = "prerecorded";
        audioTrack.FileUrl = Path.Combine("uploads", "audio", fileName).Replace('\\', '/');
        audioTrack.TTSText = text.Trim();
        audioTrack.DurationSeconds = Mp3DurationDetector.TryDetectDurationSeconds(absolutePath);
        audioTrack.FileSizeBytes = audioBytes.Length;
        audioTrack.MimeType = "audio/mpeg";
        audioTrack.IsActive = true;
        audioTrack.UpdatedAt = now;

        draft.GeneratedAudioTrack = audioTrack;
        return audioTrack;
    }

    private async Task SyncNarrationTextAndAudioAsync(
        NarrationDraft sourceDraft,
        string sourceText,
        int reviewerUserId,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        sourceDraft.TextContent = sourceText;
        sourceDraft.Status = NarrationDraftStatuses.AudioGenerated;
        sourceDraft.ReviewedByUserId ??= reviewerUserId;
        sourceDraft.ReviewedAt ??= now;
        sourceDraft.RejectionReason = null;
        sourceDraft.SimulatedAudioUrl = null;
        sourceDraft.UpdatedAt = now;

        var sourceAudioBytes = await _googleTtsService
            .SynthesizeAsync(sourceText, sourceDraft.LanguageCode, cancellationToken)
            .ConfigureAwait(false);

        await UpsertGeneratedAudioAsync(
                sourceDraft,
                sourceDraft.Title,
                sourceText,
                sourceAudioBytes,
                now,
                cancellationToken)
            .ConfigureAwait(false);

        sourceDraft.AudioGeneratedAt = now;

        var activeLanguageCodes = await _db.Languages
            .AsNoTracking()
            .Where(language => language.IsActive)
            .Select(language => language.Code)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var targetLanguageCodes = activeLanguageCodes
            .Where(code => !string.Equals(code, sourceDraft.LanguageCode, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingDrafts = await _db.NarrationDrafts
            .Where(draft => draft.PoiId == sourceDraft.PoiId && targetLanguageCodes.Contains(draft.LanguageCode))
            .ToDictionaryAsync(draft => draft.LanguageCode, StringComparer.OrdinalIgnoreCase, cancellationToken)
            .ConfigureAwait(false);

        foreach (var targetLanguageCode in targetLanguageCodes)
        {
            var translatedTitle = await _translationProvider
                .TranslateAsync(sourceDraft.Title, sourceDraft.LanguageCode, targetLanguageCode, cancellationToken)
                .ConfigureAwait(false);
            var translatedText = await _translationProvider
                .TranslateAsync(sourceText, sourceDraft.LanguageCode, targetLanguageCode, cancellationToken)
                .ConfigureAwait(false);

            var normalizedText = ValidateNarrationText(translatedText);
            var audioBytes = await _googleTtsService
                .SynthesizeAsync(normalizedText, targetLanguageCode, cancellationToken)
                .ConfigureAwait(false);

            if (!existingDrafts.TryGetValue(targetLanguageCode, out var targetDraft))
            {
                targetDraft = new NarrationDraft
                {
                    PoiId = sourceDraft.PoiId,
                    LanguageCode = targetLanguageCode,
                    CreatedAt = now
                };
                await _db.NarrationDrafts.AddAsync(targetDraft, cancellationToken).ConfigureAwait(false);
                existingDrafts[targetLanguageCode] = targetDraft;
            }

            targetDraft.Title = translatedTitle.Trim();
            targetDraft.TextContent = normalizedText;
            targetDraft.Voice = TtsVoiceMap.Get(targetLanguageCode).VoiceName;
            targetDraft.Status = NarrationDraftStatuses.AudioGenerated;
            targetDraft.SubmittedByUserId = sourceDraft.SubmittedByUserId;
            targetDraft.SubmittedAt = now;
            targetDraft.ReviewedByUserId = reviewerUserId;
            targetDraft.ReviewedAt = now;
            targetDraft.RejectionReason = null;
            targetDraft.SimulatedAudioUrl = null;
            targetDraft.AudioGeneratedAt = now;
            targetDraft.UpdatedAt = now;

            await UpsertGeneratedAudioAsync(
                    targetDraft,
                    targetDraft.Title,
                    normalizedText,
                    audioBytes,
                    now,
                    cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static void TryDeleteFile(string absolutePath)
    {
        try
        {
            if (File.Exists(absolutePath))
                File.Delete(absolutePath);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private static void TryDeleteInvalidAudioFile(string absolutePath)
    {
        try
        {
            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
            }
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
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
            .Include(d => d.GeneratedAudioTrack)
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

        var duplicateExists = await _db.NarrationDrafts
            .AsNoTracking()
            .AnyAsync(
                draft => draft.PoiId == request.PoiId
                    && draft.LanguageCode == languageCode
                    && draft.Status != NarrationDraftStatuses.Rejected,
                cancellationToken)
            .ConfigureAwait(false);
        if (duplicateExists)
        {
            throw new ValidationException(nameof(request.LanguageCode), "Narration for this POI and language already exists.");
        }

        _ = ValidateNarrationText(request.TextContent);

        if (string.IsNullOrWhiteSpace(request.Voice))
        {
            throw new ValidationException(nameof(request.Voice), "Voice is required.");
        }

        if (request.Voice.Trim().Length > MaxVoiceLength)
        {
            throw new ValidationException(nameof(request.Voice), $"Voice cannot exceed {MaxVoiceLength} characters.");
        }
    }

    private static string ValidateNarrationText(string? textContent)
    {
        if (string.IsNullOrWhiteSpace(textContent))
        {
            throw new ValidationException(nameof(UpdateNarrationDraftTextRequest.TextContent), "Narration text is required.");
        }

        var normalized = textContent.Trim();
        if (normalized.Length < MinTextContentLength)
        {
            throw new ValidationException(
                nameof(UpdateNarrationDraftTextRequest.TextContent),
                $"Narration text must be at least {MinTextContentLength} characters.");
        }

        if (normalized.Length > MaxTextContentLength)
        {
            throw new ValidationException(
                nameof(UpdateNarrationDraftTextRequest.TextContent),
                $"Narration text cannot exceed {MaxTextContentLength} characters.");
        }

        return normalized;
    }

    private void ValidateAudioUpload(UploadNarrationAudioRequest request)
    {
        if (request.FileContent is null)
        {
            throw new ValidationException(nameof(request.FileContent), "Vui lòng chọn file MP3.");
        }

        if (request.FileSize <= 0)
        {
            throw new ValidationException(nameof(request.FileSize), "File MP3 không được rỗng.");
        }

        if (request.FileSize > _maxAudioFileSizeBytes)
        {
            throw new ValidationException(
                nameof(request.FileSize),
                $"File MP3 vượt quá dung lượng tối đa {_maxAudioFileSizeBytes / (1024 * 1024)} MB.");
        }

        if (string.IsNullOrWhiteSpace(request.OriginalFileName))
        {
            throw new ValidationException(nameof(request.OriginalFileName), "Tên file MP3 là bắt buộc.");
        }

        if (!string.Equals(Path.GetExtension(request.OriginalFileName), ".mp3", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException(nameof(request.OriginalFileName), "Chỉ hỗ trợ file .mp3.");
        }

        if (!string.IsNullOrWhiteSpace(request.ContentType) &&
            !string.Equals(request.ContentType.Trim(), "audio/mpeg", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(request.ContentType.Trim(), "audio/mp3", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException(nameof(request.ContentType), "Định dạng file MP3 không hợp lệ.");
        }

        if (request.DurationSeconds.HasValue && request.DurationSeconds.Value <= 0)
        {
            throw new ValidationException(nameof(request.DurationSeconds), "Thời lượng audio phải lớn hơn 0.");
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
            NarrationDraftStatuses.Translating => NarrationDraftStatuses.Translating,
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
        GeneratedAudioDurationSeconds = draft.GeneratedAudioTrack?.DurationSeconds,
        AudioGeneratedAt = draft.AudioGeneratedAt,
        SimulatedAudioUrl = draft.SimulatedAudioUrl,
        CreatedAt = draft.CreatedAt,
        UpdatedAt = draft.UpdatedAt
    };
}
