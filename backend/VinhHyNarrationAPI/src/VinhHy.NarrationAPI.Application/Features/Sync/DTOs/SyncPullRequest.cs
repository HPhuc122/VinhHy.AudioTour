namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncPullRequest
{
    public DateTime? Since { get; set; }

    public string? DeviceId { get; set; }

    public IReadOnlyList<string>? EntityTypes { get; set; }
}
