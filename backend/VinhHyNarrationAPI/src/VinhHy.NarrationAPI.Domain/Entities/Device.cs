namespace VinhHy.NarrationAPI.Domain.Entities;

public class Device
{
    public int Id { get; set; }

    public string DeviceId { get; set; } = null!;

    public int? UserId { get; set; }

    public string Platform { get; set; } = null!;

    public string? AppVersion { get; set; }

    public string? OsVersion { get; set; }

    public string? PushToken { get; set; }

    public DateTime LastSeenAt { get; set; }

    public DateTime RegisteredAt { get; set; }

    public User? User { get; set; }

    public ICollection<NarrationLog> NarrationLogs { get; set; } = [];

    public ICollection<SyncHistory> SyncHistories { get; set; } = [];
}
