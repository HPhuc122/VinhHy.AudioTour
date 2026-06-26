using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

// ─────────────────────────────────────────────────────────────────────────────
// In-memory channel queue (singleton)
// ─────────────────────────────────────────────────────────────────────────────
public interface IAutoTranslateTtsQueue
{
    ValueTask EnqueueAsync(int sourceDraftId, CancellationToken ct = default);
    ValueTask<int> DequeueAsync(CancellationToken ct);
}

public sealed class AutoTranslateTtsQueue : IAutoTranslateTtsQueue
{
    private readonly System.Threading.Channels.Channel<int> _channel =
        System.Threading.Channels.Channel.CreateUnbounded<int>(
            new System.Threading.Channels.UnboundedChannelOptions { SingleReader = false });

    public ValueTask EnqueueAsync(int sourceDraftId, CancellationToken ct = default)
        => _channel.Writer.WriteAsync(sourceDraftId, ct);

    public ValueTask<int> DequeueAsync(CancellationToken ct)
        => _channel.Reader.ReadAsync(ct);
}

// ─────────────────────────────────────────────────────────────────────────────
// Background worker: xử lý pipeline cho từng NarrationDraft được duyệt
// Luồng: Admin approve → enqueue draft ID → worker dịch+TTS cho 5 ngôn ngữ
// ─────────────────────────────────────────────────────────────────────────────
public sealed class AutoTranslateTtsPipelineService(
    IAutoTranslateTtsQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<AutoTranslateTtsPipelineService> logger) : BackgroundService
{
    // Tất cả ngôn ngữ đích (lấy từ DB Languages.IsActive, trừ ngôn ngữ nguồn của draft)
    private const int MaxParallelPerDraft = 3; // Giới hạn concurrent call Google API

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AutoTranslateTtsPipelineService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            int draftId;
            try { draftId = await queue.DequeueAsync(stoppingToken).ConfigureAwait(false); }
            catch (OperationCanceledException) { break; }

            // Fire-and-forget với error handling
            _ = ProcessDraftAsync(draftId, stoppingToken);
        }

        logger.LogInformation("AutoTranslateTtsPipelineService stopped.");
    }

    private async Task ProcessDraftAsync(int sourceDraftId, CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db          = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var translator  = scope.ServiceProvider.GetRequiredService<ITranslationProvider>();
        var tts         = scope.ServiceProvider.GetRequiredService<IGoogleTtsService>();
        var fileUpload  = scope.ServiceProvider.GetRequiredService<IFileUploadService>();
        var environment = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

        NarrationDraft? sourceDraft;
        try
        {
            sourceDraft = await db.NarrationDrafts
                .FirstOrDefaultAsync(d => d.Id == sourceDraftId, ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load NarrationDraft {DraftId}", sourceDraftId);
            return;
        }

        if (sourceDraft is null)
        {
            logger.LogWarning("NarrationDraft {DraftId} not found, skipping pipeline.", sourceDraftId);
            return;
        }

        if (sourceDraft.Status != NarrationDraftStatuses.Approved &&
            sourceDraft.Status != NarrationDraftStatuses.Translating)
        {
            logger.LogWarning("NarrationDraft {DraftId} is in status '{Status}', skipping pipeline.",
                sourceDraftId, sourceDraft.Status);
            return;
        }

        // Lấy danh sách ngôn ngữ đích (tất cả active, trừ ngôn ngữ nguồn)
        var targetLanguages = await db.Languages
            .AsNoTracking()
            .Where(l => l.IsActive && l.Code != sourceDraft.LanguageCode)
            .Select(l => l.Code)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (targetLanguages.Count == 0)
        {
            logger.LogInformation("No target languages for draft {DraftId}, pipeline complete.", sourceDraftId);
            return;
        }

        logger.LogInformation(
            "Pipeline starting for Draft={DraftId} POI={PoiId} → [{Langs}]",
            sourceDraftId, sourceDraft.PoiId, string.Join(", ", targetLanguages));

        // Đánh dấu Translating
        sourceDraft.Status    = NarrationDraftStatuses.Translating;
        sourceDraft.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        // Xử lý song song, tối đa MaxParallelPerDraft
        var semaphore = new SemaphoreSlim(MaxParallelPerDraft);
        var tasks = targetLanguages.Select(lang =>
            ProcessLanguageAsync(sourceDraft, lang, db, translator, tts, environment, semaphore, ct));

        await Task.WhenAll(tasks).ConfigureAwait(false);

        // Refresh entity và đánh dấu AudioGenerated
        var refreshed = await db.NarrationDrafts.FindAsync([sourceDraftId], ct).ConfigureAwait(false);
        if (refreshed is not null && refreshed.Status == NarrationDraftStatuses.Translating)
        {
            refreshed.Status    = NarrationDraftStatuses.AudioGenerated;
            refreshed.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }

        logger.LogInformation("Pipeline completed for Draft={DraftId}", sourceDraftId);
    }

    private async Task ProcessLanguageAsync(
        NarrationDraft source,
        string targetLang,
        ApplicationDbContext db,
        ITranslationProvider translator,
        IGoogleTtsService tts,
        IHostEnvironment environment,
        SemaphoreSlim semaphore,
        CancellationToken ct)
    {
        await semaphore.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            logger.LogInformation("Translating Draft={DraftId} → {Lang}", source.Id, targetLang);

            // ── STEP 1: Google Translate ──────────────────────────────────────
            string translatedTitle, translatedText;
            try
            {
                translatedTitle = await translator
                    .TranslateAsync(source.Title, source.LanguageCode, targetLang, ct)
                    .ConfigureAwait(false);
                translatedText = await translator
                    .TranslateAsync(source.TextContent, source.LanguageCode, targetLang, ct)
                    .ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Translation failed for Draft={DraftId} → {Lang}", source.Id, targetLang);
                return;
            }

            // ── STEP 2: Google TTS → MP3 bytes ───────────────────────────────
            byte[] audioBytes;
            try
            {
                audioBytes = await tts.SynthesizeAsync(translatedText, targetLang, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "TTS synthesis failed for Draft={DraftId} → {Lang}", source.Id, targetLang);
                return;
            }

            // ── STEP 3: Lưu file MP3 vào disk ───────────────────────────────
            var fileName = $"{Guid.NewGuid():N}.mp3";
            var audioDir = Path.Combine(environment.ContentRootPath, "uploads", "audio");
            Directory.CreateDirectory(audioDir);
            var filePath = Path.Combine(audioDir, fileName);
            await File.WriteAllBytesAsync(filePath, audioBytes, ct).ConfigureAwait(false);
            var relativeUrl = $"uploads/audio/{fileName}";
            var durationSeconds = Mp3DurationDetector.TryDetectDurationSeconds(filePath);

            // ── STEP 4: Upsert NarrationDraft (bản dịch) ────────────────────
            var now = DateTime.UtcNow;
            var existingDraft = await db.NarrationDrafts
                .FirstOrDefaultAsync(d => d.PoiId == source.PoiId && d.LanguageCode == targetLang, ct)
                .ConfigureAwait(false);

            if (existingDraft is null)
            {
                existingDraft = new NarrationDraft
                {
                    PoiId    = source.PoiId,
                    LanguageCode = targetLang,
                    CreatedAt = now,
                };
                await db.NarrationDrafts.AddAsync(existingDraft, ct).ConfigureAwait(false);
            }

            existingDraft.Title            = translatedTitle.Trim();
            existingDraft.TextContent      = translatedText.Trim();
            existingDraft.Voice            = TtsVoiceMap.Get(targetLang).VoiceName;
            existingDraft.Status           = NarrationDraftStatuses.AudioGenerated;
            existingDraft.SubmittedByUserId = source.SubmittedByUserId;
            existingDraft.SubmittedAt      = now;
            existingDraft.ReviewedByUserId = source.ReviewedByUserId;
            existingDraft.ReviewedAt       = now;
            existingDraft.RejectionReason  = null;
            existingDraft.AudioGeneratedAt = now;
            existingDraft.UpdatedAt        = now;

            await db.SaveChangesAsync(ct).ConfigureAwait(false);

            // ── STEP 5: Upsert AudioTrack ────────────────────────────────────
            var audioTrack = await db.AudioTracks
                .FirstOrDefaultAsync(a =>
                    a.POIId == source.PoiId &&
                    a.LanguageCode == targetLang &&
                    a.DeletedAt == null, ct)
                .ConfigureAwait(false);

            if (audioTrack is null)
            {
                audioTrack = new AudioTrack
                {
                    POIId        = source.PoiId,
                    LanguageCode = targetLang,
                    CreatedAt    = now,
                };
                await db.AudioTracks.AddAsync(audioTrack, ct).ConfigureAwait(false);
            }
            else
            {
                audioTrack.Version++;
            }

            audioTrack.Title           = translatedTitle.Trim();
            audioTrack.AudioType       = "prerecorded";
            audioTrack.FileUrl         = relativeUrl;
            audioTrack.TTSText         = translatedText.Trim();
            audioTrack.DurationSeconds = durationSeconds;
            audioTrack.FileSizeBytes   = audioBytes.Length;
            audioTrack.MimeType        = "audio/mpeg";
            audioTrack.IsActive        = true;
            audioTrack.UpdatedAt       = now;

            existingDraft.GeneratedAudioTrack = audioTrack;

            await db.SaveChangesAsync(ct).ConfigureAwait(false);

            logger.LogInformation(
                "Pipeline lang={Lang} done: Draft={TranslatedDraftId} AudioTrack={TrackId}",
                targetLang, existingDraft.Id, audioTrack.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error in pipeline lang={Lang} Draft={DraftId}", targetLang, source.Id);
        }
        finally
        {
            semaphore.Release();
        }
    }
}
