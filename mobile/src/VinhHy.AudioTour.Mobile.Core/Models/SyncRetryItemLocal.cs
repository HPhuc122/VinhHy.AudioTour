using VinhHy.AudioTour.Mobile.Core.Constants;

namespace VinhHy.AudioTour.Mobile.Core.Models;

public sealed class SyncRetryItemLocal
{
    public long Id { get; set; }

    public string Operation { get; set; } = SyncRetryOperations.PullAll;

    public int AttemptCount { get; set; }

    public DateTime NextAttemptAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? LastError { get; set; }
}
