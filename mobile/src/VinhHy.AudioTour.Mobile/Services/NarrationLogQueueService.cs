using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class NarrationLogQueueService(
    INarrationLogRepository repository,
    IDeviceIdentityService deviceIdentity) : INarrationLogQueueService
{
    public async Task EnqueueAsync(NarrationQueueItem item, CancellationToken cancellationToken = default)
    {
        var deviceId = await deviceIdentity.GetOrCreateDeviceIdAsync(cancellationToken).ConfigureAwait(false);

        await repository.InsertAsync(
            new NarrationLogLocal
            {
                PoiId = item.PoiId,
                TriggerType = item.TriggerType,
                LanguageCode = item.LanguageCode,
                PlayedAt = item.PlayedAt,
                DurationPlayedSeconds = item.DurationPlayedSeconds,
                DeviceId = deviceId,
                Synced = false
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<NarrationQueueItem>> GetPendingAsync(
        CancellationToken cancellationToken = default)
    {
        var logs = await repository.GetPendingSyncAsync(500, cancellationToken).ConfigureAwait(false);
        return logs.Select(log => new NarrationQueueItem
        {
            LocalLogId = log.Id,
            PoiId = log.PoiId,
            TriggerType = log.TriggerType,
            LanguageCode = log.LanguageCode,
            PlayedAt = log.PlayedAt,
            DurationPlayedSeconds = log.DurationPlayedSeconds
        }).ToList();
    }

    public Task MarkSyncedAsync(IEnumerable<long> localLogIds, CancellationToken cancellationToken = default) =>
        repository.MarkSyncedAsync(localLogIds, DateTime.UtcNow, cancellationToken);
}
