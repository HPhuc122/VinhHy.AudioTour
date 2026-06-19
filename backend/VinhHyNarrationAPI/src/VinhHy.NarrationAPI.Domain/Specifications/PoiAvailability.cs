using System.Linq.Expressions;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Domain.Specifications;

public static class PoiAvailability
{
    public static IReadOnlyList<TourPoi> GetPubliclyAvailableTourPois(
        IEnumerable<TourPoi> tourPois,
        DateTime now) =>
        tourPois
            .Where(tp => IsPubliclyAvailable(tp.Poi, now))
            .OrderBy(tp => tp.OrderIndex)
            .ToArray();

    public static Expression<Func<Poi, bool>> IsPubliclyAvailable(DateTime now) =>
        poi => poi.DeletedAt == null
            && poi.LifecycleStatus == PoiLifecycleStatus.Active
            && poi.IsActive
            && (!poi.ValidFrom.HasValue || poi.ValidFrom.Value <= now)
            && (!poi.ValidUntil.HasValue || poi.ValidUntil.Value >= now);

    public static bool IsPubliclyAvailable(Poi poi, DateTime now) =>
        poi.DeletedAt == null
        && poi.LifecycleStatus == PoiLifecycleStatus.Active
        && poi.IsActive
        && (!poi.ValidFrom.HasValue || poi.ValidFrom.Value <= now)
        && (!poi.ValidUntil.HasValue || poi.ValidUntil.Value >= now);
}
