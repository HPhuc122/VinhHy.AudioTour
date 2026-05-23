using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class PoiTranslation : IVersionedEntity, IAuditableEntity
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public int Version { get; set; } = 1;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Poi Poi { get; set; } = null!;
}
