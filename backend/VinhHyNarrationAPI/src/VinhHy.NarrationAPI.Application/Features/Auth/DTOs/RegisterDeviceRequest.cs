namespace VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

public class RegisterDeviceRequest
{
    public string DeviceId { get; set; } = null!;

    public string Platform { get; set; } = null!;

    public string? AppVersion { get; set; }

    public string? OsVersion { get; set; }

    public string? PushToken { get; set; }
}
