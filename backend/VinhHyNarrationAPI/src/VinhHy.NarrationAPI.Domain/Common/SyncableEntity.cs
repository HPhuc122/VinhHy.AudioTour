namespace VinhHy.NarrationAPI.Domain.Common;

/// <summary>
/// Server-synced entity with soft-delete, versioning, and audit timestamps.
/// </summary>
public abstract class SyncableEntity : AuditableEntity, ISoftDeletable, IVersionedEntity
{
    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;
}
