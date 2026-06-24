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
        var categorizedImageUrls = await GetCategorizedApprovedImageUrlsAsync(
            publicPois.Select(poi => poi.Id).ToArray(),
            cancellationToken).ConfigureAwait(false);

        var mapped = publicPois
            .Select(poi => MapPoi(poi, languageCode, imageUrls, categorizedImageUrls))
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
        var categorizedImageUrls = await GetCategorizedApprovedImageUrlsAsync([poi.Id], cancellationToken).ConfigureAwait(false);
        await RecordPublicVisitAsync(poi.Id, TriggerTypes.Manual, languageCode, cancellationToken).ConfigureAwait(false);
        return MapPoi(poi, languageCode, imageUrls, categorizedImageUrls);
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
        IReadOnlyDictionary<int, string?> primaryImageUrls,
        IReadOnlyDictionary<int, IReadOnlyList<MediaFile>> categorizedImageUrls)
    {
        var translation = SelectTranslation(poi, languageCode);
        primaryImageUrls.TryGetValue(poi.Id, out var approvedImageUrl);
        categorizedImageUrls.TryGetValue(poi.Id, out var approvedImages);
        approvedImages ??= [];
        var storedImages = DeserializeImageUrls(poi.ImageUrls)
            .Select(BuildPublicAssetUrl)
            .ToList();
        if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
        {
            var primary = BuildPublicAssetUrl(poi.ImageUrl);
            storedImages.RemoveAll(url => string.Equals(url, primary, StringComparison.OrdinalIgnoreCase));
            storedImages.Insert(0, primary);
        }
        if (storedImages.Count == 0 && approvedImageUrl is not null) storedImages.Add(approvedImageUrl);
        var imageUrl = storedImages.FirstOrDefault();
        var menuImageUrls = approvedImages
            .Where(image => image.ImageCategory == MediaImageCategories.Menu)
            .Select(image => BuildPublicImageUrl(image.Id))
            .ToArray();
        var highlightImageUrls = approvedImages
            .Where(image => image.ImageCategory != MediaImageCategories.Menu)
            .Select(image => BuildPublicImageUrl(image.Id))
            .ToArray();

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
            ImageUrls = storedImages,
            MenuImageUrls = menuImageUrls,
            HighlightImageUrls = highlightImageUrls,
            CooldownSeconds = poi.CooldownSeconds,
            MinDwellSeconds = poi.MinDwellSeconds
        };
    }

    private async Task<IReadOnlyDictionary<int, IReadOnlyList<MediaFile>>> GetCategorizedApprovedImageUrlsAsync(
        IReadOnlyCollection<int> poiIds,
        CancellationToken cancellationToken = default)
    {
        if (poiIds.Count == 0)
        {
            return new Dictionary<int, IReadOnlyList<MediaFile>>();
        }

        var images = await _uow.MediaFiles
            .GetApprovedImagesByPoiIdsAsync(poiIds, cancellationToken)
            .ConfigureAwait(false);

        return images
            .GroupBy(image => image.PoiId!.Value)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<MediaFile>)group.OrderBy(image => image.UploadedAt).ToArray());
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

    private string BuildPublicAssetUrl(string relativePath)
    {
        if (Uri.TryCreate(relativePath, UriKind.Absolute, out _)) return relativePath;
        var request = _httpContextAccessor.HttpContext?.Request;
        var path = relativePath.StartsWith('/') ? relativePath : $"/{relativePath}";
        return request is null ? path : $"{request.Scheme}://{request.Host}{path}";
    }

    private static IReadOnlyList<string> DeserializeImageUrls(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return [];
        try { return System.Text.Json.JsonSerializer.Deserialize<string[]>(value) ?? []; }
        catch (System.Text.Json.JsonException) { return []; }
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

    private async Task RecordPublicVisitAsync(
        int poiId,
        string triggerType,
        string? languageCode,
        CancellationToken cancellationToken)
    {
        var deviceId = await ResolveKnownDeviceIdAsync(cancellationToken).ConfigureAwait(false);

        await _uow.NarrationLogs.AddAsync(
            new NarrationLog
            {
                POIId = poiId,
                TriggerType = triggerType,
                LanguageCode = NormalizeLanguageCode(languageCode),
                PlayedAt = DateTime.UtcNow,
                DeviceId = deviceId,
                Synced = true
            },
            cancellationToken).ConfigureAwait(false);

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string NormalizeLanguageCode(string? languageCode) =>
        string.IsNullOrWhiteSpace(languageCode) ? "vi" : languageCode.Trim().ToLowerInvariant();

    private async Task<string?> ResolveKnownDeviceIdAsync(CancellationToken cancellationToken)
    {
        var candidate = _httpContextAccessor.HttpContext?.Request.Headers["X-Guest-Device-Id"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return null;
        }

        var deviceId = candidate.Trim();
        var device = await _uow.Devices.GetByDeviceIdAsync(deviceId, cancellationToken).ConfigureAwait(false);
        return device is null ? null : deviceId;
    }
}
