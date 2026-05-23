using VinhHy.AudioTour.Mobile.ViewModels;

namespace VinhHy.AudioTour.Mobile.Views;

public partial class SyncStatusPage : ContentPage
{
    public SyncStatusPage(SyncStatusViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is SyncStatusViewModel vm)
        {
            await vm.InitializeAsync();
        }
    }
}
