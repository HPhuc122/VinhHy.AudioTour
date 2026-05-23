namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncPushRequest
{
    public int UserId { get; set; }

    public string? DeviceId { get; set; }

    public IReadOnlyList<SyncNarrationLogItem> NarrationLogs { get; set; } = [];
}
