using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Mvvm;

namespace VinhHy.AudioTour.Mobile.ViewModels;

public partial class SyncStatusViewModel(
    IOfflineSyncCoordinator syncCoordinator,
    IConnectivityMonitor connectivity,
    ISyncCursorRepository syncCursors,
    INarrationLogQueueService narrationQueue) : ViewModelBase
{
    [ObservableProperty]
    private bool _isOnline;

    [ObservableProperty]
    private int _pendingLogCount;

    [ObservableProperty]
    private DateTime? _lastPoiSync;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        Title = "Sync";
        IsOnline = connectivity.IsConnected;
        var cursor = await syncCursors.GetAsync(SyncEntityTypes.POI, cancellationToken).ConfigureAwait(false);
        LastPoiSync = cursor?.LastSyncedAt;
        var pending = await narrationQueue.GetPendingAsync(cancellationToken).ConfigureAwait(false);
        PendingLogCount = pending.Count;
        StatusMessage = IsOnline ? "Online" : "Offline";
    }

    [RelayCommand]
    private async Task SyncNowAsync(CancellationToken cancellationToken = default)
    {
        if (IsBusy)
        {
            return;
        }

        try
        {
            IsBusy = true;
            StatusMessage = "Syncing...";
            await syncCoordinator.SyncNowAsync(cancellationToken).ConfigureAwait(false);
            await InitializeAsync(cancellationToken).ConfigureAwait(false);
            StatusMessage = "Sync completed";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }
}
