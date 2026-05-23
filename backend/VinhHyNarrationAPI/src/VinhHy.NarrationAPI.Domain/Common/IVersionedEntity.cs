namespace VinhHy.NarrationAPI.Domain.Common;

public interface IVersionedEntity
{
    int Version { get; set; }
    DateTime UpdatedAt { get; set; }
}
