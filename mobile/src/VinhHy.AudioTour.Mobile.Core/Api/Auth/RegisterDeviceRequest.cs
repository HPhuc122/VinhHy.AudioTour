namespace VinhHy.AudioTour.Mobile.Core.Api.Auth;

public class RegisterDeviceRequest
{
    public string DeviceId { get; set; } = string.Empty;

    public string Platform { get; set; } = string.Empty;

    public string? AppVersion { get; set; }

    public string? OsVersion { get; set; }

    public string? PushToken { get; set; }
}
