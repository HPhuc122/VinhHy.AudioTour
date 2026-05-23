namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncPushResponse
{
    public int RecordsAccepted { get; set; }

    public int RecordsRejected { get; set; }

    public DateTime ServerTimestamp { get; set; }

    public IReadOnlyList<string> Errors { get; set; } = [];
}
