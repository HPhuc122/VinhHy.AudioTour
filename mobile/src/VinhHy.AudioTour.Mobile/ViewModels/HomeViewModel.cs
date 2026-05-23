using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Mvvm;

namespace VinhHy.AudioTour.Mobile.ViewModels;

public partial class HomeViewModel(IPoiRepository poiRepository) : ViewModelBase
{
    [ObservableProperty]
    private int _poiCount;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        if (IsBusy)
        {
            return;
        }

        Title = "Vinh Hy Audio Tour";

        try
        {
            IsBusy = true;
            var pois = await poiRepository.GetActiveForGeofenceAsync(cancellationToken).ConfigureAwait(false);
            PoiCount = pois.Count;
            StatusMessage = $"{PoiCount} POI(s) available offline";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private Task RefreshAsync() => InitializeAsync();
}
