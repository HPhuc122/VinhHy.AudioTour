namespace VinhHy.NarrationAPI.Domain.Entities;

public class SyncHistory
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public string SyncType { get; set; } = null!;

    public DateTime SyncedAt { get; set; }

    public int? RecordsIn { get; set; }

    public int? RecordsOut { get; set; }

    public bool Success { get; set; } = true;

    public string? ErrorMessage { get; set; }

    public string? DeviceId { get; set; }

    public User User { get; set; } = null!;

    public Device? Device { get; set; }
}
