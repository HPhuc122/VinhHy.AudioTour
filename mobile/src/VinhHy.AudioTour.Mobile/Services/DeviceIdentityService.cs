using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class DeviceIdentityService(
    ILocalSettingsService settings,
    IDeviceRegistrationRepository deviceRepository) : IDeviceIdentityService
{
    public async Task<string> GetOrCreateDeviceIdAsync(CancellationToken cancellationToken = default)
    {
        var existing = await settings.GetAsync(SettingKeys.DeviceId, cancellationToken).ConfigureAwait(false);
        if (!string.IsNullOrWhiteSpace(existing))
        {
            return existing;
        }

        var deviceId = Guid.NewGuid().ToString("D");
        await settings.SetAsync(SettingKeys.DeviceId, deviceId, cancellationToken).ConfigureAwait(false);

        var platform = DeviceInfo.Platform.ToString().ToLowerInvariant();
        if (platform == "unknown")
        {
            platform = "android";
        }

        await deviceRepository.UpsertAsync(
            new DeviceRegistrationLocal
            {
                DeviceId = deviceId,
                Platform = platform switch
                {
                    "android" => "android",
                    "ios" => "ios",
                    _ => "windows"
                },
                AppVersion = AppInfo.VersionString,
                OsVersion = DeviceInfo.VersionString,
                RegisteredAt = DateTime.UtcNow
            },
            cancellationToken).ConfigureAwait(false);

        return deviceId;
    }
}
