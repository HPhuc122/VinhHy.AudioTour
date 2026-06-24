using Microsoft.Extensions.Hosting;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

/// <summary>
/// Periodically removes stale presence entries to prevent unbounded memory growth.
/// Runs every 60 seconds; actual timeout threshold is defined inside PresenceStore.
/// </summary>
public sealed class PresencePurgeService(PresenceStore store) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(60));
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            store.Purge();
        }
    }
}
