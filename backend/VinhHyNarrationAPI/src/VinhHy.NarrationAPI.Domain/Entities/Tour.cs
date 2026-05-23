using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class Tour : ISoftDeletable, IVersionedEntity, IAuditableEntity
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string DefaultLanguage { get; set; } = "vi";

    public bool IsActive { get; set; } = true;

    public int? EstimatedMinutes { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<TourTranslation> Translations { get; set; } = [];

    public ICollection<TourPoi> TourPois { get; set; } = [];

    public ICollection<OfflinePackage> OfflinePackages { get; set; } = [];
}
