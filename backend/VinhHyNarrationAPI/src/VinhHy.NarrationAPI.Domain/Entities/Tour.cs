using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class Tour : SyncableEntity
{
    public string Code { get; set; } = null!;

    public string DefaultLanguage { get; set; } = "vi";

    public bool IsActive { get; set; } = true;

    public int? EstimatedMinutes { get; set; }

    public ICollection<TourTranslation> Translations { get; set; } = [];

    public ICollection<TourPoi> TourPois { get; set; } = [];

    public ICollection<OfflinePackage> OfflinePackages { get; set; } = [];
}
