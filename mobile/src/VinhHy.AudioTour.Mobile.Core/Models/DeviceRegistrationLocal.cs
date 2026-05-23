namespace VinhHy.AudioTour.Mobile.Core.Models;

public class DeviceRegistrationLocal
{
    public string DeviceId { get; set; } = string.Empty;

    public string Platform { get; set; } = string.Empty;

    public string? AppVersion { get; set; }

    public string? OsVersion { get; set; }

    public string? PushToken { get; set; }

    public DateTime RegisteredAt { get; set; }

    public DateTime? LastSyncedAt { get; set; }
}
