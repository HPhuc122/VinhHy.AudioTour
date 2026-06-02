using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("SyncRetryQueue")]
public sealed class SyncRetryQueueEntity
{
    [PrimaryKey, AutoIncrement]
    public long Id { get; set; }

    public string Operation { get; set; } = string.Empty;

    public int AttemptCount { get; set; }

    public DateTime NextAttemptAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? LastError { get; set; }
}
