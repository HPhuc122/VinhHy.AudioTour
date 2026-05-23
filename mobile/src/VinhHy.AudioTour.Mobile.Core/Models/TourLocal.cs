using VinhHy.AudioTour.Mobile.Core.Constants;

namespace VinhHy.AudioTour.Mobile.Core.Models;

public class TourLocal
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string DefaultLanguage { get; set; } = AppConstants.DefaultLanguage;

    public bool IsActive { get; set; } = true;

    public int? EstimatedMinutes { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;

    public DateTime UpdatedAt { get; set; }
}
