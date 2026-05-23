using VinhHy.NarrationAPI.Domain.Constants;

namespace VinhHy.NarrationAPI.Api.Authorization;

public static class RoleGroups
{
    public const string SuperAdmin = RoleNames.SuperAdmin;

    public const string ContentManagement =
        $"{RoleNames.SuperAdmin},{RoleNames.ContentAdmin}";

    public const string TourOperations =
        $"{RoleNames.SuperAdmin},{RoleNames.TourOperator}";

    public const string Analytics =
        $"{RoleNames.SuperAdmin},{RoleNames.AnalyticsViewer}";

    public const string AdminOrTourOrContent =
        $"{RoleNames.SuperAdmin},{RoleNames.ContentAdmin},{RoleNames.TourOperator}";

    public const string AuthenticatedStaff =
        $"{RoleNames.SuperAdmin},{RoleNames.ContentAdmin},{RoleNames.TourOperator},{RoleNames.AnalyticsViewer}";
}
