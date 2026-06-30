using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public sealed class NarrationDraftTextChangeMonitorService(
    IServiceScopeFactory scopeFactory,
    IAutoTranslateTtsQueue queue,
    ILogger<NarrationDraftTextChangeMonitorService> logger) : BackgroundService
{
    private static readonly TimeSpan ScanInterval = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan EnqueueCooldown = TimeSpan.FromMinutes(2);
    private readonly Dictionary<int, DateTime> _recentlyQueued = [];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("NarrationDraftTextChangeMonitorService started.");

        using var timer = new PeriodicTimer(ScanInterval);
        while (!stoppingToken.IsCancellationRequested)
        {
            await ScanOnceAsync(stoppingToken).ConfigureAwait(false);

            try
            {
                await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        logger.LogInformation("NarrationDraftTextChangeMonitorService stopped.");
    }

    private async Task ScanOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTime.UtcNow;
            var cutoff = now.Subtract(EnqueueCooldown);

            foreach (var key in _recentlyQueued.Where(item => item.Value < cutoff).Select(item => item.Key).ToList())
            {
                _recentlyQueued.Remove(key);
            }

            var candidates = await db.NarrationDrafts
                .AsNoTracking()
                .Include(draft => draft.GeneratedAudioTrack)
                .Where(draft =>
                    draft.Status == NarrationDraftStatuses.Approved ||
                    draft.Status == NarrationDraftStatuses.AudioGenerated)
                .Where(draft =>
                    draft.TextContent != "" &&
                    (
                        draft.GeneratedAudioTrack == null ||
                        draft.GeneratedAudioTrack.TTSText == null ||
                        draft.GeneratedAudioTrack.TTSText != draft.TextContent
                    ))
                .OrderByDescending(draft => draft.UpdatedAt)
                .Take(20)
                .Select(draft => draft.Id)
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            foreach (var draftId in candidates)
            {
                if (_recentlyQueued.ContainsKey(draftId))
                {
                    continue;
                }

                _recentlyQueued[draftId] = now;
                await queue.EnqueueAsync(draftId, cancellationToken).ConfigureAwait(false);
                logger.LogInformation(
                    "Queued NarrationDraft {DraftId} because TextContent differs from generated audio TTSText.",
                    draftId);
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to scan NarrationDraft text/audio drift.");
        }
    }
}
