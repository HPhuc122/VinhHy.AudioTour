using CommunityToolkit.Mvvm.ComponentModel;

namespace VinhHy.AudioTour.Mobile.Mvvm;

public abstract partial class ViewModelBase : ObservableObject
{
    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string? _title;

    [ObservableProperty]
    private string? _statusMessage;
}
