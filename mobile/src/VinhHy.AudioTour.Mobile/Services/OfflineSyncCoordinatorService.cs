using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

/// <summary>
/// Pull-first sync orchestration with persisted retry queue and connectivity recovery.
/// </summary>
public sealed class OfflineSyncCoordinatorService(
    ISyncService syncService,
    IConnectivityMonitor connectivity,
    ISyncRetryQueueRepository retryQueue) : IOfflineSyncCoordinator, IDisposable
{
    private readonly SemaphoreSlim _syncLock = new(1, 1);
    private bool _started;
    private bool _disposed;

    public void Start()
    {
        if (_started)
        {
            return;
        }

        connectivity.ConnectivityChanged += OnConnectivityChanged;
        _started = true;
    }

    public async Task SyncNowAsync(CancellationToken cancellationToken = default)
    {
        if (!connectivity.IsConnected)
        {
            return;
        }

        await _syncLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await syncService.SyncAllAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            await EnqueueRetryAsync(ex.Message, cancellationToken).ConfigureAwait(false);
            throw;
        }
        finally
        {
            _syncLock.Release();
        }
    }

    public async Task ProcessRetryQueueAsync(CancellationToken cancellationToken = default)
    {
        if (!connectivity.IsConnected)
        {
            return;
        }

        await _syncLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var due = await retryQueue
                .GetDueAsync(DateTime.UtcNow, limit: 5, cancellationToken)
                .ConfigureAwait(false);

            foreach (var item in due)
            {
                try
                {
                    await syncService.SyncAllAsync(cancellationToken).ConfigureAwait(false);
                    await retryQueue.RemoveAsync(item.Id, cancellationToken).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    item.AttemptCount++;
                    item.LastError = ex.Message;
                    item.NextAttemptAt = DateTime.UtcNow.Add(
                        TimeSpan.FromSeconds(Math.Min(300, Math.Pow(2, item.AttemptCount) * 5)));
                    await retryQueue.UpdateAsync(item, cancellationToken).ConfigureAwait(false);
                }
            }
        }
        finally
        {
            _syncLock.Release();
        }
    }

    private async void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
    {
        if (!e.IsOnline)
        {
            return;
        }

        try
        {
            await ProcessRetryQueueAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Retry sync failed: {ex.Message}");
        }
    }

    private Task EnqueueRetryAsync(string error, CancellationToken cancellationToken) =>
        retryQueue.EnqueueAsync(
            new SyncRetryItemLocal
            {
                Operation = SyncRetryOperations.PullAll,
                AttemptCount = 0,
                NextAttemptAt = DateTime.UtcNow.AddSeconds(30),
                CreatedAt = DateTime.UtcNow,
                LastError = error
            },
            cancellationToken);

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        if (_started)
        {
            connectivity.ConnectivityChanged -= OnConnectivityChanged;
        }

        _syncLock.Dispose();
        _disposed = true;
    }
}
