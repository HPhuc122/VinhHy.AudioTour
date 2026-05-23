using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Services;

/// <summary>
/// Placeholder for future foreground/background tour session orchestration.
/// </summary>
public sealed class BackgroundTourService(ILocalSettingsService settings) : IBackgroundTourService
{
    public int? ActiveTourId { get; private set; }

    public async Task StartTourAsync(int tourId, CancellationToken cancellationToken = default)
    {
        ActiveTourId = tourId;
        await settings.SetAsync(SettingKeys.ActiveTourId, tourId.ToString(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task StopTourAsync(CancellationToken cancellationToken = default)
    {
        ActiveTourId = null;
        await settings.RemoveAsync(SettingKeys.ActiveTourId, cancellationToken).ConfigureAwait(false);
    }
}
