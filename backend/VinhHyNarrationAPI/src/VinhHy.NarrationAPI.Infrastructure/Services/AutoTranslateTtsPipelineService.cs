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
// Queue
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
// Background worker
// ─────────────────────────────────────────────────────────────────────────────
public sealed class AutoTranslateTtsPipelineService(
    IAutoTranslateTtsQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<AutoTranslateTtsPipelineService> logger) : BackgroundService
{
    // Giới hạn số ngôn ngữ chạy song song (mỗi lang dùng scope DbContext riêng)
    private const int MaxParallelPerDraft = 3;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AutoTranslateTtsPipelineService started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            int draftId;
            try { draftId = await queue.DequeueAsync(stoppingToken).ConfigureAwait(false); }
            catch (OperationCanceledException) { break; }
            _ = ProcessDraftAsync(draftId, stoppingToken);
        }
        logger.LogInformation("AutoTranslateTtsPipelineService stopped.");
    }

    private async Task ProcessDraftAsync(int sourceDraftId, CancellationToken ct)
    {
        // ── Load source draft ────────────────────────────────────────────────
        SourceDraftInfo? source;
        List<string> targetLanguages;

        using (var scope = scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var draft = await db.NarrationDrafts
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == sourceDraftId, ct)
                .ConfigureAwait(false);

            if (draft is null)
            {
                logger.LogWarning("NarrationDraft {DraftId} not found, skipping.", sourceDraftId);
                return;
            }

            if (draft.Status != NarrationDraftStatuses.Approved &&
                draft.Status != NarrationDraftStatuses.Translating)
            {
                logger.LogWarning("NarrationDraft {DraftId} status='{Status}', skipping.", sourceDraftId, draft.Status);
                return;
            }

            source = new SourceDraftInfo(
                draft.Id, draft.PoiId, draft.LanguageCode,
                draft.Title, draft.TextContent,
                draft.SubmittedByUserId, draft.ReviewedByUserId);

            // Tất cả ngôn ngữ active trong DB (kể cả ngôn ngữ nguồn để sinh TTS bản gốc)
            targetLanguages = await db.Languages
                .AsNoTracking()
                .Where(l => l.IsActive)
                .Select(l => l.Code)
                .ToListAsync(ct)
                .ConfigureAwait(false);

            // Đánh dấu Translating
            await db.NarrationDrafts
                .Where(d => d.Id == sourceDraftId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(d => d.Status, NarrationDraftStatuses.Translating)
                    .SetProperty(d => d.UpdatedAt, DateTime.UtcNow), ct)
                .ConfigureAwait(false);
        }

        if (targetLanguages.Count == 0)
        {
            logger.LogInformation("No active languages for Draft={DraftId}, done.", sourceDraftId);
            return;
        }

        logger.LogInformation(
            "Pipeline Draft={DraftId} POI={PoiId} → [{Langs}]",
            sourceDraftId, source.PoiId, string.Join(", ", targetLanguages));

        // ── Xử lý từng ngôn ngữ — MỖI LANG DÙNG SCOPE RIÊNG để tránh race ──
        var semaphore = new SemaphoreSlim(MaxParallelPerDraft);
        var tasks = targetLanguages.Select(lang => ProcessOneLanguageAsync(source, lang, semaphore, ct));
        await Task.WhenAll(tasks).ConfigureAwait(false);

        // ── Đánh dấu source draft hoàn thành ────────────────────────────────
        using (var scope = scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.NarrationDrafts
                .Where(d => d.Id == sourceDraftId && d.Status == NarrationDraftStatuses.Translating)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(d => d.Status, NarrationDraftStatuses.AudioGenerated)
                    .SetProperty(d => d.UpdatedAt, DateTime.UtcNow), ct)
                .ConfigureAwait(false);
        }

        logger.LogInformation("Pipeline completed for Draft={DraftId}", sourceDraftId);
    }

    // ── Mỗi ngôn ngữ: scope DbContext riêng → không có race condition ────────
    private async Task ProcessOneLanguageAsync(
        SourceDraftInfo source,
        string targetLang,
        SemaphoreSlim semaphore,
        CancellationToken ct)
    {
        await semaphore.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db          = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var tts         = scope.ServiceProvider.GetRequiredService<IGoogleTtsService>();
            var environment = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

            string finalTitle, finalText;

            if (targetLang == source.LanguageCode)
            {
                // ── Ngôn ngữ nguồn: không cần dịch, chỉ sinh TTS bản gốc ──
                finalTitle = source.Title;
                finalText  = source.TextContent;
                logger.LogInformation("TTS source lang={Lang} Draft={DraftId}", targetLang, source.Id);
            }
            else
            {
                // ── Ngôn ngữ đích: dịch trước rồi TTS ───────────────────────
                var translator = scope.ServiceProvider.GetRequiredService<ITranslationProvider>();
                logger.LogInformation("Translating Draft={DraftId} → {Lang}", source.Id, targetLang);
                try
                {
                    finalTitle = await translator
                        .TranslateAsync(source.Title, source.LanguageCode, targetLang, ct)
                        .ConfigureAwait(false);
                    finalText = await translator
                        .TranslateAsync(source.TextContent, source.LanguageCode, targetLang, ct)
                        .ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Translation failed Draft={DraftId} → {Lang}", source.Id, targetLang);
                    return;
                }
            }

            // ── TTS → MP3 bytes ───────────────────────────────────────────────
            byte[] audioBytes;
            try
            {
                audioBytes = await tts.SynthesizeAsync(finalText, targetLang, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "TTS failed Draft={DraftId} lang={Lang}", source.Id, targetLang);
                return;
            }

            // ── Lưu MP3 ra disk ───────────────────────────────────────────────
            var fileName    = $"{Guid.NewGuid():N}.mp3";
            var audioDir    = Path.Combine(environment.ContentRootPath, "uploads", "audio");
            Directory.CreateDirectory(audioDir);
            var filePath    = Path.Combine(audioDir, fileName);
            await File.WriteAllBytesAsync(filePath, audioBytes, ct).ConfigureAwait(false);
            var relativeUrl = $"uploads/audio/{fileName}";
            var duration    = Mp3DurationDetector.TryDetectDurationSeconds(filePath);

            // ── Upsert NarrationDraft cho ngôn ngữ này ────────────────────────
            var now = DateTime.UtcNow;

            // Nếu là ngôn ngữ nguồn, draft đã tồn tại (chính source draft)
            // Với ngôn ngữ đích, có thể đã tồn tại từ lần chạy trước
            NarrationDraft? draftForLang;
            if (targetLang == source.LanguageCode)
            {
                draftForLang = await db.NarrationDrafts
                    .FirstOrDefaultAsync(d => d.Id == source.Id, ct)
                    .ConfigureAwait(false);
            }
            else
            {
                draftForLang = await db.NarrationDrafts
                    .FirstOrDefaultAsync(d => d.PoiId == source.PoiId && d.LanguageCode == targetLang, ct)
                    .ConfigureAwait(false);
            }

            if (draftForLang is null)
            {
                draftForLang = new NarrationDraft
                {
                    PoiId        = source.PoiId,
                    LanguageCode = targetLang,
                    CreatedAt    = now,
                };
                await db.NarrationDrafts.AddAsync(draftForLang, ct).ConfigureAwait(false);
            }

            draftForLang.Title             = finalTitle.Trim();
            draftForLang.TextContent       = finalText.Trim();
            draftForLang.Voice             = TtsVoiceMap.Get(targetLang).VoiceName;
            draftForLang.Status            = NarrationDraftStatuses.AudioGenerated;
            draftForLang.SubmittedByUserId = source.SubmittedByUserId;
            draftForLang.SubmittedAt       = now;
            draftForLang.ReviewedByUserId  = source.ReviewedByUserId;
            draftForLang.ReviewedAt        = now;
            draftForLang.RejectionReason   = null;
            draftForLang.AudioGeneratedAt  = now;
            draftForLang.UpdatedAt         = now;

            await db.SaveChangesAsync(ct).ConfigureAwait(false);

            // ── Upsert AudioTrack ─────────────────────────────────────────────
            var audioTrack = await db.AudioTracks
                .IgnoreQueryFilters()
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

            audioTrack.Title          = finalTitle.Trim();
            audioTrack.AudioType      = "prerecorded";
            audioTrack.FileUrl        = relativeUrl;
            audioTrack.TTSText        = finalText.Trim();
            audioTrack.DurationSeconds = duration;
            audioTrack.FileSizeBytes  = audioBytes.Length;
            audioTrack.MimeType       = "audio/mpeg";
            audioTrack.IsActive       = true;
            audioTrack.UpdatedAt      = now;

            draftForLang.GeneratedAudioTrack = audioTrack;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);

            logger.LogInformation(
                "Done lang={Lang} Draft={TranslatedId} AudioTrack={TrackId}",
                targetLang, draftForLang.Id, audioTrack.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error lang={Lang} Draft={DraftId}", targetLang, source.Id);
        }
        finally
        {
            semaphore.Release();
        }
    }

    private sealed record SourceDraftInfo(
        int Id,
        int PoiId,
        string LanguageCode,
        string Title,
        string TextContent,
        int SubmittedByUserId,
        int? ReviewedByUserId);
}
