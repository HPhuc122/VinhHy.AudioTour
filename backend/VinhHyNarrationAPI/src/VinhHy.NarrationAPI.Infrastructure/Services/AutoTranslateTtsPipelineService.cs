using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

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

    public ValueTask EnqueueAsync(int sourceDraftId, CancellationToken ct = default) =>
        _channel.Writer.WriteAsync(sourceDraftId, ct);

    public ValueTask<int> DequeueAsync(CancellationToken ct) =>
        _channel.Reader.ReadAsync(ct);
}

public sealed class AutoTranslateTtsPipelineService(
    IAutoTranslateTtsQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<AutoTranslateTtsPipelineService> logger) : BackgroundService
{
    private const int MaxParallelPerDraft = 3;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AutoTranslateTtsPipelineService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            int draftId;
            try
            {
                draftId = await queue.DequeueAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            _ = ProcessDraftAsync(draftId, stoppingToken);
        }

        logger.LogInformation("AutoTranslateTtsPipelineService stopped.");
    }

    private async Task ProcessDraftAsync(int sourceDraftId, CancellationToken ct)
    {
        SourceDraftInfo source;
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
                logger.LogWarning("NarrationDraft {DraftId} not found, skipping pipeline.", sourceDraftId);
                return;
            }

            if (draft.Status != NarrationDraftStatuses.Approved &&
                draft.Status != NarrationDraftStatuses.AudioGenerated &&
                draft.Status != NarrationDraftStatuses.Translating)
            {
                logger.LogWarning(
                    "NarrationDraft {DraftId} is in status '{Status}', skipping pipeline.",
                    sourceDraftId,
                    draft.Status);
                return;
            }

            source = new SourceDraftInfo(
                draft.Id,
                draft.PoiId,
                draft.LanguageCode,
                draft.Title,
                draft.TextContent,
                draft.SubmittedByUserId,
                draft.ReviewedByUserId);

            targetLanguages = await db.Languages
                .AsNoTracking()
                .Where(l => l.IsActive)
                .Select(l => l.Code)
                .ToListAsync(ct)
                .ConfigureAwait(false);

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
            "Pipeline starting for Draft={DraftId} POI={PoiId} source={SourceLang} targets=[{Langs}]",
            sourceDraftId,
            source.PoiId,
            source.LanguageCode,
            string.Join(", ", targetLanguages));

        using var semaphore = new SemaphoreSlim(MaxParallelPerDraft);
        var tasks = targetLanguages.Select(lang => ProcessOneLanguageAsync(source, lang, semaphore, ct));
        await Task.WhenAll(tasks).ConfigureAwait(false);

        using (var scope = scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var refreshed = await db.NarrationDrafts
                .FirstOrDefaultAsync(d => d.Id == sourceDraftId, ct)
                .ConfigureAwait(false);

            if (refreshed is not null && refreshed.Status == NarrationDraftStatuses.Translating)
            {
                refreshed.Status = refreshed.GeneratedAudioTrackId.HasValue
                    ? NarrationDraftStatuses.AudioGenerated
                    : NarrationDraftStatuses.Approved;
                refreshed.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct).ConfigureAwait(false);
            }
        }

        logger.LogInformation("Pipeline completed for Draft={DraftId}", sourceDraftId);
    }

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
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var tts = scope.ServiceProvider.GetRequiredService<IGoogleTtsService>();
            var environment = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

            string finalTitle;
            string finalText;

            if (string.Equals(targetLang, source.LanguageCode, StringComparison.OrdinalIgnoreCase))
            {
                finalTitle = source.Title;
                finalText = source.TextContent;
                logger.LogInformation("Synthesizing source Draft={DraftId} lang={Lang}", source.Id, targetLang);
            }
            else
            {
                var translator = scope.ServiceProvider.GetRequiredService<ITranslationProvider>();
                logger.LogInformation("Translating Draft={DraftId} to {Lang}", source.Id, targetLang);

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
                    logger.LogError(ex, "Translation failed for Draft={DraftId} lang={Lang}", source.Id, targetLang);
                    return;
                }
            }

            byte[] audioBytes;
            try
            {
                audioBytes = await tts.SynthesizeAsync(finalText, targetLang, ct).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "TTS failed for Draft={DraftId} lang={Lang}", source.Id, targetLang);
                return;
            }

            var draftForLang = await GetOrCreateDraftForLanguageAsync(source, targetLang, finalTitle, finalText, db, ct)
                .ConfigureAwait(false);

            var audioTrack = await SaveAudioAsync(draftForLang, finalTitle, finalText, targetLang, audioBytes, db, environment, ct)
                .ConfigureAwait(false);

            logger.LogInformation(
                "Pipeline lang={Lang} done: Draft={DraftId} AudioTrack={TrackId}",
                targetLang,
                draftForLang.Id,
                audioTrack.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected pipeline error for Draft={DraftId} lang={Lang}", source.Id, targetLang);
        }
        finally
        {
            semaphore.Release();
        }
    }

    private static async Task<NarrationDraft> GetOrCreateDraftForLanguageAsync(
        SourceDraftInfo source,
        string targetLang,
        string title,
        string text,
        ApplicationDbContext db,
        CancellationToken ct)
    {
        var isSourceLanguage = string.Equals(targetLang, source.LanguageCode, StringComparison.OrdinalIgnoreCase);
        var draft = isSourceLanguage
            ? await db.NarrationDrafts.FirstOrDefaultAsync(d => d.Id == source.Id, ct).ConfigureAwait(false)
            : await db.NarrationDrafts
                .FirstOrDefaultAsync(d => d.PoiId == source.PoiId && d.LanguageCode == targetLang, ct)
                .ConfigureAwait(false);

        var now = DateTime.UtcNow;
        if (draft is null)
        {
            draft = new NarrationDraft
            {
                PoiId = source.PoiId,
                LanguageCode = targetLang,
                CreatedAt = now
            };
            await db.NarrationDrafts.AddAsync(draft, ct).ConfigureAwait(false);
        }

        draft.Title = title.Trim();
        draft.TextContent = text.Trim();
        draft.Voice = TtsVoiceMap.Get(targetLang).VoiceName;
        draft.Status = NarrationDraftStatuses.AudioGenerated;
        draft.SubmittedByUserId = source.SubmittedByUserId;
        draft.SubmittedAt = now;
        draft.ReviewedByUserId = source.ReviewedByUserId;
        draft.ReviewedAt = now;
        draft.RejectionReason = null;
        draft.AudioGeneratedAt = now;
        draft.UpdatedAt = now;

        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        return draft;
    }

    private static async Task<AudioTrack> SaveAudioAsync(
        NarrationDraft draft,
        string title,
        string text,
        string languageCode,
        byte[] audioBytes,
        ApplicationDbContext db,
        IHostEnvironment environment,
        CancellationToken ct)
    {
        var fileName = $"{Guid.NewGuid():N}.mp3";
        var audioDir = Path.Combine(environment.ContentRootPath, "uploads", "audio");
        Directory.CreateDirectory(audioDir);

        var filePath = Path.Combine(audioDir, fileName);
        await File.WriteAllBytesAsync(filePath, audioBytes, ct).ConfigureAwait(false);

        var now = DateTime.UtcNow;
        var audioTrack = await db.AudioTracks
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(a =>
                a.POIId == draft.PoiId &&
                a.LanguageCode == languageCode &&
                a.DeletedAt == null,
                ct)
            .ConfigureAwait(false);

        if (audioTrack is null)
        {
            audioTrack = new AudioTrack
            {
                POIId = draft.PoiId,
                LanguageCode = languageCode,
                CreatedAt = now
            };
            await db.AudioTracks.AddAsync(audioTrack, ct).ConfigureAwait(false);
        }
        else
        {
            audioTrack.Version++;
        }

        audioTrack.Title = title.Trim();
        audioTrack.AudioType = "prerecorded";
        audioTrack.FileUrl = $"uploads/audio/{fileName}";
        audioTrack.TTSText = text.Trim();
        audioTrack.DurationSeconds = Mp3DurationDetector.TryDetectDurationSeconds(filePath);
        audioTrack.FileSizeBytes = audioBytes.Length;
        audioTrack.MimeType = "audio/mpeg";
        audioTrack.IsActive = true;
        audioTrack.UpdatedAt = now;

        draft.GeneratedAudioTrack = audioTrack;
        draft.Status = NarrationDraftStatuses.AudioGenerated;
        draft.AudioGeneratedAt = now;
        draft.UpdatedAt = now;

        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        return audioTrack;
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
