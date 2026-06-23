using VinhHy.NarrationAPI.Domain.Constants;

namespace VinhHy.NarrationAPI.Api.Authorization;

public static class RoleGroups
{
    public const string AdminOnly =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin}";

    public const string ContentManagement =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.ContentAdmin}";

    public const string VendorMedia =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.ContentAdmin},{RoleNames.Vendor}";

    public const string VendorPoiAccess =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.ContentAdmin},{RoleNames.TourOperator},{RoleNames.Vendor}";

    public const string VendorPoiRegistration =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.ContentAdmin},{RoleNames.Vendor}";

    public const string TourOperations =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.TourOperator}";

    public const string Analytics =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.AnalyticsViewer},{RoleNames.Vendor}";

    public const string AdminOrTourOrContent =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.ContentAdmin},{RoleNames.TourOperator}";

    public const string AuthenticatedStaff =
        $"{RoleNames.Admin},{RoleNames.SuperAdmin},{RoleNames.Vendor},{RoleNames.ContentAdmin},{RoleNames.TourOperator},{RoleNames.AnalyticsViewer}";
}
