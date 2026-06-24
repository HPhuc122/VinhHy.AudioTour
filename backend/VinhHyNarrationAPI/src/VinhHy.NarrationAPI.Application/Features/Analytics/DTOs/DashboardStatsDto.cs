namespace VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;

public class DashboardStatsDto
{
    public int TotalPois { get; set; }

    public int TotalTours { get; set; }

    public int ActiveTours { get; set; }

    public int TotalQrCodes { get; set; }

    public int ActiveQrCodes { get; set; }

    public int TotalMediaFiles { get; set; }

    public int TotalImages { get; set; }

    public int TotalAudioFiles { get; set; }

    public int DeletedMediaFiles { get; set; }

    public int PendingImages { get; set; }

    public int PendingNarrations { get; set; }

    public int PendingReviewPois { get; set; }

    public int ApprovedPois { get; set; }

    public int PendingPaymentPois { get; set; }

    public int ActivePois { get; set; }

    public int ExpiredPois { get; set; }

    public int RejectedPois { get; set; }

    public int? TotalTourViews { get; set; }

    public int TotalQrScans { get; set; }

    public int TotalAudioPlays { get; set; }

    public int TotalSiteVisits { get; set; }

    public int? TotalVendorPoiVisits { get; set; }

    /// <summary>
    /// Number of browser sessions currently active on the public web (in-memory presence, not a DB count).
    /// Resets to 0 on API restart. Reflects "right now" visitor count.
    /// </summary>
    public int ActiveVisitors { get; set; }

    /// <summary>
    /// For vendor role only: number of browser sessions currently viewing this vendor's primary POI.
    /// Null for admin/analytics roles.
    /// </summary>
    public int? ActiveVisitorsByPoi { get; set; }
}
