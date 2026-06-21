using Microsoft.AspNetCore.Http;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Domain.Specifications;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PublicPoiService : IPublicPoiService
{
    private readonly IUnitOfWork _uow;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PublicPoiService(IUnitOfWork uow, IHttpContextAccessor httpContextAccessor)
    {
        _uow = uow;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<PagedResult<PublicPoiDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        string? languageCode = null,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _uow.Pois.GetPagedAsync(
            page,
            pageSize,
            search,
            category,
            isActive: true,
            approvalStatus: null,
            lifecycleStatus: PoiLifecycleStatus.Active,
            ownerUserId: null,
            includeDeleted: false,
            cancellationToken).ConfigureAwait(false);

        await EnforceExpiryAsync(items, cancellationToken).ConfigureAwait(false);
        var publicPois = items
            .Where(poi => PoiAvailability.IsPubliclyAvailable(poi, DateTime.UtcNow))
            .ToArray();

        var imageUrls = await GetPrimaryApprovedImageUrlsAsync(
            publicPois.Select(poi => poi.Id).ToArray(),
            cancellationToken).ConfigureAwait(false);

        var mapped = publicPois
            .Select(poi => MapPoi(poi, languageCode, imageUrls))
            .ToArray();

        return PagedResult<PublicPoiDto>.Create(mapped, page, pageSize, total);
    }

    public async Task<PublicPoiDto?> GetByIdAsync(
        int id,
        string? languageCode = null,
        CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        if (poi is null || poi.DeletedAt is not null)
        {
            return null;
        }

        await EnforceExpiryAsync(poi, cancellationToken).ConfigureAwait(false);
        if (!PoiAvailability.IsPubliclyAvailable(poi, DateTime.UtcNow))
        {
            return null;
        }

        var imageUrls = await GetPrimaryApprovedImageUrlsAsync([poi.Id], cancellationToken).ConfigureAwait(false);
        return MapPoi(poi, languageCode, imageUrls);
    }

    public async Task<IReadOnlyDictionary<int, string?>> GetPrimaryApprovedImageUrlsAsync(
        IReadOnlyCollection<int> poiIds,
        CancellationToken cancellationToken = default)
    {
        if (poiIds.Count == 0)
        {
            return new Dictionary<int, string?>();
        }

        var images = await _uow.MediaFiles
            .GetApprovedImagesByPoiIdsAsync(poiIds, cancellationToken)
            .ConfigureAwait(false);

        return images
            .GroupBy(image => image.PoiId!.Value)
            .ToDictionary(
                group => group.Key,
                group => (string?)BuildPublicImageUrl(group.OrderByDescending(image => image.UploadedAt).First().Id));
    }

    private PublicPoiDto MapPoi(
        Poi poi,
        string? languageCode,
        IReadOnlyDictionary<int, string?> primaryImageUrls)
    {
        var translation = SelectTranslation(poi, languageCode);
        primaryImageUrls.TryGetValue(poi.Id, out var imageUrl);

        return new PublicPoiDto
        {
            Id = poi.Id,
            Code = poi.Code,
            Name = translation?.Name ?? (string.IsNullOrWhiteSpace(poi.Name) ? poi.Code : poi.Name),
            ShortDescription = translation?.ShortDescription ?? poi.ShortDescription,
            Description = translation?.Description ?? poi.Description,
            Latitude = poi.Latitude,
            Longitude = poi.Longitude,
            RadiusMeters = poi.RadiusMeters,
            Priority = poi.Priority,
            Category = poi.Category,
            ImageUrl = imageUrl,
            ImageUrls = imageUrl is null ? [] : [imageUrl],
            CooldownSeconds = poi.CooldownSeconds,
            MinDwellSeconds = poi.MinDwellSeconds
        };
    }

    private static PoiTranslation? SelectTranslation(Poi poi, string? languageCode)
    {
        var normalizedLanguage = string.IsNullOrWhiteSpace(languageCode)
            ? "vi"
            : languageCode.Trim().ToLowerInvariant();

        return poi.Translations.FirstOrDefault(t => t.LanguageCode == normalizedLanguage)
            ?? poi.Translations.FirstOrDefault(t => t.LanguageCode == "vi");
    }

    private string BuildPublicImageUrl(int mediaFileId)
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        if (request is null)
        {
            return $"/api/v1/public/media/images/{mediaFileId}";
        }

        return $"{request.Scheme}://{request.Host}/api/v1/public/media/images/{mediaFileId}";
    }

    private async Task EnforceExpiryAsync(Poi? poi, CancellationToken cancellationToken)
    {
        if (poi is null)
        {
            return;
        }

        await EnforceExpiryAsync([poi], cancellationToken).ConfigureAwait(false);
    }

    private async Task EnforceExpiryAsync(IReadOnlyList<Poi> pois, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var changed = false;

        foreach (var poi in pois)
        {
            if (poi.LifecycleStatus != PoiLifecycleStatus.Active)
            {
                continue;
            }

            if (poi.ValidUntil.HasValue && poi.ValidUntil.Value < now)
            {
                poi.LifecycleStatus = PoiLifecycleStatus.Expired;
                poi.IsActive = false;
                poi.UpdatedAt = now;
                changed = true;
            }
        }

        if (changed)
        {
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}
