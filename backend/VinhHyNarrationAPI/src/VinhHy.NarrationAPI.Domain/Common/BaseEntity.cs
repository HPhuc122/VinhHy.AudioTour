namespace VinhHy.NarrationAPI.Domain.Common;

/// <summary>
/// Root type for persisted entities with an integer primary key.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
}
