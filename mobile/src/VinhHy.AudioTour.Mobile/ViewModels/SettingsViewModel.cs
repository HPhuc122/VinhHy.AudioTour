using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Mvvm;

namespace VinhHy.AudioTour.Mobile.ViewModels;

public partial class SettingsViewModel(
    ILocalSettingsService settings,
    IDeviceIdentityService deviceIdentity) : ViewModelBase
{
    [ObservableProperty]
    private string _apiBaseUrl = string.Empty;

    [ObservableProperty]
    private string _preferredLanguage = AppConstants.DefaultLanguage;

    [ObservableProperty]
    private string _deviceId = string.Empty;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        Title = "Settings";
        ApiBaseUrl = await settings.GetAsync(SettingKeys.ApiBaseUrl, cancellationToken).ConfigureAwait(false)
                     ?? string.Empty;
        PreferredLanguage = await settings
            .GetAsync(SettingKeys.PreferredLanguage, cancellationToken)
            .ConfigureAwait(false) ?? AppConstants.DefaultLanguage;
        DeviceId = await deviceIdentity.GetOrCreateDeviceIdAsync(cancellationToken).ConfigureAwait(false);
    }

    [RelayCommand]
    private async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        await settings.SetAsync(SettingKeys.ApiBaseUrl, ApiBaseUrl, cancellationToken).ConfigureAwait(false);
        await settings.SetAsync(SettingKeys.PreferredLanguage, PreferredLanguage, cancellationToken)
            .ConfigureAwait(false);
        StatusMessage = "Settings saved";
    }
}
