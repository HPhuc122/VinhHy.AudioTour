using VinhHy.AudioTour.Mobile.Core.Api.Sync;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Exceptions;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Mapping;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class SyncOrchestratorService(
    IApiClient apiClient,
    IConnectivityMonitor connectivity,
    IDeviceIdentityService deviceIdentity,
    ISyncCursorRepository syncCursors,
    IPoiRepository pois,
    IPoiTranslationRepository poiTranslations,
    IAudioTrackRepository audioTracks,
    ITourRepository tours,
    ITourTranslationRepository tourTranslations,
    IOfflinePackageRepository offlinePackages,
    IDeletedRecordRepository deletedRecords,
    INarrationLogQueueService narrationQueue) : ISyncService
{
    public async Task<SyncPullResponse> PullAsync(
        SyncPullRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await apiClient
            .PostAsync<SyncPullResponse>("api/v1/sync/pull", request, cancellationToken)
            .ConfigureAwait(false);

        if (!response.Success || response.Data is null)
        {
            throw new SyncException(response.Message ?? "Sync pull failed.");
        }

        return response.Data;
    }

    public async Task<SyncPushResponse> PushAsync(
        SyncPushRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await apiClient
            .PostAsync<SyncPushResponse>("api/v1/sync/push", request, cancellationToken)
            .ConfigureAwait(false);

        if (!response.Success || response.Data is null)
        {
            throw new SyncException(response.Message ?? "Sync push failed.");
        }

        return response.Data;
    }

    public async Task SyncAllAsync(CancellationToken cancellationToken = default)
    {
        if (!connectivity.IsConnected)
        {
            return;
        }

        var deviceId = await deviceIdentity.GetOrCreateDeviceIdAsync(cancellationToken).ConfigureAwait(false);
        var since = await GetEarliestCursorAsync(cancellationToken).ConfigureAwait(false);

        var pull = await PullAsync(
            new SyncPullRequest
            {
                Since = since,
                DeviceId = deviceId
            },
            cancellationToken).ConfigureAwait(false);

        await ApplyPullAsync(pull, cancellationToken).ConfigureAwait(false);
        await PushNarrationLogsAsync(deviceId, cancellationToken).ConfigureAwait(false);
    }

    private async Task<DateTime?> GetEarliestCursorAsync(CancellationToken cancellationToken)
    {
        var cursors = await syncCursors.GetAllAsync(cancellationToken).ConfigureAwait(false);
        if (cursors.Count == 0)
        {
            return null;
        }

        return cursors.Min(c => c.LastSyncedAt);
    }

    private async Task ApplyPullAsync(SyncPullResponse pull, CancellationToken cancellationToken)
    {
        var syncedAt = pull.ServerTimestamp;

        if (pull.Pois.Count > 0)
        {
            await pois.UpsertRangeAsync(
                pull.Pois.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);
        }

        if (pull.PoiTranslations.Count > 0)
        {
            await poiTranslations.UpsertRangeAsync(
                pull.PoiTranslations.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);
        }

        if (pull.AudioTracks.Count > 0)
        {
            await audioTracks.UpsertRangeAsync(
                pull.AudioTracks.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);
        }

        if (pull.Tours.Count > 0)
        {
            await tours.UpsertRangeAsync(
                pull.Tours.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);
        }

        if (pull.TourTranslations.Count > 0)
        {
            await tourTranslations.UpsertRangeAsync(
                pull.TourTranslations.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);
        }

        if (pull.OfflinePackages.Count > 0)
        {
            await offlinePackages.UpsertRangeAsync(
                pull.OfflinePackages.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);
        }

        if (pull.DeletedRecords.Count > 0)
        {
            await deletedRecords.InsertRangeAsync(
                pull.DeletedRecords.Select(SyncDtoMapper.ToLocal),
                cancellationToken).ConfigureAwait(false);

            await ProcessTombstonesAsync(cancellationToken).ConfigureAwait(false);
        }

        await UpdateCursorAsync(SyncEntityTypes.POI, syncedAt, cancellationToken).ConfigureAwait(false);
        await UpdateCursorAsync(SyncEntityTypes.AudioTrack, syncedAt, cancellationToken).ConfigureAwait(false);
        await UpdateCursorAsync(SyncEntityTypes.Tour, syncedAt, cancellationToken).ConfigureAwait(false);
        await UpdateCursorAsync(SyncEntityTypes.OfflinePackage, syncedAt, cancellationToken).ConfigureAwait(false);
        await UpdateCursorAsync(SyncEntityTypes.DeletedRecord, syncedAt, cancellationToken).ConfigureAwait(false);
    }

    private Task UpdateCursorAsync(string entityType, DateTime syncedAt, CancellationToken cancellationToken) =>
        syncCursors.UpsertAsync(
            new SyncCursorLocal { EntityType = entityType, LastSyncedAt = syncedAt },
            cancellationToken);

    private async Task ProcessTombstonesAsync(CancellationToken cancellationToken)
    {
        var pending = await deletedRecords.GetUnprocessedAsync(cancellationToken).ConfigureAwait(false);
        if (pending.Count == 0)
        {
            return;
        }

        var processedIds = new List<long>();

        foreach (var tombstone in pending)
        {
            switch (tombstone.EntityType)
            {
                case SyncEntityTypes.POI:
                    await pois.DeleteAsync(tombstone.EntityId, cancellationToken).ConfigureAwait(false);
                    break;
                case SyncEntityTypes.AudioTrack:
                    await audioTracks.DeleteAsync(tombstone.EntityId, cancellationToken).ConfigureAwait(false);
                    break;
                case SyncEntityTypes.Tour:
                    await tours.DeleteAsync(tombstone.EntityId, cancellationToken).ConfigureAwait(false);
                    break;
            }

            processedIds.Add(tombstone.Id);
        }

        await deletedRecords
            .MarkProcessedAsync(processedIds, DateTime.UtcNow, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task PushNarrationLogsAsync(string deviceId, CancellationToken cancellationToken)
    {
        var pending = await narrationQueue.GetPendingAsync(cancellationToken).ConfigureAwait(false);
        if (pending.Count == 0)
        {
            return;
        }

        var pushRequest = new SyncPushRequest
        {
            DeviceId = deviceId,
            NarrationLogs = pending.Select(item => new SyncNarrationLogItem
            {
                PoiId = item.PoiId,
                TriggerType = item.TriggerType,
                LanguageCode = item.LanguageCode,
                PlayedAt = item.PlayedAt,
                DurationPlayedSeconds = item.DurationPlayedSeconds
            }).ToList()
        };

        await PushAsync(pushRequest, cancellationToken).ConfigureAwait(false);
        await narrationQueue.MarkSyncedAsync(
            pending.Select(p => p.LocalLogId),
            cancellationToken).ConfigureAwait(false);
    }
}
