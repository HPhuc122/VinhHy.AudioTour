namespace VinhHy.NarrationAPI.Application.Features.Devices.DTOs;

public class DeviceDto
{
    public int Id { get; set; }

    public string DeviceId { get; set; } = null!;

    public int? UserId { get; set; }

    public string Platform { get; set; } = null!;

    public string? AppVersion { get; set; }

    public string? OsVersion { get; set; }

    public DateTime LastSeenAt { get; set; }

    public DateTime RegisteredAt { get; set; }
}
