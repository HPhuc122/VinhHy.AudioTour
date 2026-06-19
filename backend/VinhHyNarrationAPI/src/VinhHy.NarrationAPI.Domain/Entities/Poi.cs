using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

// Khai báo Enum kiểu byte để tránh lỗi InvalidCastException với SQL Server
public enum ApprovalStatus : byte
{
    Pending = 0,     // Chờ duyệt
    Approved = 1,    // Đã duyệt
    Rejected = 2     // Từ chối
}

public enum PoiPaymentStatus : byte
{
    NotRequired = 0,
    PendingPayment = 1,
    Paid = 2,
    Waived = 3
}

public class Poi : SyncableEntity
{
    public string Code { get; set; } = null!;

    // --- 4 TRƯỜNG DỮ LIỆU MỚI THÊM VÀO ---
    public string Name { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    // -------------------------------------

    public int? UserId { get; set; }

    public virtual User? User { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; } = 30;

    public int Priority { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public bool PaymentRequired { get; set; }

    public PoiPaymentStatus PaymentStatus { get; set; } = PoiPaymentStatus.NotRequired;

    public DateTime? ActivatedAt { get; set; }

    public int? ActivatedByUserId { get; set; }

    public virtual User? ActivatedByUser { get; set; }

    public string? ImageUrl { get; set; }

    public string? ImageUrls { get; set; }

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; } = 300;

    public int MinDwellSeconds { get; set; } = 5;

    public ICollection<PoiTranslation> Translations { get; set; } = [];

    public ICollection<AudioTrack> AudioTracks { get; set; } = [];

    public ICollection<TourPoi> TourPois { get; set; } = [];

    public ICollection<QrLocation> QrLocations { get; set; } = [];

    public ICollection<NarrationLog> NarrationLogs { get; set; } = [];

    public ICollection<AnalyticsDaily> AnalyticsDaily { get; set; } = [];
}
